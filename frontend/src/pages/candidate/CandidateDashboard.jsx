import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import applicationsApi from '../../api/applications.api';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await applicationsApi.getCandidateApplications();
        setApplications(data.results || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalApplied = applications.length;
  const underReview = applications.filter((a) => a.status === 'IN_REVIEW').length;
  const shortlisted = applications.filter((a) => a.status === 'SHORTLISTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Candidate Portal
            </span>
            <span className="text-xs text-slate-400">Phase 4: Applications &amp; Resume Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome back, {user?.first_name || 'Candidate'}!
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {user?.headline || 'Explore open positions and track your hiring pipeline'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/jobs"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
          >
            Browse Openings &rarr;
          </Link>
          <Link
            to="/candidate/applications"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            My Applications
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Applications Submitted
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalApplied}</div>
          <p className="text-xs text-slate-400 mt-1">Across all active roles</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            In Review
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{underReview}</div>
          <p className="text-xs text-slate-400 mt-1">Under recruiter evaluation</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            Shortlisted
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{shortlisted}</div>
          <p className="text-xs text-slate-400 mt-1">Advancing to next stage</p>
        </div>
      </div>

      {/* Recent Applications Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
          <Link
            to="/candidate/applications"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all ({totalApplied}) &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-500 mb-4">You haven&apos;t applied to any roles yet.</p>
            <Link
              to="/jobs"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              Explore Open Jobs
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 3).map((app) => (
              <div key={app.id} className="py-4 flex items-center justify-between">
                <div>
                  <Link to={`/applications/${app.id}`} className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition">
                    {app.job_title}
                  </Link>
                  <div className="text-xs text-slate-500">{app.company_name} &bull; {app.job_location}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {app.status?.replace('_', ' ')}
                  </span>
                  <Link
                    to={`/applications/${app.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
