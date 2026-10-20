import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [health, setHealth] = useState({
    loading: false,
    data: null,
    error: null,
    checkedAt: null,
  });

  const checkBackendHealth = async () => {
    setHealth((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE_URL}/health/`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setHealth({
        loading: false,
        data,
        error: null,
        checkedAt: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setHealth({
        loading: false,
        data: null,
        error: err.message || 'Unable to connect to backend',
        checkedAt: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const dashboardPath =
    user?.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';

  return (
    <div className="flex-1 flex flex-col justify-between">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Phase 2: Authentication &amp; RBAC Active
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Intelligent Hiring, <br />
            <span className="text-indigo-600">Explainable AI Matching</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            HireFlow connects top candidates with innovative recruiters through role-based
            workflows, transparent resume evaluation, and explainable AI-assisted qualification scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition"
              >
                Go to {user.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'} Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition"
                >
                  Get Started (Recruiter or Candidate)
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 shadow-xs transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Connectivity Test Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Live API Health &amp; DB Connection</h2>
              <p className="text-xs text-slate-500">Target: <code className="bg-slate-100 px-1 py-0.5 rounded">{API_BASE_URL}/health/</code></p>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={health.loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
            >
              {health.loading ? 'Checking...' : 'Retest Health'}
            </button>
          </div>

          {!health.loading && health.data && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
                  Backend Status: {health.data.status?.toUpperCase()}
                </span>
                <span className="text-xs text-emerald-700">Checked at {health.checkedAt}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div><span className="font-medium text-emerald-800">Service:</span> {health.data.service}</div>
                <div><span className="font-medium text-emerald-800">API Version:</span> {health.data.version}</div>
                <div><span className="font-medium text-emerald-800">Database:</span> {health.data.database}</div>
                <div><span className="font-medium text-emerald-800">Debug Mode:</span> {health.data.debug_mode ? 'True' : 'False'}</div>
              </div>
            </div>
          )}

          {!health.loading && health.error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              Backend not reachable at {API_BASE_URL}. Ensure Django server is running.
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Role-Based Access (RBAC)</h3>
            <p className="text-sm text-slate-600">
              Dedicated interfaces and permissions tailored for Candidates seeking opportunities and Recruiters managing talent pipelines.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">JWT Security &amp; Token Rotation</h3>
            <p className="text-sm text-slate-600">
              Short-lived 15-minute access tokens with 7-day rotated refresh tokens and cryptographic token blacklisting on logout.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Explainable AI Ready</h3>
            <p className="text-sm text-slate-600">
              Engineered from the ground up for transparent scoring and explainable resume-job match breakdowns in upcoming phases.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
