import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import applicationsApi from '../../api/applications.api';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await applicationsApi.getApplicationDetail(id);
      setApplication(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await applicationsApi.updateApplicationStatus(id, newStatus);
      setApplication(updated);
    } catch (err) {
      alert(err.response?.data?.status?.[0] || err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isRecruiter = user?.role === 'RECRUITER';
  const isCandidate = user?.role === 'CANDIDATE';

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Application Unavailable</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Unable to access this application.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            &larr; Go Back
          </button>
        </div>
      </div>
    );
  }

  const { candidate, resume } = application;
  const parsedData = resume?.parsed_data || {};
  const skills = parsedData.skills || [];
  const education = parsedData.education || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          &larr; Back
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Application Review
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
                  application.status
                )}`}
              >
                {application.status?.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {candidate.full_name || `${candidate.first_name} ${candidate.last_name}`}
            </h1>

            <p className="text-sm text-slate-600 mt-1">
              Applied for{' '}
              <Link to={`/jobs/${application.job_id}`} className="font-bold text-indigo-600 hover:underline">
                {application.job_title}
              </Link>{' '}
              at <strong>{application.company_name}</strong>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
              <span>Email: <strong className="text-slate-700">{candidate.email}</strong></span>
              {candidate.phone_number && (
                <>
                  <span>&bull;</span>
                  <span>Phone: <strong className="text-slate-700">{candidate.phone_number}</strong></span>
                </>
              )}
              <span>&bull;</span>
              <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Status Controls */}
          {isRecruiter && (
            <div className="flex flex-col sm:items-end space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Update Pipeline Stage
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={updatingStatus || application.status === 'IN_REVIEW'}
                  onClick={() => handleStatusChange('IN_REVIEW')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition disabled:opacity-40"
                >
                  In Review
                </button>
                <button
                  type="button"
                  disabled={updatingStatus || application.status === 'SHORTLISTED'}
                  onClick={() => handleStatusChange('SHORTLISTED')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-40"
                >
                  Shortlist
                </button>
                <button
                  type="button"
                  disabled={updatingStatus || application.status === 'REJECTED'}
                  onClick={() => handleStatusChange('REJECTED')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {isCandidate && application.status !== 'WITHDRAWN' && application.status !== 'REJECTED' && (
            <div>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange('WITHDRAWN')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition disabled:opacity-50"
              >
                Withdraw Application
              </button>
            </div>
          )}
        </div>

        {/* Cover Note */}
        {application.cover_note && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Candidate Cover Note
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {application.cover_note}
            </p>
          </div>
        )}
      </div>

      {/* Extracted Resume Ingestion Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Extracted Resume &amp; Skills</h2>
            <p className="text-xs text-slate-500">
              Parsed from uploaded document: <code className="font-mono">{resume?.original_filename}</code> (
              {resume ? (resume.file_size / 1024).toFixed(1) : 0} KB)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                resume?.parsing_status === 'PARSED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : resume?.parsing_status === 'FAILED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Extraction: {resume?.parsing_status}
            </span>
            {resume?.file_url && (
              <a
                href={resume.file_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
              >
                Download Document
              </a>
            )}
          </div>
        </div>

        {resume?.parsing_status === 'FAILED' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <strong>Parsing Warning:</strong> {resume.parsing_error || 'Could not parse text.'}
          </div>
        )}

        {/* Detected Skills */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Verified Skills Detected in Resume
          </h3>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No standard taxonomy skills detected in extracted text.</p>
          )}
        </div>

        {/* Education Indicators */}
        {education.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Education Indicators
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {education.map((deg, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {deg}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Raw Text */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Extracted Raw Document Text ({parsedData.word_count || 0} words)
            </span>
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              {showRawText ? 'Hide Text' : 'View Full Extracted Text'}
            </button>
          </div>

          {showRawText && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {resume?.raw_text || 'No raw text available.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
