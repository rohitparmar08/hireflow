import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RecruiterDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Recruiter Portal
            </span>
            <span className="text-xs text-slate-400">Authenticated via SimpleJWT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome, {user?.first_name || 'Recruiter'}!
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Managing recruitment for <strong className="text-indigo-600">{user?.company_name || 'Your Company'}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/profile"
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            Edit Profile
          </Link>
          <button
            disabled
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 opacity-60 cursor-not-allowed shadow-xs"
            title="Available in Phase 3"
          >
            + Post New Job (Phase 3)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Active Job Postings
          </div>
          <div className="text-3xl font-extrabold text-slate-900">0</div>
          <p className="text-xs text-slate-400 mt-1">Ready for Phase 3 Job Management</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Candidates
          </div>
          <div className="text-3xl font-extrabold text-slate-900">0</div>
          <p className="text-xs text-slate-400 mt-1">Ready for Phase 4 Applications</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            AI Matches Evaluated
          </div>
          <div className="text-3xl font-extrabold text-slate-900">0</div>
          <p className="text-xs text-slate-400 mt-1">Ready for Phase 5 AI Matching</p>
        </div>
      </div>

      {/* RBAC Verification Info Card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-indigo-950">
        <h3 className="font-bold text-lg mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Phase 2 RBAC Verification Active
        </h3>
        <p className="text-sm leading-relaxed mb-3">
          You are authenticated with the <strong>RECRUITER</strong> role. The frontend <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-xs font-mono">RoleGuard</code> and backend DRF permission classes (<code className="bg-indigo-100 px-1.5 py-0.5 rounded text-xs font-mono">IsRecruiter</code>) are strictly enforcing access. Candidate-only routes and actions are protected against unauthorized access.
        </p>
        <div className="text-xs text-indigo-800">
          User ID: <code className="font-mono">{user?.id}</code> &bull; Email: <code className="font-mono">{user?.email}</code>
        </div>
      </div>
    </div>
  );
}
