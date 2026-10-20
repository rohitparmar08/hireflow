import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import jobsApi from '../../api/jobs.api';
import SkillTagInput from '../../components/SkillTagInput';

export default function EditJob() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    location_type: 'REMOTE',
    employment_type: 'FULL_TIME',
    experience_level: 'MID',
    min_salary: '',
    max_salary: '',
    salary_currency: 'USD',
    description: '',
    status: 'ACTIVE',
  });

  const [requiredSkills, setRequiredSkills] = useState([]);
  const [optionalSkills, setOptionalSkills] = useState([]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const job = await jobsApi.getJobDetail(id);

        // Security check
        if (user && job.recruiter_id !== user.id) {
          navigate('/recruiter/dashboard', { replace: true });
          return;
        }

        setFormData({
          title: job.title || '',
          company_name: job.company_name || '',
          location: job.location || '',
          location_type: job.location_type || 'REMOTE',
          employment_type: job.employment_type || 'FULL_TIME',
          experience_level: job.experience_level || 'MID',
          min_salary: job.min_salary || '',
          max_salary: job.max_salary || '',
          salary_currency: job.salary_currency || 'USD',
          description: job.description || '',
          status: job.status || 'ACTIVE',
        });

        setRequiredSkills(job.required_skills || []);
        setOptionalSkills(job.optional_skills || []);
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (requiredSkills.length === 0) {
      setErrorMessage('Please provide at least one required skill.');
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
      await jobsApi.updateJob(id, payload);
      navigate(`/jobs/${id}`);
    } catch (err) {
      const respData = err.response?.data;
      let msg = 'Failed to update job posting.';
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading job for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to={`/jobs/${id}`} className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">
          &larr; Back to Job Overview
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Job Opening</h1>
          <p className="text-xs text-slate-500 mt-1">
            Update role details, skill criteria, or status.
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
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="ACTIVE">Active (Publicly Listed)</option>
                <option value="DRAFT">Draft (Unlisted)</option>
                <option value="CLOSED">Closed (Archived)</option>
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
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Interactive Skills Input */}
          <div className="space-y-4 pt-2">
            <SkillTagInput
              tags={requiredSkills}
              onChange={setRequiredSkills}
              label="Required Skills"
              required={true}
              variant="primary"
              helperText="These skills are used by the AI engine to evaluate matching criteria."
              placeholder="Type required skill (e.g. React) and press Enter..."
            />

            <SkillTagInput
              tags={optionalSkills}
              onChange={setOptionalSkills}
              label="Optional / Preferred Skills"
              required={false}
              variant="neutral"
              helperText="Bonus skills that enhance match rankings."
              placeholder="Type optional skill and press Enter..."
            />
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
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Link
              to={`/jobs/${id}`}
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
            >
              {submitting ? 'Saving Changes...' : 'Save Job Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
