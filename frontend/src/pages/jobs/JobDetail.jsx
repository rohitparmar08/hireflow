import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobsApi from '../../api/jobs.api';
import applicationsApi from '../../api/applications.api';

export default function JobDetail() {
  const { id } = useParams();
  const { user, isAuthenticated, isCandidate, isRecruiter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Application Modal state
  const [existingApplication, setExistingApplication] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobsApi.getJobDetail(id);
      setJob(data);

      // If authenticated as Candidate, check if already applied
      if (isCandidate) {
        try {
          const appList = await applicationsApi.getCandidateApplications();
          const match = (appList.results || []).find((a) => a.job === id || a.job_id === id);
          if (match) {
            setExistingApplication(match);
          }
        } catch {
          // Non-critical check
        }
      }
    } catch (err) {
      setError(err.response?.status === 404 ? 'Job posting not found or no longer active.' : err.message);
    } finally {
      setLoading(false);
    }
  }, [id, isCandidate]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await jobsApi.archiveJob(id);
      setShowArchiveModal(false);
      navigate('/recruiter/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to archive job.');
    } finally {
      setArchiving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setApplyError('');
    if (!file) return;

    // Client-side validation
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx'].includes(ext)) {
      setApplyError('Only PDF (.pdf) and Word (.docx) documents are supported.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApplyError('File size exceeds the 5 MB maximum limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setApplyError('Please upload your resume document.');
      return;
    }

    setSubmittingApp(true);
    setApplyError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (coverNote.trim()) {
      formData.append('cover_note', coverNote.trim());
    }

    try {
      const appData = await applicationsApi.applyToJob(id, formData);
      setApplySuccess(true);
      setExistingApplication(appData);
      setTimeout(() => {
        setShowApplyModal(false);
      }, 1500);
    } catch (err) {
      const respData = err.response?.data;
      let msg = 'Failed to submit application.';
      if (respData) {
        if (typeof respData === 'string') msg = respData;
        else if (respData.detail) msg = respData.detail;
        else if (respData.file) msg = `File: ${respData.file[0]}`;
        else msg = JSON.stringify(respData);
      }
      setApplyError(msg);
    } finally {
      setSubmittingApp(false);
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
                  to={`/recruiter/jobs/${job.id}/applicants`}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
                >
                  View Applicants ({job.applications_count || 0})
                </Link>
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
            ) : existingApplication ? (
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Applied &bull; {existingApplication.status?.replace('_', ' ')}
                </span>
                <Link
                  to={`/applications/${existingApplication.id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  View Application &rarr;
                </Link>
              </div>
            ) : job.status === 'ACTIVE' ? (
              isAuthenticated && isCandidate ? (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                >
                  Apply for this Role &rarr;
                </button>
              ) : isAuthenticated && isRecruiter ? (
                <span className="text-xs text-slate-400 italic">
                  Recruiters cannot apply for roles.
                </span>
              ) : (
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                >
                  Sign in to Apply
                </Link>
              )
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500">
                Position Closed
              </span>
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

      {/* Application Submission Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Apply for {job.title}</h3>
                <p className="text-xs text-slate-500">{job.company_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {applySuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-bold text-slate-900">Application Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Your resume has been uploaded and parsed. You can track this application in your dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                {applyError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {applyError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Upload Resume (PDF or DOCX, max 5 MB) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    required
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
                  />
                  {selectedFile && (
                    <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Cover Note / Message to Recruiter (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Introduce yourself, highlight relevant achievements, or add portfolio links..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApp || !selectedFile}
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 shadow-xs"
                  >
                    {submittingApp ? 'Submitting & Parsing...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
