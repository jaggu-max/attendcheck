import os
import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from services.google_drive_service import GoogleDriveService
from services.xlsx_parser import parse_xlsx_bytes

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = int(os.environ.get("ATTENDANCE_CACHE_TTL_SECONDS", "300"))


class AttendanceCacheManager:
    def __init__(self, drive_service: Optional[GoogleDriveService] = None):
        self.drive_service = drive_service or GoogleDriveService()
        self._parsed_data: Optional[Dict[str, Any]] = None
        self.last_sync_timestamp: float = 0.0
        self.last_sync_iso: Optional[str] = None
        self.last_modified_drive: Optional[str] = None
        self.status: str = "uninitialized"
        self.last_error: Optional[str] = None

    def refresh_cache(self, force_download: bool = False) -> Dict[str, Any]:
        """
        Check if Google Drive file has changed or cache TTL expired.
        If file changed, download XLSX and parse. Otherwise reuse cached data.
        """
        now = time.time()
        
        # If cache is valid and TTL not exceeded, return cached data
        if not force_download and self._parsed_data and (now - self.last_sync_timestamp < CACHE_TTL_SECONDS):
            return self._parsed_data

        try:
            # Check file metadata first for file change detection
            metadata = self.drive_service.get_file_metadata()
            drive_modified = metadata.get("modifiedTime")

            # File Change Detection: if file modifiedTime is unchanged and we have parsed cache
            if (
                not force_download
                and self._parsed_data
                and drive_modified
                and drive_modified == self.last_modified_drive
            ):
                logger.info(f"Drive XLSX file modification time ({drive_modified}) unchanged. Extending cache TTL.")
                self.last_sync_timestamp = now
                self.last_sync_iso = datetime.now(timezone.utc).isoformat()
                self.status = "healthy"
                return self._parsed_data

            # File has changed or force download or cold cache: download and parse
            logger.info(f"Downloading latest XLSX file from Google Drive (File ID: {self.drive_service.file_id})...")
            xlsx_bytes = self.drive_service.download_file_bytes()
            parsed = parse_xlsx_bytes(xlsx_bytes)

            # Update cache state
            self._parsed_data = parsed
            self.last_sync_timestamp = now
            self.last_sync_iso = datetime.now(timezone.utc).isoformat()
            self.last_modified_drive = drive_modified
            self.status = "healthy"
            self.last_error = None
            
            logger.info(f"Successfully refreshed attendance cache: {len(parsed['students_by_usn'])} students loaded across {len(parsed['sections'])} sections.")
            return parsed

        except Exception as e:
            err_msg = str(e)
            logger.error(f"Error refreshing attendance cache from Google Drive: {err_msg}")
            self.last_error = err_msg

            # Resilient fallback: return stale cache if available
            if self._parsed_data:
                logger.warning("Serving stale attendance cache due to Google Drive sync error.")
                self.status = "degraded"
                return self._parsed_data
            
            self.status = "error"
            raise RuntimeError(f"Attendance service temporarily unavailable: {err_msg}")

    def get_student(self, usn: str, section: Optional[str] = None, force: bool = False) -> Optional[Dict[str, Any]]:
        data = self.refresh_cache(force_download=force)
        norm_usn = usn.strip().upper()
        
        student = data["students_by_usn"].get(norm_usn)
        if student:
            # Add updatedAt timestamp
            student_copy = dict(student)
            student_copy["updatedAt"] = self.last_sync_iso or datetime.now(timezone.utc).isoformat()
            return student_copy
        
        return None

    def get_section_students(self, section: str, force: bool = False) -> List[Dict[str, Any]]:
        data = self.refresh_cache(force_download=force)
        norm_sec = section.strip().upper()
        return data["students_by_section"].get(norm_sec, [])

    def get_sync_status(self) -> Dict[str, Any]:
        students_count = len(self._parsed_data["students_by_usn"]) if self._parsed_data else 0
        sections = self._parsed_data["sections"] if self._parsed_data else []

        return {
            "status": self.status,
            "source": "google_drive_xlsx",
            "file_id": self.drive_service.file_id,
            "last_sync": self.last_sync_iso,
            "last_modified": self.last_modified_drive,
            "students_loaded": students_count,
            "sections": sections,
            "error": self.last_error,
        }


# Global cache manager instance
attendance_cache = AttendanceCacheManager()
