# HireFlow — AI-Powered Recruitment Management Platform

HireFlow is a modern, full-stack recruitment and applicant tracking platform featuring role-based workflows, resume parsing, and explainable AI-assisted candidate-to-job matching.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Django 5, Django REST Framework (DRF)
- **Database**: PostgreSQL (Production-ready via `DATABASE_URL`) / SQLite (Zero-friction local dev fallback)
- **Authentication**: JWT (JSON Web Tokens via SimpleJWT)
- **API Architecture**: Versioned REST API (`/api/v1/`) with CORS headers configured

---

## 📂 Project Structure

```
hireflow/
├── backend/
│   ├── .env.example            # Backend environment variable template
│   ├── manage.py               # Django management script
│   ├── requirements.txt        # Backend dependencies
│   ├── config/                 # Project configuration
│   │   ├── settings/
│   │   │   ├── base.py         # Shared base configuration
│   │   │   ├── local.py        # Local development (SQLite, DEBUG=True)
│   │   │   └── production.py   # Production (PostgreSQL, security headers)
│   │   ├── urls.py             # Root URL routing (/api/v1/)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── apps/
│       └── core/               # Health check and core metadata endpoints
├── frontend/
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite build config
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx             # Foundational dashboard & health check UI
│       └── main.jsx
├── .gitignore                  # Git ignore rules for Python, Node, and secrets
└── README.md                   # Setup documentation & developer guide
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10+ (tested through 3.14)
- **Node.js**: v18+ (tested with Node v24, npm 11+)
- **Git**

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd hireflow/backend

# Create a Python virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Create your local environment file
cp .env.example .env
# On Windows PowerShell if cp is not aliased:
# Copy-Item .env.example .env

# Run database migrations (creates local SQLite database)
python manage.py migrate

# Run the test suite
python manage.py test

# Start the development server
python manage.py runserver
```
The backend API is now running at `http://127.0.0.1:8000/`.
- API Root: `http://127.0.0.1:8000/api/v1/`
- Health Check: `http://127.0.0.1:8000/api/v1/health/`

---

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory
cd hireflow/frontend

# Install frontend dependencies
npm install

# Create your frontend environment file
cp .env.example .env
# On Windows PowerShell if cp is not aliased:
# Copy-Item .env.example .env

# Start the Vite development server
npm run dev
```
The frontend is now running at `http://localhost:5173/`. Open this URL in your browser to view the foundational landing page with an interactive backend connectivity indicator.

---

## 🔍 Verification & Health Checks

1. **Backend Health Check**:
   ```bash
   curl http://127.0.0.1:8000/api/v1/health/
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "HireFlow API",
     "version": "1.0.0",
     "debug_mode": true,
     "database": "healthy"
   }
   ```
2. **Frontend Production Build**:
   ```bash
   cd hireflow/frontend
   npm run build
   ```

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1: Foundation & Tooling Setup**
- [ ] **Phase 2: Authentication, Custom User Model & RBAC**
- [ ] **Phase 3: Job Management Module**
- [ ] **Phase 4: Candidate Application Flow & Resume Ingestion Engine**
- [ ] **Phase 5: AI Resume-to-Job Matching Engine & Explainable Scoring**
- [ ] **Phase 6: Frontend Architecture, Dashboards & Role-Based Navigation**
- [ ] **Phase 7: Recruiter Review Pipeline & AI Insights UI**
- [ ] **Phase 8: Validation, Testing Suite & Deployment Hardening**
