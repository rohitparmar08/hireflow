# HireFlow — AI-Powered Recruitment Management Platform

[![CI/CD Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/rohitparmar08)
[![Backend Tests](https://img.shields.io/badge/django%20tests-49%2F49%20passed-success.svg)](https://github.com/rohitparmar08)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite%208-blue.svg)](https://github.com/rohitparmar08)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

HireFlow is an enterprise-grade, full-stack applicant tracking and recruitment management platform (ATS). Built with **Django REST Framework**, **React 19**, **Tailwind CSS**, and a **Python Scikit-Learn NLP AI matching engine**, it provides role-based workflows for job seekers and hiring teams, automated resume ingestion (PDF/DOCX), and explainable candidate-to-job qualification scoring.

---

## 🏗️ Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 19 + Vite 8 + Tailwind CSS + React Router v7 + Axios Interceptors          |
|  - Role-Based Portals (Recruiter vs Candidate)                                    |
|  - Interactive Skill Tag Builder & Document Dropzone Uploads                      |
|  - Real-time Visual Match Score Breakdown & Candidate Ranker                      |
+-----------------------------------------+-----------------------------------------+
                                          |
                      HTTPS / JSON REST   | JWT Bearer Token (15m access / 7d refresh)
                                          v
+-----------------------------------------------------------------------------------+
|                                 GATEWAY TIER                                      |
|  Nginx Alpine Reverse Proxy + WhiteNoise Static Compression + SSL Termination     |
|  - Security Headers (HSTS, CSP, X-Frame-Options: DENY, XSS-Protection)           |
|  - Client-Side SPA Route Fallback & Streamed Proxying                             |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                APPLICATION TIER                                   |
|  Django 5 + Django REST Framework + Gunicorn WSGI Workers (Multi-threaded)        |
|  - Custom User Model (RBAC: RECRUITER / CANDIDATE)                                |
|  - Job Management (Draft / Active / Closed lifecycles, full-text filters)         |
|  - Resume Ingestion Engine (PyPDF + Python-docx, signature validation, safe UUID)  |
|  - Explainable AI Match Engine (Scikit-Learn TF-IDF, Cosine Similarity, Taxonomy) |
|  - Authenticated Document Streaming (Private FileResponse with Object-Level RBAC)|
+-------------------+---------------------------------------+-----------------------+
                    |                                       |
                    v                                       v
+-----------------------------------+   +-------------------------------------------+
|          DATABASE TIER            |   |               STORAGE TIER                |
|  PostgreSQL 16 (Production)       |   |  Private Resumes Storage (Encrypted Disks)|
|  SQLite 3 (Zero-Friction Dev)     |   |  Object-Level Permission Controlled Access|
+-----------------------------------+   +-------------------------------------------+
```

### Core Technologies
- **Frontend**: React 19, Vite 8.3, Tailwind CSS v3, React Router v7, Axios.
- **Backend**: Python 3.12/3.14, Django 5.1, Django REST Framework 3.15, Gunicorn 23.
- **Authentication**: JWT via SimpleJWT (Token Rotation, Blacklist Revocation, HttpOnly cookies ready).
- **AI / NLP**: Scikit-Learn (TF-IDF Vectorization, Bi-Gram Tokenizer, Cosine Similarity), PyPDF, Python-docx.
- **Production Static Serving**: WhiteNoise 6.8 with Manifest Compression (`CompressedManifestStaticFilesStorage`).
- **Database**: PostgreSQL 16 (Production via `dj-database-url`), SQLite (Local development fallback).
- **Containerization**: Docker, Docker Compose, Multi-stage unprivileged containers, Nginx Alpine.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC)
- **Two First-Class Roles**: `CANDIDATE` (Job Seekers) and `RECRUITER` (Hiring Managers).
- **Strict Separation**: Candidates cannot create jobs or view other candidates' applications; recruiters cannot apply for jobs and can only access applications submitted to their own job postings.
- **Immutable Credentials**: Primary email identities and roles are protected against privilege escalation.

### 2. Job Posting & Lifecycle Management
- **Full REST CRUD**: Create, view, update, and soft-delete/archive job openings.
- **Status Lifecycle**: `DRAFT` (private work-in-progress), `ACTIVE` (publicly listed on job board), and `CLOSED` (archived, delisted, with applicant history preserved).
- **Search & Filtering**: Multi-parameter search across titles, companies, locations (Remote, Hybrid, Onsite), employment types (Full-Time, Contract, Internship), and seniority tiers (Entry, Mid, Senior, Lead, Executive).

### 3. Resume Ingestion & Parsing Engine
- **Supported Formats**: Machine-readable PDF (`.pdf`) and Microsoft Word (`.docx`), up to 5 MB.
- **Validation**: Strict MIME-type checking, file extension whitelist, and binary magic byte verification preventing malware uploads.
- **Deterministic Information Extraction**: Automatically extracts contact details, degree credentials, and matches against a 150+ canonical technical skill taxonomy.
- **Private Document Streaming**: Resumes are stored outside public web roots. Files are served exclusively via authenticated `FileResponse` streams enforcing object-level permissions.

### 4. Explainable AI Match Engine
- **No Hallucinations**: Runs locally without external paid APIs, black-box hallucinations, or third-party data leakage.
- **Transparent Formula**: Normalized score (0.0 to 100.0) combining:
  - **40% Required Skills**: Exact taxonomy intersection against required tags.
  - **15% Optional Skills**: Bonus taxonomy intersection against nice-to-have tags.
  - **25% Text Similarity**: Bi-gram TF-IDF vectorizer + Cosine Similarity comparing resume corpus and cover note against job description.
  - **10% Experience Level**: Seniority keyword detection and years-of-experience regex matching.
  - **10% Education Tier**: Degree credential taxonomy classification.
- **Full Explainability**: Surfaces exact matching skills, actionable missing skills, component contributions, and plain-English narrative justifications.

---

## 🔐 API Reference

All REST endpoints are versioned under `/api/v1/`:

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health/` or `/healthz/` | Public | Container health probe & database connection check |
| `POST` | `/api/v1/auth/register/` | Public | Register as Candidate or Recruiter |
| `POST` | `/api/v1/auth/login/` | Public | Obtain 15-min JWT access token & 7-day refresh token |
| `POST` | `/api/v1/auth/refresh/` | Public | Refresh access token with automatic token rotation |
| `POST` | `/api/v1/auth/logout/` | Authenticated | Blacklist refresh token preventing reuse |
| `GET` | `/api/v1/auth/me/` | Authenticated | Retrieve current user profile and role |
| `PATCH`| `/api/v1/auth/profile/` | Authenticated | Update user profile details (role is immutable) |
| `GET` | `/api/v1/jobs/` | Public | Search and filter active job openings |
| `GET` | `/api/v1/jobs/{id}/` | Public / Owner | View job details (drafts restricted to owner) |
| `POST` | `/api/v1/jobs/` | Recruiter | Post new job opening (`ACTIVE` or `DRAFT`) |
| `PATCH`| `/api/v1/jobs/{id}/` | Recruiter (Owner)| Edit existing job posting |
| `DELETE`| `/api/v1/jobs/{id}/` | Recruiter (Owner)| Archive/Close job posting |
| `GET` | `/api/v1/recruiter/jobs/`| Recruiter | List recruiter's own jobs across all statuses |
| `POST` | `/api/v1/jobs/{id}/apply/`| Candidate | Upload resume document & apply for opening |
| `GET` | `/api/v1/candidate/applications/` | Candidate | View candidate's application history & scores |
| `GET` | `/api/v1/jobs/{id}/applications/` | Recruiter (Owner)| Pipeline view with applicant ranker & filters |
| `GET` | `/api/v1/applications/{id}/` | Applicant \| Owner | View application detail & AI score breakdown |
| `PATCH`| `/api/v1/applications/{id}/` | Applicant \| Owner | Transition application status (`SHORTLISTED`, etc.) |
| `GET` | `/api/v1/applications/{id}/resume/` | Applicant \| Owner | Stream authenticated private resume document |
| `GET` | `/api/v1/applications/{id}/match/` | Applicant \| Owner | Inspect explainable AI match calculation |
| `POST` | `/api/v1/applications/{id}/match/` | Applicant \| Owner | Force recalculate and refresh AI match score |

---

## 🐳 Docker & Production Deployment

HireFlow includes multi-container Docker configuration with unprivileged non-root security and persistent volumes.

### 1. Docker Compose (Local Production Simulation)

```bash
# Clone the repository
git clone https://github.com/rohitparmar08/hireflow.git
cd hireflow

# Copy environment template
cp .env.example .env

# Build and start all services in detached mode
docker compose up -d --build

# View logs across all services
docker compose logs -f

# Verify service health
docker compose ps
```

Services exposed:
- **Frontend SPA**: `http://localhost:3000` (Nginx Alpine reverse proxy)
- **Backend API**: `http://localhost:8000` (Gunicorn WSGI)
- **PostgreSQL Database**: `localhost:5432` (PostgreSQL 16 Alpine)
- **Health Check**: `http://localhost:8000/health/`

To shut down containers and preserve data:
```bash
docker compose down
```

---

### 2. Cloud Deployment (Render Blueprint)

HireFlow includes a complete Infrastructure-as-Code `render.yaml` blueprint for 1-click cloud deployment:

1. Fork or push this repository to your GitHub account (`rohitparmar08/hireflow`).
2. Log in to [Render](https://render.com) and click **New +** -> **Blueprint**.
3. Select the `hireflow` repository.
4. Render automatically provisions:
   - **PostgreSQL Database**: Free managed PostgreSQL (`hireflow-postgres`).
   - **Backend Web Service**: Python 3 runtime, auto-runs migrations and WhiteNoise `collectstatic`.
   - **Frontend Static Site**: Node build, Nginx-equivalent routing with SPA fallback.
   - **Persistent Disk**: Mounted at `/app/media` for secure resume storage.

---

## 💻 Local Developer Setup

### Prerequisites
- Python 3.10+ (tested with Python 3.12 and 3.14)
- Node.js 18+ (tested with Node 20 and 24, npm 11+)
- Git

### 1. Backend Setup

```bash
cd hireflow/backend

# Create and activate virtual environment
# Windows:
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (defaults to SQLite locally)
python manage.py migrate

# Run automated test suite (49 unit, integration & security tests)
python manage.py test

# Verify production deployment readiness
python manage.py check --deploy

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup

```bash
cd hireflow/frontend

# Install npm packages
npm install

# Start Vite dev server with hot module replacement (HMR)
npm run dev

# Run production build
npm run build
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Test Suite & Security Verification

The automated test suite runs 49 tests validating all core domain modules, API contracts, security permissions, and AI algorithms:

```text
Ran 49 tests in 87.879s
OK
System check identified no issues (0 silenced).
```

### Tested Domains:
1. **Authentication & RBAC**: User registration, password validation, SimpleJWT refresh rotation, blacklist invalidation, immutable role protection.
2. **Job Management**: Public visibility rules, draft status hiding, recruiter ownership boundaries, multi-field search and taxonomy filters.
3. **Application Ingestion**: Duplicate submission prevention, PDF/DOCX magic signature verification, 5 MB file size limit enforcement, safe UUID storage filenames.
4. **Document Privacy**: Streamed resume downloads restricted exclusively to the applicant and job owner; 403 Forbidden on unauthorized access; path traversal immunity.
5. **AI Matching Accuracy**: Bounded 0.0–100.0 scoring, deterministic reproducibility, case-insensitive taxonomy intersection, TF-IDF bi-gram cosine similarity, and graceful degradation on unreadable files.

---

## 📋 Environment Variables Reference

| Variable | Scope | Default | Description |
| :--- | :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | Backend | None (Required in Prod) | 50+ character cryptographic secret key |
| `DJANGO_DEBUG` | Backend | `False` | Debug mode (must be `False` in production) |
| `DJANGO_SETTINGS_MODULE` | Backend | `config.settings.production`| Active Django settings module |
| `DJANGO_ALLOWED_HOSTS` | Backend | `localhost,127.0.0.1` | Comma-separated allowed hostnames |
| `DATABASE_URL` | Backend | `sqlite:///db.sqlite3` | PostgreSQL connection string |
| `CORS_ALLOWED_ORIGINS` | Backend | `http://localhost:5173` | Comma-separated allowed client origins |
| `CSRF_TRUSTED_ORIGINS` | Backend | Matches CORS origins | Comma-separated trusted origins for CSRF |
| `DJANGO_SECURE_SSL_REDIRECT`| Backend | `False` (behind proxy) | Redirect HTTP to HTTPS |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000/api/v1`| Backend API root URL |

---

## 📄 Portfolio & Resume Summary

**Project Title**: HireFlow — AI-Powered Recruitment Management Platform  
**Author**: Rohit Parmar ([@rohitparmar08](https://github.com/rohitparmar08))  

### Highlights:
- Architected and built an end-to-end recruitment platform using **React 19, Django 5, DRF, PostgreSQL, and Scikit-Learn**.
- Implemented **JWT authentication with automatic token rotation** and role-based access control (RBAC) isolating candidate and recruiter workflows.
- Engineered a **deterministic, explainable AI resume-to-job matching engine** combining TF-IDF bi-gram cosine similarity with canonical skill taxonomy matching.
- Developed an automated resume ingestion pipeline supporting PDF/DOCX format verification, file signature validation, and safe UUID document streaming.
- Built a modern, accessible UI with Tailwind CSS, interactive skill tag builders, live candidate rankers, and dynamic dashboard metrics.
- Hardened for production with **WhiteNoise static compression**, Gunicorn multi-threading, Docker multi-stage containers, and 100% test pass rate across 49 automated test cases.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
