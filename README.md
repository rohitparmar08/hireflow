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
│   │   ├── urls.py             # Root URL routing (/api/v1/ and /api/v1/auth/)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── apps/
│       ├── core/               # Health check and core metadata endpoints
│       └── accounts/           # Custom User model, SimpleJWT auth, RBAC, profile endpoints
├── frontend/
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json            # React 19, Tailwind CSS, Axios, React Router
│   ├── vite.config.js          # Vite build config
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js
│   └── src/
│       ├── api/                # Axios instance & auth interceptors (client.js, auth.api.js)
│       ├── context/            # AuthContext (login, register, logout, profile state)
│       ├── routes/             # ProtectedRoute & RoleGuard components
│       ├── components/         # Navbar, badges, layout primitives
│       ├── pages/              # LandingPage, Login, Register, Profile, Role Dashboards
│       └── App.jsx             # React Router hierarchy
├── .gitignore                  # Git ignore rules for Python, Node, and secrets
└── README.md                   # Setup documentation & developer guide
```

---

## 🔐 Authentication & RBAC API Endpoints

All auth endpoints are versioned under `/api/v1/auth/`:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/` | Public | Register new user as `RECRUITER` or `CANDIDATE`. Returns tokens and user data. |
| `POST` | `/api/v1/auth/login/` | Public | Obtain access token (15 min) and refresh token (7 days). Returns user profile. |
| `POST` | `/api/v1/auth/refresh/` | Public | Refresh expired access token with automatic token rotation. |
| `POST` | `/api/v1/auth/logout/` | Authenticated | Blacklists the refresh token preventing reuse. |
| `GET` | `/api/v1/auth/me/` | Authenticated | Retrieve current user profile and role. |
| `PATCH` | `/api/v1/auth/profile/` | Authenticated | Update profile details (first name, headline, bio, etc.). Role escalation is forbidden. |

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

# Create a Python virtual environment (if not already created)
python -m venv .venv

# Activate the virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Create your local environment file (if not already present)
cp .env.example .env

# Run database migrations (creates custom User, auth, and blacklist tables)
python manage.py migrate

# Run the test suite (14 automated tests)
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

# Install frontend dependencies
npm install

# Create your frontend environment file (if not already present)
cp .env.example .env

# Start the Vite development server
npm run dev
```
The frontend is now running at `http://localhost:5173/`. Open this URL in your browser to test registration, login, profile updates, and role-based redirects.

---

## 🧪 Testing & Verification

1. **Automated Backend Test Suite**:
   ```bash
   cd hireflow/backend
   .\.venv\Scripts\python.exe manage.py test
   ```
   Runs 14 automated tests covering candidate/recruiter registration, password validation, login, token refresh rotation, logout token blacklisting, profile updates, role privilege escalation defenses, and API health checks.

2. **Frontend Production Build**:
   ```bash
   cd hireflow/frontend
   npm run build
   ```

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1: Foundation & Tooling Setup**
- [x] **Phase 2: Authentication, Custom User Model & RBAC**
- [ ] **Phase 3: Job Management Module**
- [ ] **Phase 4: Candidate Application Flow & Resume Ingestion Engine**
- [ ] **Phase 5: AI Resume-to-Job Matching Engine & Explainable Scoring**
- [ ] **Phase 6: Frontend Architecture, Dashboards & Role-Based Navigation**
- [ ] **Phase 7: Recruiter Review Pipeline & AI Insights UI**
- [ ] **Phase 8: Validation, Testing Suite & Deployment Hardening**
