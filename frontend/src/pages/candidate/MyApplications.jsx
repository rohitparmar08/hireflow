import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import applicationsApi from '../../api/applications.api';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [appToWithdraw, setAppToWithdraw] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await applicationsApi.getCandidateApplications({
        status: statusFilter || undefined,
      });
      setApplications(data.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load your applications.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = async () => {
    if (!appToWithdraw) return;
    setWithdrawing(true);
    try {
      await applicationsApi.updateApplicationStatus(appToWithdraw.id, 'WITHDRAWN');
      setAppToWithdraw(null);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to withdraw application.');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SHORTLISTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'WITHDRAWN':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Job Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track the status of roles you have applied for and review recruiter feedback.
          </p>
        </div>

        <Link
          to="/jobs"
          className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition self-start sm:self-auto"
        >
          Browse Open Positions &rarr;
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2">
          {[
            { label: 'All Applications', value: '' },
            { label: 'Submitted', value: 'SUBMITTED' },
            { label: 'In Review', value: 'IN_REVIEW' },
            { label: 'Shortlisted', value: 'SHORTLISTED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'Withdrawn', value: 'WITHDRAWN' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="m-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-16 text-center text-sm text-slate-500">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading your applications...
          </div>
        )}

        {!loading && applications.length === 0 && (
          <div className="p-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">No applications found</h3>
            <p className="text-xs text-slate-500 mb-6">
              {statusFilter
                ? `You have no applications with status '${statusFilter}'.`
                : "You haven't submitted any job applications yet."}
            </p>
            <Link
              to="/jobs"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              Explore Job Openings
            </Link>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-6 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition">
                      <Link to={`/applications/${app.id}`}>{app.job_title}</Link>
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {app.company_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{app.job_location}</span>
                    <span>&bull;</span>
                    <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span className="text-slate-400">
                      Job Status: <strong className="text-slate-600">{app.job_status}</strong>
                    </span>
                  </div>

                  {app.parsed_skills && app.parsed_skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Detected Skills:
                      </span>
                      {app.parsed_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <Link
                    to={`/applications/${app.id}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition text-center"
                  >
                    View Submission &rarr;
                  </Link>

                  {app.status !== 'WITHDRAWN' && app.status !== 'REJECTED' && (
                    <button
                      onClick={() => setAppToWithdraw(app)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {appToWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Withdraw Application?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to withdraw your application for{' '}
              <strong>{appToWithdraw.job_title}</strong> at{' '}
              <strong>{appToWithdraw.company_name}</strong>? Recruiters will see this application as
              withdrawn.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setAppToWithdraw(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawing}
                onClick={handleWithdraw}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50"
              >
                {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
