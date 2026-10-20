import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import jobsApi from '../../api/jobs.api';

export default function JobListing() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter states initialized from query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [locationType, setLocationType] = useState(searchParams.get('location_type') || '');
  const [employmentType, setEmploymentType] = useState(searchParams.get('employment_type') || '');
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get('experience_level') || '');
  const [skill, setSkill] = useState(searchParams.get('skill') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1,
    results: [],
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    const query = {
      search: search || undefined,
      location_type: locationType || undefined,
      employment_type: employmentType || undefined,
      experience_level: experienceLevel || undefined,
      skill: skill || undefined,
      page: page > 1 ? page : undefined,
    };

    // Synchronize URL search params
    const cleanParams = {};
    if (search) cleanParams.search = search;
    if (locationType) cleanParams.location_type = locationType;
    if (employmentType) cleanParams.employment_type = employmentType;
    if (experienceLevel) cleanParams.experience_level = experienceLevel;
    if (skill) cleanParams.skill = skill;
    if (page > 1) cleanParams.page = page.toString();
    setSearchParams(cleanParams);

    try {
      const response = await jobsApi.getPublicJobs(query);
      setData(response);
    } catch (err) {
      setError(err.message || 'Unable to load job opportunities.');
    } finally {
      setLoading(false);
    }
  }, [search, locationType, employmentType, experienceLevel, skill, page, setSearchParams]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setLocationType('');
    setEmploymentType('');
    setExperienceLevel('');
    setSkill('');
    setPage(1);
  };

  const hasActiveFilters =
    search || locationType || employmentType || experienceLevel || skill;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Job Opportunities
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Discover verified engineering and technical roles matching your skills.
        </p>
      </div>

      {/* Search Bar & Filters Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-8">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job title, company, or keywords..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  &times;
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
            >
              Search Jobs
            </button>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Location Type
              </label>
              <select
                value={locationType}
                onChange={(e) => {
                  setLocationType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Locations</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Employment</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => {
                  setExperienceLevel(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Levels</option>
                <option value="ENTRY">Entry-level</option>
                <option value="MID">Mid-level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead / Staff</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Skill Tag
              </label>
              <input
                type="text"
                value={skill}
                onChange={(e) => {
                  setSkill(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. Python, React..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Active Filter Indicators & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Found <strong className="text-slate-800">{data.count}</strong> matching openings
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset all filters
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={fetchJobs}
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse"
            >
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-slate-100 rounded w-1/4 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-slate-100 rounded w-16"></div>
                <div className="h-6 bg-slate-100 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data.results.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No matching jobs found</h3>
          <p className="text-xs text-slate-500 mb-6">
            We couldn&apos;t find any active job postings matching your current search criteria.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
            >
              Clear filters and view all
            </button>
          )}
        </div>
      )}

      {/* Jobs List */}
      {!loading && !error && data.results.length > 0 && (
        <div className="space-y-4">
          {data.results.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {job.company_name}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {job.location} ({job.location_type})
                  </span>
                  <span>&bull;</span>
                  <span>{job.employment_type?.replace('_', ' ')}</span>
                  <span>&bull;</span>
                  <span>{job.experience_level}</span>
                  {job.min_salary && job.max_salary && (
                    <>
                      <span>&bull;</span>
                      <span className="font-semibold text-emerald-700">
                        ${Number(job.min_salary).toLocaleString()} - ${Number(job.max_salary).toLocaleString()} {job.salary_currency}
                      </span>
                    </>
                  )}
                </div>

                {/* Skill Chips */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.required_skills.slice(0, 5).map((skillName, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        {skillName}
                      </span>
                    ))}
                    {job.required_skills.length > 5 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{job.required_skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 sm:self-center">
                <Link
                  to={`/jobs/${job.id}`}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-center text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                &larr; Previous
              </button>

              <span className="text-xs text-slate-500">
                Page <strong className="text-slate-800">{data.current_page}</strong> of{' '}
                <strong className="text-slate-800">{data.total_pages}</strong>
              </span>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, data.total_pages))}
                disabled={page >= data.total_pages}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
