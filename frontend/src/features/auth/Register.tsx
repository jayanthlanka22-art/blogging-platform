import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserPlus, Check, X } from 'lucide-react';
import { RegisterSchema } from '../../../../backend/src/utils/validation';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password rules validation states
  const [rules, setRules] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    setRules({
      length: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Apply Zod register validation client-side
    const result = RegisterSchema.safeParse({ email, username, password });
    if (!result.success) {
      const issue = result.error.errors[0];
      setError(issue.message);
      return;
    }

    setSubmitting(true);
    const success = await register(email, username, password);
    setSubmitting(false);

    if (success) {
      navigate('/login');
    }
  };

  const RuleIndicator = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-1.5 text-xs ${valid ? 'text-emerald-400' : 'text-gray-500'}`}>
      {valid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-[85vh]">
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl border border-dark-border animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-brand-950/50 border border-brand-500/20 text-brand-400 mb-3">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Create Account</h2>
          <p className="text-sm text-gray-400 mt-2">Get started with a free account today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
              placeholder="e.g. author@blog.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
              placeholder="e.g. author1"
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

          {/* Password Validation Matrix */}
          <div className="p-3 rounded-lg bg-dark-bg/60 border border-dark-border grid grid-cols-2 gap-2 my-2">
            <RuleIndicator valid={rules.length} text="Min 8 characters" />
            <RuleIndicator valid={rules.lower} text="Lowercase letter" />
            <RuleIndicator valid={rules.upper} text="Uppercase letter" />
            <RuleIndicator valid={rules.number} text="Number digit" />
            <div className="col-span-2">
              <RuleIndicator valid={rules.special} text="Special character (!@#...)" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-950/20 disabled:opacity-50 transition-all duration-200 mt-2"
          >
            {submitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
