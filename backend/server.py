from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from services.attendance_cache import attendance_cache

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection (optional for status checks)
mongo_url = os.environ.get('MONGO_URL')
db = None
client = None
if mongo_url:
    try:
        client = AsyncIOMotorClient(mongo_url)
        db_name = os.environ.get('DB_NAME', 'gmit_attendance')
        db = client[db_name]
    except Exception as e:
        logger.warning(f"MongoDB connection skipped or failed: {e}")

# Create the main app without a prefix
app = FastAPI(title="GMIT Smart Attendance API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


@app.get("/")
async def app_root():
    return {
        "message": "GMIT Smart Attendance API",
        "status": "online",
        "api_docs": "/docs",
        "api_endpoint": "/api"
    }


@api_router.get("/")
async def root():
    return {"message": "GMIT Smart Attendance API", "status": "online"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    if db is not None:
        doc = status_obj.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if db is None:
        return []
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# -----------------------------------------------------------------------------
# ATTENDANCE ENDPOINTS (Google Drive XLSX Integration)
# -----------------------------------------------------------------------------

@api_router.get("/attendance/sync-status")
async def get_attendance_sync_status():
    """Admin/debug endpoint returning Google Drive XLSX sync health metrics."""
    return attendance_cache.get_sync_status()


@api_router.get("/attendance")
async def get_attendance(
    action: Optional[str] = Query(default="student"),
    usn: Optional[str] = Query(default=None),
    section: Optional[str] = Query(default=None),
    refresh: Optional[str] = Query(default=None),
):
    """
    Main Attendance API endpoint supporting both action-based Apps Script compatibility
    and direct query parameters.
    """
    force = refresh in ["1", "true", "True"]

    if action == "health":
        status = attendance_cache.get_sync_status()
        return {
            "success": True,
            "app": "GMIT Attendance API (Google Drive XLSX)",
            "status": status["status"],
            "sections": status["sections"],
        }

    if action == "sections":
        status = attendance_cache.get_sync_status()
        sections_dict = {sec: {"available": True} for sec in status["sections"]}
        return {"success": True, "sections": sections_dict}

    if action in ["student", "attendance"] or usn:
        if not usn:
            raise HTTPException(status_code=400, detail="USN parameter is required")
        
        try:
            record = attendance_cache.get_student(usn=usn, section=section, force=force)
        except Exception as e:
            logger.error(f"Error serving attendance for USN {usn}: {e}")
            raise HTTPException(status_code=503, detail="Attendance service temporarily unavailable")

        if not record:
            raise HTTPException(status_code=404, detail="Student record not found")

        return record

    if action == "students" and section:
        try:
            students = attendance_cache.get_section_students(section=section, force=force)
            return {"success": True, "section": section, "students": students}
        except Exception as e:
            raise HTTPException(status_code=503, detail="Attendance service temporarily unavailable")

    raise HTTPException(status_code=400, detail="Invalid action or parameters")


@api_router.get("/attendance/student")
async def get_student_attendance_direct(
    usn: str = Query(..., description="Student USN"),
    section: Optional[str] = Query(default=None),
    refresh: Optional[str] = Query(default=None),
):
    """Direct student attendance endpoint."""
    return await get_attendance(action="student", usn=usn, section=section, refresh=refresh)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Startup initialization: verify Google Drive connection, download & parse XLSX."""
    logger.info("Initializing GMIT Smart Attendance Service...")
    try:
        data = attendance_cache.refresh_cache(force_download=True)
        status = attendance_cache.get_sync_status()
        print("\n" + "="*60)
        print("GMIT Attendance Service Initialization:")
        print(f"Google Drive connection: OK")
        print(f"Attendance file ID: {status['file_id']}")
        print(f"Status: {status['status']}")
        print(f"Sheets found: {', '.join(status['sections'])}")
        print(f"Students loaded: {status['students_loaded']}")
        print(f"Last sync: {status['last_sync']}")
        print("="*60 + "\n")
    except Exception as e:
        logger.warning(f"Initial Google Drive sync during startup encountered issue: {e}")
        logger.info("Service started in lazy initialization mode. Cache will sync on first request.")


@app.on_event("shutdown")
async def shutdown_event():
    if client:
        client.close()