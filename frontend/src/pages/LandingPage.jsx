import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    fetch(`${API_BASE_URL}/health/`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === 'healthy') setHealthStatus('healthy');
        else setHealthStatus('degraded');
      })
      .catch(() => setHealthStatus('offline'));
  }, []);

  const dashboardPath =
    user?.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Production-Ready Recruitment Platform &bull; Phase 6 Hardened</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight sm:leading-none">
            Intelligent Hiring with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              Explainable AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            HireFlow accelerates technical recruitment with deterministic resume parsing,
            role-based screening pipelines, and transparent, mathematical candidate-to-job matching.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition text-center"
              >
                Go to {user.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'} Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition text-center"
                >
                  Get Started Free &rarr;
                </Link>
                <Link
                  to="/jobs"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300 transition text-center"
                >
                  Explore Open Jobs
                </Link>
              </>
            )}
          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50/60 text-center">
              <div className="text-2xl font-extrabold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Transparent Scoring</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/60 text-center">
              <div className="text-2xl font-extrabold text-slate-900">150+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Standardized Tech Skills</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/60 text-center">
              <div className="text-2xl font-extrabold text-slate-900">PDF &amp; DOCX</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Automated Ingestion</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/60 text-center">
              <div className="text-2xl font-extrabold text-slate-900">&lt; 15 min</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">JWT Auth &amp; Rotation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            Why Teams Choose HireFlow
          </h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Precision, Not Hallucinations
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Eliminate black-box uncertainty with verifiable algorithms that explain every score.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl mb-5 border border-indigo-100">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deterministic Resume Ingestion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Safe extraction for PDF and DOCX documents up to 5 MB with magic-byte signature validation.
              Extracts email, phone, education tier, and matching technical taxonomy without inventing candidate data.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-5 border border-emerald-100">
              📊
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">5-Factor Explainable Scoring</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Combines required skills (40%), optional skills (15%), TF-IDF bi-gram cosine similarity (25%),
              experience alignment (10%), and credential tiers (10%) with explicit formula audits.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl mb-5 border border-purple-100">
              🔒
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Enterprise Security &amp; RBAC</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict role-based isolation between candidates and recruiters. SimpleJWT with refresh token
              rotation, token blacklisting, and authenticated resume downloads via Django streaming.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Walkthrough */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
              Simple 3-Step Workflow
            </h2>
            <p className="text-3xl font-extrabold text-slate-900">From Posting to Shortlisting</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">
                Step 01
              </span>
              <h3 className="text-base font-bold text-slate-900 mb-2">Recruiter Posts Role</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Define job title, salary range, experience level, and specify must-have and nice-to-have technical skills.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">
                Step 02
              </span>
              <h3 className="text-base font-bold text-slate-900 mb-2">Candidate Applies with Resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Candidate uploads their resume document with an optional cover note. Duplicate applications are prevented automatically.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">
                Step 03
              </span>
              <h3 className="text-base font-bold text-slate-900 mb-2">Instant Explainable Match</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                HireFlow computes the normalized match score, highlights matching and missing skills, and lets recruiters shortlist with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Candidates */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-md">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/10 inline-block mb-4">
                For Job Seekers
              </span>
              <h3 className="text-2xl font-bold mb-3">Looking for your next engineering role?</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Browse verified openings, upload your resume, and see exactly which skills match before applying.
              </p>
            </div>
            <Link
              to="/jobs"
              className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition self-start"
            >
              Browse Open Positions &rarr;
            </Link>
          </div>

          {/* For Recruiters */}
          <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-md">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/10 inline-block mb-4">
                For Hiring Teams
              </span>
              <h3 className="text-2xl font-bold mb-3">Hiring software engineers or technical leaders?</h3>
              <p className="text-xs text-indigo-100 leading-relaxed mb-6">
                Post jobs, filter applicants by AI match score, and streamline candidate evaluations without expensive black-box APIs.
              </p>
            </div>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition self-start"
            >
              Start Hiring as a Recruiter &rarr;
            </Link>
          </div>
        </div>

        {/* System Health Status Footer Badge */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span
            className={`w-2 h-2 rounded-full ${
              healthStatus === 'healthy'
                ? 'bg-emerald-500'
                : healthStatus === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          ></span>
          <span>API Service Status: {healthStatus.toUpperCase()} (Django 5 REST Framework &bull; SQLite/PostgreSQL)</span>
        </div>
      </section>
    </div>
  );
}
