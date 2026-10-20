import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardPath =
    user?.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-indigo-700 transition">
            H
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
              HireFlow
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              AI ATS
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4 text-sm">
          <Link
            to="/jobs"
            className="font-medium text-slate-700 hover:text-indigo-600 transition"
          >
            Browse Jobs
          </Link>

          {isAuthenticated ? (
            <>
              {/* Role Indicator Badge */}
              <span
                className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'RECRUITER'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    user.role === 'RECRUITER' ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}
                ></span>
                {user.role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}
              </span>

              {user.role === 'RECRUITER' && (
                <Link
                  to="/recruiter/jobs/create"
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
                >
                  + Post a Job
                </Link>
              )}

              {user.role === 'CANDIDATE' && (
                <Link
                  to="/candidate/applications"
                  className="font-medium text-slate-700 hover:text-indigo-600 transition"
                >
                  My Applications
                </Link>
              )}

              <Link
                to={dashboardPath}
                className="font-medium text-slate-700 hover:text-indigo-600 transition"
              >
                Dashboard
              </Link>

              <Link
                to="/profile"
                className="font-medium text-slate-700 hover:text-indigo-600 transition"
              >
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
