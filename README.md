# GMIT Smart Attendance Portal 🎓

A modern, full-stack attendance portal built with **Next.js 15 (TypeScript)** for the student frontend and **FastAPI (Python)** for backend attendance parsing. Attendance data is retrieved directly from a Google Drive-hosted Excel workbook (`.xlsx`), automatically parsed, cached, and rendered with premium glassmorphism UI metrics.

---

## 🚀 Key Features & Attendance Logic

### 1. Active vs. Not Started Subjects
* **Active Subjects (e.g., SEPM, CN, TOC, WL, AI)**:
  * Subjects where classes have been conducted (`conducted > 0`).
  * Displays attendance percentage (e.g., `75%`, `90%`, `100%`, `83.33%`).
  * Displays status badge (`ON TRACK`, `EXCELLENT`, `CRITICAL`, `AT RISK`).
  * Displays lecturer name parsed directly from sheet headers (e.g., `SHALINI M R`, `NANDITHA G`, `HARSHITHA H V`, `SUSHMA P M`).
  * Displays progress ring and attended / conducted class count (e.g., `12 / 16`).

* **Not Started Subjects (e.g., RM, ESM)**:
  * Identified when no classes have been conducted (`conducted == 0` or missing course code).
  * Displays `—` instead of `0%` or `NaN%`.
  * Displays `Faculty to be assigned` for lecturer name.
  * Displays `● NOT STARTED` status badge.
  * Displays `0 / 0` classes.
  * **Exclusion from Overall Percentage**: Not Started subjects are **completely excluded** from overall student attendance percentage calculations so they do not artificially lower student averages.

---

## 🛠️ Tech Stack & Architecture

```
                       ┌─────────────────────────┐
                       │   Next.js 15 Frontend   │
                       │  (Tailwind CSS + React) │
                       └────────────┬────────────┘
                                    │ HTTP / JSON API
                                    ▼
                       ┌─────────────────────────┐
                       │     FastAPI Backend     │
                       │ (Python 3.11 + openpyxl)│
                       └────────────┬────────────┘
                                    │ Google Drive API / XLSX Download
                                    ▼
                       ┌─────────────────────────┐
                       │ Google Drive Excel File │
                       │    (Attendance XLSX)    │
                       └─────────────────────────┘
```

* **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Lucide Icons.
* **Backend**: FastAPI, PyYAML, openpyxl, Uvicorn.
* **Data Source**: Google Drive public/shared `.xlsx` spreadsheet workbook.

---

## 📁 Repository Structure

```text
.
├── backend/
│   ├── main.py               # FastAPI entry point
│   ├── server.py             # Server runner
│   ├── requirements.txt      # Python dependencies
│   └── services/
│       ├── xlsx_parser.py    # Excel workbook parsing & calculation logic
│       ├── google_drive.py  # Google Drive file downloader
│       └── attendance_cache.py # In-memory backend cache
├── frontend/
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React UI components (SubjectCard, AttendanceRing, etc.)
│   ├── lib/                  # Attendance normalization & status derivation utilities
│   ├── package.json          # Node dependencies
│   └── vercel.json           # Frontend Vercel configuration
├── render.yaml               # Render Blueprint deployment config
├── vercel.json               # Root Vercel deployment config
└── README.md                 # Project documentation
```

---

## 🌐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
|---|---|---|
| `GOOGLE_DRIVE_FILE_ID` | File ID of Google Drive attendance `.xlsx` workbook | `1a2b3c4d5e6f...` |
| `ALLOWED_SECTIONS` | Comma-separated list of supported sections | `3A,3B,5A,5B,7A,7B` |
| `ATTENDANCE_CACHE_TTL_SECONDS` | Cache duration in seconds before refetching | `300` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default / Example |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Public URL of deployed FastAPI backend | `https://gmit-attendance-backend.onrender.com` |

---

## 💻 Local Development Setup

### 1. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn server:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`.

### 2. Frontend Setup (Next.js)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
yarn install # or npm install

# Start Next.js dev server
yarn dev # or npm run dev
```
Frontend app will run at `http://localhost:3000`.

---

## ☁️ Deployment Instructions

### 1. Deploying Frontend to Vercel

#### Method A: Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/new) and import your GitHub repository (`jaggu-max/attendcheck`).
2. Set **Root Directory** to `frontend`.
3. Framework Preset will auto-detect as **Next.js**.
4. In **Environment Variables**, add:
   * `NEXT_PUBLIC_BACKEND_URL` = `https://your-backend-service.onrender.com`
5. Click **Deploy**.

#### Method B: Vercel CLI
```bash
cd frontend
vercel --prod
```

---

### 2. Deploying Backend to Render

#### Method A: Using `render.yaml` Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/blueprints).
2. Click **New Blueprint Instance** and connect your repository (`jaggu-max/attendcheck`).
3. Render will automatically detect `render.yaml` and create:
   * `gmit-attendance-backend` (Python FastAPI service)
   * `gmit-attendance-frontend` (Node Web service)
4. Populate required secret environment variables:
   * `GOOGLE_DRIVE_FILE_ID`
5. Click **Apply**.

#### Method B: Manual Web Service on Render
1. Create a new **Web Service** on Render.
2. Select your GitHub repository.
3. Configure settings:
   * **Name**: `gmit-attendance-backend`
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (`GOOGLE_DRIVE_FILE_ID`).
5. Click **Create Web Service**.

---

## 🧪 Verification & Testing

To verify backend Excel parsing:
```bash
cd backend
python -c "from services.xlsx_parser import parse_xlsx_bytes; print('Parser imported successfully')"
```

---

## 📄 License
Created for GMIT Attendance Management. All rights reserved.
