import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobsApi from '../../api/jobs.api';

export default function CreateJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    company_name: user?.company_name || '',
    location: '',
    location_type: 'REMOTE',
    employment_type: 'FULL_TIME',
    experience_level: 'MID',
    min_salary: '',
    max_salary: '',
    salary_currency: 'USD',
    required_skills_input: '',
    optional_skills_input: '',
    description: '',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Parse comma-separated skills
    const requiredSkills = formData.required_skills_input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const optionalSkills = formData.optional_skills_input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (requiredSkills.length === 0) {
      setErrorMessage('Please provide at least one required skill (comma-separated).');
      return;
    }

    if (formData.min_salary && formData.max_salary) {
      if (Number(formData.min_salary) > Number(formData.max_salary)) {
        setErrorMessage('Maximum salary must be greater than or equal to minimum salary.');
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      title: formData.title.trim(),
      company_name: formData.company_name.trim(),
      location: formData.location.trim(),
      location_type: formData.location_type,
      employment_type: formData.employment_type,
      experience_level: formData.experience_level,
      description: formData.description.trim(),
      required_skills: requiredSkills,
      optional_skills: optionalSkills,
      min_salary: formData.min_salary ? Number(formData.min_salary) : null,
      max_salary: formData.max_salary ? Number(formData.max_salary) : null,
      salary_currency: formData.salary_currency,
      status: formData.status,
    };

    try {
      const createdJob = await jobsApi.createJob(payload);
      navigate(`/jobs/${createdJob.id}`);
    } catch (err) {
      const respData = err.response?.data;
      let msg = 'Failed to create job posting. Please check all fields.';
      if (respData) {
        if (typeof respData === 'string') {
          msg = respData;
        } else if (respData.detail) {
          msg = respData.detail;
        } else {
          const firstKey = Object.keys(respData)[0];
          msg = `${firstKey}: ${respData[firstKey]}`;
        }
      }
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to="/recruiter/dashboard" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">
          &larr; Back to Recruiter Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Post a New Job Opening</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish an active role or save as a draft for future recruitment.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Full-Stack Engineer"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Hiring Company *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Acme Talent Corp"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Location & Location Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. San Francisco, CA or Remote (US/EU)"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Workplace Model *
              </label>
              <select
                name="location_type"
                value={formData.location_type}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>
          </div>

          {/* Employment Type & Experience Level & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Employment Type *
              </label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Seniority Level *
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ENTRY">Entry-level</option>
                <option value="MID">Mid-level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead / Staff</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Publication Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ACTIVE">Publish (Active)</option>
                <option value="DRAFT">Save as Draft</option>
              </select>
            </div>
          </div>

          {/* Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Minimum Annual Salary
              </label>
              <input
                type="number"
                name="min_salary"
                value={formData.min_salary}
                onChange={handleChange}
                placeholder="100000"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Maximum Annual Salary
              </label>
              <input
                type="number"
                name="max_salary"
                value={formData.max_salary}
                onChange={handleChange}
                placeholder="150000"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                name="salary_currency"
                value={formData.salary_currency}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Skills Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Required Skills (Comma-separated) *
              </label>
              <input
                type="text"
                name="required_skills_input"
                value={formData.required_skills_input}
                onChange={handleChange}
                placeholder="e.g. Python, Django, PostgreSQL, REST APIs"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                These tags will be used by the Phase 5 AI Resume Matching Engine to compute qualification scores.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Optional / Nice-to-Have Skills (Comma-separated)
              </label>
              <input
                type="text"
                name="optional_skills_input"
                value={formData.optional_skills_input}
                onChange={handleChange}
                placeholder="e.g. Docker, Kubernetes, AWS, Redis"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Detailed Job Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Job Description &amp; Requirements *
            </label>
            <textarea
              name="description"
              rows={8}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role, day-to-day responsibilities, qualifications, and team culture..."
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Link
              to="/recruiter/dashboard"
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
            >
              {submitting ? 'Creating Job...' : 'Publish Job Opening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
