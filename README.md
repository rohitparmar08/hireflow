# HireFlow — AI-Powered Recruitment Management Platform

HireFlow is a modern, full-stack recruitment and applicant tracking platform featuring role-based workflows, resume parsing, and explainable AI-assisted candidate-to-job matching.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Axios
- **Backend**: Django 5, Django REST Framework (DRF), SimpleJWT
- **Database**: PostgreSQL (Production-ready via `DATABASE_URL`) / SQLite (Zero-friction local dev fallback)
- **Authentication**: JWT (JSON Web Tokens via SimpleJWT with 15m access / 7d refresh, rotation, & blacklist)
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
│   │   │   ├── base.py         # Shared base configuration & SimpleJWT setup
│   │   │   ├── local.py        # Local development (SQLite, DEBUG=True)
│   │   │   └── production.py   # Production (PostgreSQL, security headers)
│   │   ├── urls.py             # Root URL routing (/api/v1/)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── apps/
│       ├── core/               # Health check and core metadata endpoints
│       ├── accounts/           # Custom User model, SimpleJWT auth, RBAC, profile endpoints
│       └── jobs/               # JobPosting model, REST CRUD APIs, filters, pagination, admin
├── frontend/
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json            # React 19, Tailwind CSS, Axios, React Router
│   ├── vite.config.js          # Vite build config
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js
│   └── src/
│       ├── api/                # Axios instance, auth interceptors & API services (auth, jobs)
│       ├── context/            # AuthContext (login, register, logout, profile state)
│       ├── routes/             # ProtectedRoute & RoleGuard components
│       ├── components/         # Navbar, badges, layout primitives
│       ├── pages/
│       │   ├── auth/           # Login, Register
│       │   ├── jobs/           # JobListing (public board), JobDetail
│       │   ├── recruiter/      # RecruiterDashboard, CreateJob, EditJob
│       │   ├── candidate/      # CandidateDashboard
│       │   ├── LandingPage.jsx
│       │   └── Profile.jsx
│       └── App.jsx             # React Router hierarchy
├── .gitignore                  # Git ignore rules for Python, Node, and secrets
└── README.md                   # Setup documentation & developer guide
```

---

## 🔐 API Endpoints Reference

All endpoints are versioned under `/api/v1/`:

### Authentication & User Management (`/api/v1/auth/`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/` | Public | Register new user as `RECRUITER` or `CANDIDATE`. Returns tokens and user data. |
| `POST` | `/api/v1/auth/login/` | Public | Obtain access token (15 min) and refresh token (7 days). Returns user profile. |
| `POST` | `/api/v1/auth/refresh/` | Public | Refresh expired access token with automatic token rotation. |
| `POST` | `/api/v1/auth/logout/` | Authenticated | Blacklists the refresh token preventing reuse. |
| `GET` | `/api/v1/auth/me/` | Authenticated | Retrieve current user profile and role. |
| `PATCH` | `/api/v1/auth/profile/` | Authenticated | Update profile details. Role escalation is forbidden. |

### Job Postings & Management (`/api/v1/jobs/` & `/api/v1/recruiter/jobs/`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/jobs/` | Public | List active job openings. Supports pagination, keyword search, and filters. |
| `GET` | `/api/v1/jobs/{id}/` | Public / Owner | View job details (active jobs are public; draft/closed jobs restricted to owner). |
| `POST` | `/api/v1/jobs/` | Recruiter Only | Create a new job opening (`ACTIVE` or `DRAFT`). Owner assigned automatically. |
| `PATCH` | `/api/v1/jobs/{id}/` | Recruiter (Owner) | Partially update a job posting. |
| `PUT` | `/api/v1/jobs/{id}/` | Recruiter (Owner) | Fully update a job posting. |
| `DELETE` | `/api/v1/jobs/{id}/` | Recruiter (Owner) | Soft-delete / Archive job to `CLOSED` status. |
| `GET` | `/api/v1/recruiter/jobs/`| Recruiter Only | View personal job openings across all statuses (`?status=ACTIVE\|DRAFT\|CLOSED`). |

#### Supported Filter & Search Query Parameters for `GET /api/v1/jobs/`:
- `search`: Case-insensitive search on title, company name, or description.
- `location`: Location substring search.
- `location_type`: `REMOTE`, `HYBRID`, or `ONSITE`.
- `employment_type`: `FULL_TIME`, `PART_TIME`, `CONTRACT`, or `INTERNSHIP`.
- `experience_level`: `ENTRY`, `MID`, `SENIOR`, `LEAD`, or `EXECUTIVE`.
- `skill`: Matches required or optional skills.
- `min_salary`: Minimum salary filter.
- `page`: Page number for pagination.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10+ (tested with Python 3.14)
- **Node.js**: v18+ (tested with Node v24, npm 11+)
- **Git**

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd hireflow/backend

# Activate the virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Run the test suite (24 automated tests across core, accounts, and jobs)
python manage.py test

# Start the development server
python manage.py runserver 127.0.0.1:8000
```
The backend API is now running at `http://127.0.0.1:8000/`.

---

### 3. Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory
cd hireflow/frontend

# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```
The frontend is now running at `http://localhost:5173/`. Open this URL in your browser to test job browsing, searching, filtering, posting jobs as a recruiter, and role-based views.

---

## 🧪 Testing & Verification

1. **Automated Backend Test Suite**:
   ```bash
   cd hireflow/backend
   .\.venv\Scripts\python.exe manage.py test
   ```
   Runs 24 automated tests covering:
   - Public access to active jobs and draft job hiding
   - Recruiter job creation, editing, and archive/closing
   - Candidate and anonymous posting restrictions
   - Ownership enforcement (Recruiter A cannot alter Recruiter B's jobs)
   - Multi-parameter search, filtering, and pagination
   - Salary range and skill tag validation
   - JWT authentication, refresh rotation, and logout blacklisting
   - API root and health check endpoints

2. **Frontend Production Build**:
   ```bash
   cd hireflow/frontend
   npm run build
   ```

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1: Foundation & Tooling Setup**
- [x] **Phase 2: Authentication, Custom User Model & RBAC**
- [x] **Phase 3: Job Management Module**
- [ ] **Phase 4: Candidate Application Flow & Resume Ingestion Engine**
- [ ] **Phase 5: AI Resume-to-Job Matching Engine & Explainable Scoring**
- [ ] **Phase 6: Frontend Architecture, Dashboards & Role-Based Navigation**
- [ ] **Phase 7: Recruiter Review Pipeline & AI Insights UI**
- [ ] **Phase 8: Validation, Testing Suite & Deployment Hardening**
