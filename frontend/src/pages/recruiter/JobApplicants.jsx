import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import applicationsApi from '../../api/applications.api';
import jobsApi from '../../api/jobs.api';

export default function JobApplicants() {
  const { id } = useParams(); // Job ID

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [jobData, appData] = await Promise.all([
        jobsApi.getJobDetail(id),
        applicationsApi.getJobApplicants(id, { status: statusFilter || undefined }),
      ]);
      setJob(jobData);
      setApplicants(appData.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  }, [id, statusFilter]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

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
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/recruiter/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          &larr; Back to Recruiter Dashboard
        </Link>
        {job && (
          <Link
            to={`/jobs/${job.id}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            View Live Job Posting &rarr;
          </Link>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Applicant Pipeline
              </span>
              {job && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    job.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {job.status}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job ? job.title : 'Loading Position...'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review candidate submissions, inspect extracted resume skills, and update application stages.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center self-start sm:self-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Applicants
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{applicants.length}</div>
          </div>
        </div>
      </div>

      {/* Pipeline Filter Tabs & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2">
          {[
            { label: 'All Candidates', value: '' },
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
            Loading candidate applicants...
          </div>
        )}

        {!loading && applicants.length === 0 && (
          <div className="p-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">No applicants found</h3>
            <p className="text-xs text-slate-500">
              {statusFilter
                ? `No applications currently have status '${statusFilter}'.`
                : 'No candidates have applied for this position yet.'}
            </p>
          </div>
        )}

        {!loading && applicants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Detected Skills (Extracted)</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Applied Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{app.candidate_name}</div>
                      <div className="text-[11px] text-slate-500">{app.candidate_email}</div>
                      {app.candidate_headline && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{app.candidate_headline}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {app.parsed_skills && app.parsed_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {app.parsed_skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              {skill}
                            </span>
                          ))}
                          {app.parsed_skills.length > 4 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{app.parsed_skills.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No skills extracted</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition inline-block"
                      >
                        Review Profile &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
