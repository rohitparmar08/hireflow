import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import applicationsApi from '../../api/applications.api';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [recalculatingMatch, setRecalculatingMatch] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [showRawText, setShowRawText] = useState(false);


  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await applicationsApi.getApplicationDetail(id);
      setApplication(data);
      if (data.match_result) {
        setMatchResult(data.match_result);
      } else {
        // Fallback: auto-fetch or compute match
        try {
          const matchData = await applicationsApi.getApplicationMatch(id);
          setMatchResult(matchData);
        } catch {
          // silent fallback
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleRecalculateMatch = async () => {
    setRecalculatingMatch(true);
    setMatchError('');
    try {
      const updatedMatch = await applicationsApi.recalculateMatch(id);
      setMatchResult(updatedMatch);
    } catch (err) {
      setMatchError(err.response?.data?.detail || err.message || 'Failed to recalculate match score.');
    } finally {
      setRecalculatingMatch(false);
    }
  };

  const handleDownloadResume = async () => {
    setDownloadingResume(true);
    try {
      await applicationsApi.downloadResume(id, resume?.original_filename);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to download resume document.');
    } finally {
      setDownloadingResume(false);
    }
  };


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

      {/* AI Resume-to-Job Matching & Explainable Insights */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-extrabold text-white shadow-xs ${
                !matchResult
                  ? 'bg-slate-300'
                  : matchResult.overall_score >= 80
                  ? 'bg-emerald-600'
                  : matchResult.overall_score >= 60
                  ? 'bg-blue-600'
                  : matchResult.overall_score >= 40
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
            >
              <span className="text-xl leading-none">
                {matchResult ? Math.round(matchResult.overall_score) : '--'}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Score</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI Matching Engine
                </span>
                {matchResult && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      matchResult.overall_score >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : matchResult.overall_score >= 60
                        ? 'bg-blue-100 text-blue-800'
                        : matchResult.overall_score >= 40
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {matchResult.overall_score >= 80
                      ? 'Strong Match'
                      : matchResult.overall_score >= 60
                      ? 'Good Match'
                      : matchResult.overall_score >= 40
                      ? 'Moderate Match'
                      : 'Low Match'}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900">Resume-to-Job Fit Analysis</h2>
              <p className="text-xs text-slate-500">
                Explainable breakdown comparing technical skills, experience tier, and semantic text overlap.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={recalculatingMatch}
            onClick={handleRecalculateMatch}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${recalculatingMatch ? 'animate-spin text-indigo-600' : 'text-slate-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{recalculatingMatch ? 'Recalculating...' : 'Recalculate Match'}</span>
          </button>
        </div>

        {matchError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {matchError}
          </div>
        )}

        {!matchResult ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 mb-3">No match score calculated yet for this application.</p>
            <button
              onClick={handleRecalculateMatch}
              disabled={recalculatingMatch}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              {recalculatingMatch ? 'Analyzing...' : 'Run Match Analysis Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Component Breakdown Progress Bars */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Score Component Breakdown (Formula Weights)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Required Skills */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Required Skills{' '}
                      <span className="text-slate-400 font-normal">
                        ({matchResult.breakdown?.components?.required_skills?.weight_pct || 40}%)
                      </span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {matchResult.breakdown?.components?.required_skills?.score ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${matchResult.breakdown?.components?.required_skills?.score ?? 0}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {matchResult.breakdown?.components?.required_skills?.note || 'Technical requirements overlap.'}
                  </p>
                </div>

                {/* 2. Optional Skills */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Optional Skills{' '}
                      <span className="text-slate-400 font-normal">
                        ({matchResult.breakdown?.components?.optional_skills?.weight_pct || 15}%)
                      </span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {matchResult.breakdown?.components?.optional_skills?.score ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${matchResult.breakdown?.components?.optional_skills?.score ?? 0}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {matchResult.breakdown?.components?.optional_skills?.note || 'Bonus qualifications.'}
                  </p>
                </div>

                {/* 3. Text Semantic Similarity */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Semantic Similarity (TF-IDF){' '}
                      <span className="text-slate-400 font-normal">
                        ({matchResult.breakdown?.components?.text_similarity?.weight_pct || 25}%)
                      </span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {matchResult.breakdown?.components?.text_similarity?.score ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${matchResult.breakdown?.components?.text_similarity?.score ?? 0}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {matchResult.breakdown?.components?.text_similarity?.note || 'Cosine similarity.'}
                  </p>
                </div>

                {/* 4. Experience & Education Alignment */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Experience &amp; Education{' '}
                      <span className="text-slate-400 font-normal">(20%)</span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {Math.round(
                        ((matchResult.experience_score || 0) + (matchResult.education_score || 0)) / 2
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(
                          ((matchResult.experience_score || 0) + (matchResult.education_score || 0)) / 2
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Target level: {matchResult.breakdown?.components?.experience_alignment?.target_level || 'N/A'}.{' '}
                    {matchResult.breakdown?.components?.experience_alignment?.note}
                  </p>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Matched Skills */}
              <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Matching Technical Skills ({matchResult.matching_skills?.length || 0})
                  </h4>
                </div>
                {matchResult.matching_skills && matchResult.matching_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchResult.matching_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No skills currently match job requirements.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="border border-rose-100 bg-rose-50/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Missing Job Skills ({matchResult.missing_skills?.length || 0})
                  </h4>
                </div>
                {matchResult.missing_skills && matchResult.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchResult.missing_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200"
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Candidate possesses all listed job skills!</p>
                )}
              </div>
            </div>

            {/* Ethical AI Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <strong className="font-semibold text-slate-800">Scoring Methodology &amp; Ethics Notice: </strong>
                {matchResult.breakdown?.disclaimer ||
                  'This score is calculated algorithmically using deterministic skill matching and TF-IDF text similarity to assist human recruiters in screening. It is not an automated hiring decision or guarantee.'}
                <div className="mt-1 text-[10px] text-slate-400">
                  Calculated at: {new Date(matchResult.calculated_at).toLocaleString()}
                </div>
              </div>
            </div>
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
            <button
              type="button"
              disabled={downloadingResume}
              onClick={handleDownloadResume}
              className="px-3 py-1 rounded text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {downloadingResume ? (
                <>
                  <svg className="w-3 h-3 animate-spin text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Document</span>
                </>
              )}
            </button>

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
