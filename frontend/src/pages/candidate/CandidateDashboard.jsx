import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import applicationsApi from '../../api/applications.api';
import jobsApi from '../../api/jobs.api';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appData, jobData] = await Promise.all([
          applicationsApi.getCandidateApplications(),
          jobsApi.getPublicJobs({ page_size: 3 }),
        ]);
        setApplications(appData.results || []);
        setRecommendedJobs(jobData.results?.slice(0, 3) || []);
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalApplied = applications.length;
  const underReview = applications.filter((a) => a.status === 'IN_REVIEW').length;
  const shortlisted = applications.filter((a) => a.status === 'SHORTLISTED').length;

  // Compute average AI match score across scored applications
  const scoredApps = applications.filter(
    (a) => typeof a.match_score === 'number' && !isNaN(a.match_score)
  );
  const avgMatchScore =
    scoredApps.length > 0
      ? Math.round(scoredApps.reduce((acc, curr) => acc + curr.match_score, 0) / scoredApps.length)
      : null;

  // Profile completion meter
  const profileSteps = [
    Boolean(user?.first_name && user?.last_name),
    Boolean(user?.email),
    Boolean(user?.headline),
    Boolean(user?.phone_number || user?.bio),
  ];
  const completedSteps = profileSteps.filter(Boolean).length;
  const completionPercent = Math.round((completedSteps / profileSteps.length) * 100);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SHORTLISTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'WITHDRAWN':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Candidate Portal
            </span>
            <span className="text-xs text-slate-400">Live AI Job Matching</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.first_name || 'Candidate'}!
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {user?.headline || 'Track your active applications and discover high-match technical openings.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-center">
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
          >
            Explore Openings &rarr;
          </Link>
          <Link
            to="/candidate/applications"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            My Applications
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Applications Sent
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalApplied}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across all positions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1">
            Under Evaluation
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{underReview}</div>
          <p className="text-[11px] text-slate-400 mt-1">Review in progress</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
            Shortlisted
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{shortlisted}</div>
          <p className="text-[11px] text-slate-400 mt-1">Next interview stage</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
            Avg AI Match
          </div>
          <div className="text-3xl font-extrabold text-indigo-600">
            {avgMatchScore !== null ? `${avgMatchScore}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {scoredApps.length > 0 ? `Across ${scoredApps.length} scored roles` : 'Upload resume to score'}
          </p>
        </div>
      </div>

      {/* Profile Completeness Callout */}
      {completionPercent < 100 && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Profile Completeness
              </span>
              <span className="text-xs font-extrabold text-indigo-700">{completionPercent}%</span>
            </div>
            <div className="w-full sm:w-64 h-2 bg-indigo-200/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-indigo-700">
              Add your professional headline, bio, and contact number to improve match visibility with recruiters.
            </p>
          </div>
          <Link
            to="/profile"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white text-indigo-700 hover:bg-indigo-100/50 border border-indigo-200 transition whitespace-nowrap self-start sm:self-auto shadow-xs"
          >
            Complete Profile &rarr;
          </Link>
        </div>
      )}

      {/* Main Grid: Recent Applications & Recommended Openings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
              <p className="text-xs text-slate-500">Track hiring progress and AI evaluation</p>
            </div>
            <Link
              to="/candidate/applications"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              View all ({totalApplied}) &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading your applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">No applications yet</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Explore open positions and apply with your resume to receive explainable AI match scores.
              </p>
              <Link
                to="/jobs"
                className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
              >
                Browse Job Board
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 4).map((app) => (
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      to={`/applications/${app.id}`}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition"
                    >
                      {app.job_title}
                    </Link>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span className="font-medium text-slate-700">{app.company_name}</span>
                      <span>&bull;</span>
                      <span>{app.job_location}</span>
                      <span>&bull;</span>
                      <span>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-start sm:self-center">
                    {typeof app.match_score === 'number' && !isNaN(app.match_score) && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getScoreColor(
                          app.match_score
                        )}`}
                      >
                        {Math.round(app.match_score)}% Match
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status?.replace('_', ' ')}
                    </span>

                    <Link
                      to={`/applications/${app.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Openings Feed (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recommended Jobs</h2>
              <p className="text-xs text-slate-500">Active positions to consider</p>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              All &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading openings...</div>
          ) : recommendedJobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No active jobs right now.</div>
          ) : (
            <div className="space-y-4">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/40 transition flex flex-col justify-between"
                >
                  <div className="mb-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition block"
                    >
                      {job.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {job.company_name} &bull; {job.location} ({job.location_type})
                    </div>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.required_skills.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition text-right"
                  >
                    View Opening &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
