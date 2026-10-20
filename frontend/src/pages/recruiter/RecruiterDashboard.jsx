import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobsApi from '../../api/jobs.api';

export default function RecruiterDashboard() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' for ALL, or ACTIVE, DRAFT, CLOSED
  const [jobToClose, setJobToClose] = useState(null);
  const [closing, setClosing] = useState(false);

  const fetchRecruiterJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobsApi.getRecruiterJobs({
        status: statusFilter || undefined,
      });
      setJobs(data.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load your postings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRecruiterJobs();
  }, [fetchRecruiterJobs]);

  const handleCloseJob = async () => {
    if (!jobToClose) return;
    setClosing(true);
    try {
      await jobsApi.archiveJob(jobToClose.id);
      setJobToClose(null);
      fetchRecruiterJobs();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to close job.');
    } finally {
      setClosing(false);
    }
  };

  // Compute live metric counts
  const totalJobsCount = jobs.length;
  const activeJobsCount = jobs.filter((j) => j.status === 'ACTIVE').length;
  const draftJobsCount = jobs.filter((j) => j.status === 'DRAFT').length;
  const closedJobsCount = jobs.filter((j) => j.status === 'CLOSED').length;
  const totalApplicantsCount = jobs.reduce((acc, j) => acc + (j.applications_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
              Recruiter Workspace
            </span>
            <span className="text-xs text-slate-400">Phase 5 AI Engine Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.first_name || 'Recruiter'}!
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Managing talent pipelines and positions for <strong className="text-indigo-600">{user?.company_name || 'Your Company'}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-center">
          <Link
            to="/jobs"
            className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            Public Job Board &rarr;
          </Link>
          <Link
            to="/recruiter/jobs/create"
            className="px-5 py-2.5 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
          >
            + Post New Opening
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Openings
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalJobsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">All managed positions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
            Active / Listed
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{activeJobsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Accepting applicants</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
            Total Candidates
          </div>
          <div className="text-3xl font-extrabold text-indigo-700">{totalApplicantsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across all postings</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1">
            Drafts &amp; Closed
          </div>
          <div className="text-3xl font-extrabold text-slate-700">{draftJobsCount + closedJobsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">{draftJobsCount} drafts, {closedJobsCount} closed</p>
        </div>
      </div>

      {/* Postings Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Navigation Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Job Postings</h2>
            <p className="text-xs text-slate-500">Track candidate flow and manage listings</p>
          </div>

          <div className="flex space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
            {[
              { label: 'All Jobs', value: '' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Drafts', value: 'DRAFT' },
              { label: 'Closed', value: 'CLOSED' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === tab.value
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-16 text-center text-sm text-slate-500">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading your job postings...
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="p-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">No job postings found</h3>
            <p className="text-xs text-slate-500 mb-6">
              {statusFilter
                ? `You have no postings with '${statusFilter}' status.`
                : "You haven't posted any jobs yet. Create your first opening to start recruiting."}
            </p>
            <Link
              to="/recruiter/jobs/create"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
            >
              + Create First Job
            </Link>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Job Title</th>
                  <th className="px-6 py-3.5">Model / Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Applicants</th>
                  <th className="px-6 py-3.5">Posted On</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <Link to={`/jobs/${job.id}`} className="hover:text-indigo-600 transition block text-sm">
                        {job.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-normal">{job.company_name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{job.location_type}</div>
                      <div className="text-[11px] text-slate-400">{job.employment_type?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          job.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : job.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {job.applications_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/recruiter/jobs/${job.id}/applicants`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition inline-block shadow-2xs"
                      >
                        Applicants ({job.applications_count || 0})
                      </Link>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition inline-block"
                      >
                        View
                      </Link>
                      <Link
                        to={`/recruiter/jobs/${job.id}/edit`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition inline-block"
                      >
                        Edit
                      </Link>
                      {job.status !== 'CLOSED' && (
                        <button
                          onClick={() => setJobToClose(job)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition inline-block"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {jobToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Close &apos;{jobToClose.title}&apos;?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Closing this job changes its status to <strong>CLOSED</strong>. It will be delisted from the public job board, but your applicant history remains intact.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setJobToClose(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={handleCloseJob}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {closing ? 'Closing...' : 'Confirm & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
