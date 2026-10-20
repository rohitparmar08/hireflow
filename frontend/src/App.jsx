import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function App() {
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
    // Attempt auto-check on initial render
    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              H
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">HireFlow</span>
              <span className="ml-2 text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                Phase 1 Active
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span className="inline-flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Frontend Online
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            AI-Powered Recruitment <br />
            <span className="text-indigo-600">Management Platform</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Welcome to the foundational environment for <strong className="text-slate-800">HireFlow</strong>.
            The frontend (React + Vite + Tailwind CSS) and backend (Django REST Framework) baseline
            architecture is configured and operational.
          </p>
        </div>

        {/* System Status / Health Check Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Backend Connectivity Check</h2>
              <p className="text-xs text-slate-500">Target: <code className="bg-slate-100 px-1 py-0.5 rounded">{API_BASE_URL}/health/</code></p>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={health.loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
            >
              {health.loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                'Retest Health'
              )}
            </button>
          </div>

          {health.loading && (
            <div className="p-4 rounded-xl bg-slate-50 text-slate-600 text-sm text-center">
              Testing backend link at {API_BASE_URL}...
            </div>
          )}

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
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2"></span>
                  Backend Not Reachable Yet
                </span>
                <span className="text-xs text-amber-700">{health.checkedAt}</span>
              </div>
              <p className="text-xs text-amber-800">
                To test live connectivity, run the Django server in your terminal:
                <br />
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px] block mt-1">
                  cd backend &amp;&amp; .\.venv\Scripts\python.exe manage.py runserver
                </code>
              </p>
            </div>
          )}
        </div>

        {/* Architecture Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Frontend</div>
            <h3 className="font-semibold text-slate-800 mb-1">React 19 + Vite + Tailwind</h3>
            <p className="text-xs text-slate-500">
              Modern tooling with fast HMR, responsive styling, and modular architecture.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">Backend</div>
            <h3 className="font-semibold text-slate-800 mb-1">Django 5 + REST Framework</h3>
            <p className="text-xs text-slate-500">
              Versioned API at <code className="text-indigo-600">/api/v1/</code>, CORS configured, modular settings hierarchy.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Persistence</div>
            <h3 className="font-semibold text-slate-800 mb-1">PostgreSQL Ready / SQLite Dev</h3>
            <p className="text-xs text-slate-500">
              Environment-driven database setup via <code className="text-amber-700">DATABASE_URL</code> with zero-friction fallback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        HireFlow — Phase 1: Foundation &amp; Tooling Setup Complete &bull; Ready for Phase 2: Authentication &amp; RBAC
      </footer>
    </div>
  );
}
