import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrUsername || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    const success = await login(emailOrUsername, password);
    setSubmitting(false);

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl border border-dark-border animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-brand-950/50 border border-brand-500/20 text-brand-400 mb-3">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-sm text-gray-400 mt-2">Sign in to your account to write posts and comments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Email or Username
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
              placeholder="e.g. admin or admin@blog.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-950/20 disabled:opacity-50 transition-all duration-200 mt-2"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};
