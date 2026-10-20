import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [role, setRole] = useState('CANDIDATE'); // 'CANDIDATE' or 'RECRUITER'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    headline: '',
    password: '',
    password_confirm: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirm) {
      setFormError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (role === 'RECRUITER' && !formData.company_name.trim()) {
      setFormError('Company name is required for recruiter accounts.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        role: role,
        password: formData.password,
        password_confirm: formData.password_confirm,
        headline: formData.headline.trim(),
        ...(role === 'RECRUITER' ? { company_name: formData.company_name.trim() } : {}),
      };

      const user = await register(payload);
      const dest = user.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-lg w-full bg-white p-8 sm:p-9 rounded-3xl shadow-xs border border-slate-200/80">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose your account role and get started in seconds
          </p>
        </div>

        {/* Visual Role Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('CANDIDATE')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'CANDIDATE'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-600'
            }`}
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-2">
                👤
              </div>
              <div className="font-bold text-xs text-slate-900">Job Seeker</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Apply for jobs with AI match scores
              </p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              {role === 'CANDIDATE' ? '✓ Selected' : 'Select'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('RECRUITER')}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'RECRUITER'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-600'
            }`}
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm mb-2">
                💼
              </div>
              <div className="font-bold text-xs text-slate-900">Recruiter</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Post roles &amp; rank candidate resumes
              </p>
            </div>
            <div className="mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              {role === 'RECRUITER' ? '✓ Selected' : 'Select'}
            </div>
          </button>
        </div>

        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <span className="font-bold text-red-800">Error:</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Jane"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@domain.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {role === 'RECRUITER' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
                Company / Agency Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Acme Talent Corp"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Headline / Title
            </label>
            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              placeholder={
                role === 'RECRUITER'
                  ? 'Head of Talent Acquisition'
                  : 'Full-Stack Developer | Python & React'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>Minimum 8 characters</span>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {showPassword ? 'Hide passwords' : 'Show passwords'}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition shadow-xs mt-2"
          >
            {submitting ? 'Creating account...' : `Sign Up as ${role === 'RECRUITER' ? 'Recruiter' : 'Candidate'}`}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
