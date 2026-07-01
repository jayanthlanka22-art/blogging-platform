import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { BookOpen, LogOut, PlusCircle, User, Shield } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-white hover:text-brand-400 transition-colors">
                <BookOpen className="h-6 w-6 text-brand-500" />
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  ByteStream Blog
                </span>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-dark-card transition-all"
                >
                  Articles
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/write"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-950/20 transition-all duration-200"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Write</span>
                  </Link>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border">
                    <User className="h-4 w-4 text-brand-400" />
                    <span className="text-sm font-semibold text-gray-200">{user.username}</span>
                    {user.role === 'ADMIN' && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all duration-200"
                    title="Log Out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-dark-card border border-dark-border hover:border-brand-500 text-white rounded-lg transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-bg/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-600" />
            <span>© 2026 ByteStream Blog. Production SaaS Platform.</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
