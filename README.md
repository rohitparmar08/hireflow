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
│       ├── jobs/               # JobPosting model, REST CRUD APIs, filters, pagination, admin
│       └── applications/       # Application & Resume models, PDF/DOCX ingestion parser, RBAC pipeline
├── frontend/
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json            # React 19, Tailwind CSS, Axios, React Router
│   ├── vite.config.js          # Vite build config
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js
│   └── src/
│       ├── api/                # Axios instance, auth interceptors & API services (auth, jobs, applications)
│       ├── context/            # AuthContext (login, register, logout, profile state)
│       ├── routes/             # ProtectedRoute & RoleGuard components
│       ├── components/         # Navbar, badges, layout primitives
│       ├── pages/
│       │   ├── auth/           # Login, Register
│       │   ├── jobs/           # JobListing (public board), JobDetail (with Apply modal)
│       │   ├── recruiter/      # RecruiterDashboard, JobApplicants (pipeline view), CreateJob, EditJob
│       │   ├── candidate/      # CandidateDashboard, MyApplications (tracker & withdraw)
│       │   ├── applications/   # ApplicationDetail (recruiter decision panel & candidate view)
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

### Candidate Applications & Resume Parsing (`/api/v1/jobs/{id}/apply/`, `/api/v1/applications/`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/jobs/{id}/apply/` | Candidate Only | Submit application with resume (multipart upload: PDF/DOCX, <= 5 MB, magic byte check) and optional cover note. Validates one application per candidate per job. Automatically triggers deterministic resume parsing and AI matching. |
| `GET` | `/api/v1/candidate/applications/` | Candidate Only | Retrieve candidate's personal application history with status filter (`?status=SUBMITTED\|IN_REVIEW\|SHORTLISTED\|REJECTED\|WITHDRAWN`). Includes computed AI match score. |
| `GET` | `/api/v1/jobs/{id}/applications/` | Recruiter (Job Owner) | List applicants for a specific job posting with resume parsing status, detected skill previews, and match scores. Supports sorting (`?ordering=-match_score\|match_score\|-created_at`) and score threshold filtering (`?min_score=80`). |
| `GET` | `/api/v1/applications/{id}/` | Candidate Applicant \| Job Recruiter | View detailed application info, including parsed resume entities, cover note, candidate profile, and full AI match breakdown. |
| `PATCH` | `/api/v1/applications/{id}/` | Candidate Applicant \| Job Recruiter | Update application status. Recruiters can transition to `IN_REVIEW`, `SHORTLISTED`, or `REJECTED`. Candidates can transition to `WITHDRAWN`. |
| `GET` | `/api/v1/applications/{id}/resume/` | Candidate Applicant \| Job Recruiter | Securely stream candidate's uploaded resume file with attachment headers. Prevents public media exposure and path traversal; unauthorized users blocked with 403. |


### AI Matching Engine & Explainable Insights (`/api/v1/applications/{id}/match/`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/applications/{id}/match/` | Candidate Applicant \| Job Recruiter | Retrieve persisted AI match result, component breakdown, matching skills, and missing skills. Computes on-the-fly if not previously stored. |
| `POST` | `/api/v1/applications/{id}/match/` | Candidate Applicant \| Job Recruiter | Force recalculate and refresh the resume-to-job match score and explainable breakdown. |

---

## 🧠 AI Matching Engine & Scoring Methodology

HireFlow incorporates an explainable, deterministic AI matching pipeline that runs locally without external paid APIs, black-box hallucinations, or proprietary data leakage.

### 1. Mathematical Scoring Formula

The overall match score (normalized strictly from **0.0 to 100.0**) is calculated as a weighted linear combination of five transparent components:

$$\text{Overall Score} = (0.40 \times S_{\text{req}}) + (0.15 \times S_{\text{opt}}) + (0.25 \times S_{\text{tfidf}}) + (0.10 \times S_{\text{exp}}) + (0.10 \times S_{\text{edu}})$$

| Component | Weight | Evaluation Method | Description |
| :--- | :---: | :--- | :--- |
| **Required Skills** ($S_{\text{req}}$) | **40%** | Exact & case-insensitive taxonomy intersection | $\frac{\|R_{\text{skills}} \cap C_{\text{skills}}\|}{\|R_{\text{skills}}\|} \times 100$. If job lists no required skills, defaults to 100%. |
| **Optional Skills** ($S_{\text{opt}}$) | **15%** | Exact & case-insensitive taxonomy intersection | $\frac{\|O_{\text{skills}} \cap C_{\text{skills}}\|}{\|O_{\text{skills}}\|} \times 100$. If job lists no optional skills, defaults to 100%. |
| **Text Similarity** ($S_{\text{tfidf}}$) | **25%** | Scikit-Learn TF-IDF vectorizer + Cosine Similarity | Bi-gram ($n=1,2$) TF-IDF vectorization with English stop words and code-token retention (`C++`, `C#`, `.NET`) comparing job corpus with resume text + cover note. |
| **Experience Level** ($S_{\text{exp}}$) | **10%** | Seniority keywords & years of experience regex | Compares job target level (`ENTRY`, `MID`, `SENIOR`, `LEAD`, `EXECUTIVE`) against resume indicators. Defaults to 50% neutral baseline if undetectable. |
| **Education Tier** ($S_{\text{edu}}$) | **10%** | Credential taxonomy matching | Categorizes detected degrees (`Doctorate`: 100%, `Master`: 95%, `Bachelor`: 85%, `Associate`: 70%). Defaults to 55% baseline if no degree stated. |

### 2. Explainability & Breakdown JSON
Every match returns a complete audit breakdown:
- Explicit weights and numeric contributions for each factor.
- Plain-English narrative notes explaining why each score was awarded.
- Distinct lists of **matching skills** (verified) and **missing skills** (actionable gap analysis).
- Strict degradation: unreadable documents or failed extractions cleanly receive a 0.0 score with descriptive error reasons.

### 3. Limitations & Ethical Guardrails
- **No Soft Skill Assessment**: The model evaluates technical skills and document text; it does not measure communication, culture fit, or emotional intelligence.
- **Document Format Dependency**: Text extraction depends on machine-readable PDFs and DOCX files. Image-based or scanned PDFs without OCR yield unreadable status.
- **Human-in-the-Loop Screening**: The platform surfaces scores as an assistive screening aid; it does not automate rejection or selection.

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
   Runs 49 automated tests covering:
   - Secure resume document downloads (`/applications/{id}/resume/`) restricted to participants
   - Rejection of spoofed files, unsupported executable extensions, and empty 0-byte resumes
   - Integrity enforcement preventing withdrawal of already rejected applications
   - Atomic protection against concurrent duplicate job applications
   - Explainable AI matching score calculation across 0.0 to 100.0 bounds
   - Deterministic and reproducible scoring across identical inputs
   - Exact and case-insensitive skill taxonomy matching and missing skills identification
   - TF-IDF bi-gram cosine similarity and experience/education tiering
   - Graceful degradation for unreadable or incomplete resume data
   - Automatic match calculation upon candidate application submission
   - Match endpoint authorization (`/applications/{id}/match/`) for candidates and job recruiters
   - Protection against unauthorized match retrieval or recalculation attempts
   - Recruiter applicant sorting by match score (`?ordering=-match_score`) and score threshold filtering
   - Application submission with resume upload and duplicate application prevention
   - Resume validation (file type, 5 MB limit, magic signature verification)
   - Resilient parsing (email, phone, degree detection, 150+ standard skills taxonomy)
   - Application status updates and RBAC transitions (Recruiter vs Candidate)
   - Candidate isolation (cannot access others' applications)
   - Closed job protection (prevents new applications while preserving history)
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
- [x] **Phase 4: Candidate Application Flow & Resume Ingestion Engine**
- [x] **Phase 5: AI Resume-to-Job Matching Engine & Explainable Scoring**
- [x] **Phase 6: Security Audit, Bug Fixes & End-to-End Integration**
- [ ] **Phase 7: Recruiter Review Pipeline & AI Insights UI Enhancements**
- [ ] **Phase 8: Production Deployment Hardening & Final Portfolio Release**
