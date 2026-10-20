import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobsApi from '../../api/jobs.api';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await jobsApi.getJobDetail(id);
        setJob(data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Job posting not found or no longer active.' : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await jobsApi.archiveJob(id);
      setShowArchiveModal(false);
      // Refresh job state or redirect to recruiter dashboard
      navigate('/recruiter/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to archive job.');
    } finally {
      setArchiving(false);
    }
  };

  const isOwner = user && job && user.id === job.recruiter_id;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Job Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'This job is not accessible.'}</p>
          <Link
            to="/jobs"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            &larr; Back to Job Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link to="/jobs" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition flex items-center">
          &larr; Back to all job openings
        </Link>
      </div>

      {/* Main Job Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-8">
        {/* Header Banner */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {job.company_name}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  job.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : job.status === 'DRAFT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {job.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {job.location} ({job.location_type})
              </span>
              <span>&bull;</span>
              <span>{job.employment_type?.replace('_', ' ')}</span>
              <span>&bull;</span>
              <span>{job.experience_level} Level</span>
              {job.min_salary && job.max_salary && (
                <>
                  <span>&bull;</span>
                  <span className="font-semibold text-emerald-700">
                    ${Number(job.min_salary).toLocaleString()} - ${Number(job.max_salary).toLocaleString()} {job.salary_currency}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isOwner ? (
              <>
                <Link
                  to={`/recruiter/jobs/${job.id}/edit`}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                >
                  Edit Job
                </Link>
                {job.status !== 'CLOSED' && (
                  <button
                    onClick={() => setShowArchiveModal(true)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                  >
                    Close Role
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-end">
                <button
                  disabled
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 opacity-60 cursor-not-allowed shadow-xs"
                >
                  Apply for Role
                </button>
                <span className="text-[10px] text-slate-400 mt-1">
                  Candidate application pipeline unlocks in Phase 4
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Skills Section */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
              Required Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.required_skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {job.optional_skills && job.optional_skills.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                Preferred / Nice-to-Have Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.optional_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Description */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
              Role Overview &amp; Responsibilities
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-xl border border-slate-100">
              {job.description}
            </div>
          </div>

          {/* Hiring Team Metadata */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 gap-2">
            <div>
              Posted by <strong className="text-slate-600">{job.recruiter_name}</strong> &bull; {job.company_name}
            </div>
            <div>
              Posted on {new Date(job.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Archiving */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Close this job posting?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Closing this job will set its status to <strong>CLOSED</strong>. It will immediately be removed from the public job board, but your applicant records will be preserved.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiving}
                onClick={handleArchive}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {archiving ? 'Closing...' : 'Yes, Close Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
