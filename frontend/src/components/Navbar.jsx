import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const dashboardPath =
    user?.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';

  const isActive = (path) => location.pathname === path;

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.first_name ? user.first_name[0] : '';
    const last = user.last_name ? user.last_name[0] : '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-xs group-hover:scale-105 transition-transform duration-200">
            H
          </div>
          <div className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
              HireFlow
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              AI ATS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm">
          <Link
            to="/jobs"
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              isActive('/jobs')
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Browse Jobs
          </Link>

          {isAuthenticated ? (
            <>
              {user.role === 'RECRUITER' && (
                <>
                  <Link
                    to="/recruiter/dashboard"
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      isActive('/recruiter/dashboard')
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/recruiter/jobs/create"
                    className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs gap-1 ml-1"
                  >
                    <span>+</span> Post a Job
                  </Link>
                </>
              )}

              {user.role === 'CANDIDATE' && (
                <>
                  <Link
                    to="/candidate/dashboard"
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      isActive('/candidate/dashboard')
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/candidate/applications"
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      isActive('/candidate/applications')
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Applications
                  </Link>
                </>
              )}

              <div className="h-5 w-px bg-slate-200 mx-2"></div>

              {/* User Profile Chip */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                title="Account Settings"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                  {getUserInitials()}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.first_name || user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {user.role?.toLowerCase()}
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 pl-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
              >
                Get Started &rarr;
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          {isAuthenticated && (
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200"
            >
              {getUserInitials()}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse Open Jobs
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>

              {user.role === 'CANDIDATE' && (
                <Link
                  to="/candidate/applications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Applications
                </Link>
              )}

              {user.role === 'RECRUITER' && (
                <Link
                  to="/recruiter/jobs/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-indigo-600 bg-indigo-50"
                >
                  + Post a New Job
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Profile &amp; Settings
              </Link>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
