// Auth Modal for desktop app
import React, { useState } from 'react';
import { X, Mail, Lock, Cloud, CloudOff } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../services/auth';
import { isSupabaseConfigured } from '../services/supabase';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isConfigured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (mode !== 'reset' && !password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess?.();
        onClose();
      } else if (mode === 'signup') {
        await signUp(email, password);
        setMessage('Check your email for a confirmation link');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Check your email for a password reset link');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {!isConfigured ? (
          <div className="text-center py-8">
            <CloudOff size={48} className="text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Cloud Sync Not Configured</h2>
            <p className="text-gray-400 mb-4">
              To enable cloud sync between devices, set up your Supabase credentials
              in the app configuration.
            </p>
            <p className="text-gray-500 text-sm">
              The app works offline with local storage.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <Cloud size={48} className="text-purple-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white">
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'reset' && 'Reset Password'}
              </h2>
              <p className="text-gray-400 text-sm">
                Sync your books across all devices
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-2 rounded-lg text-sm">
                  {message}
                </div>
              )}

              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {mode !== 'reset' && (
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
              >
                {isLoading ? 'Loading...' : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'reset' && 'Send Reset Link'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'login' && (
                <>
                  <p className="text-gray-400">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Sign up
                    </button>
                  </p>
                  <button
                    onClick={() => setMode('reset')}
                    className="text-gray-500 hover:text-gray-400 mt-2"
                  >
                    Forgot password?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {mode === 'reset' && (
                <p className="text-gray-400">
                  Remember your password?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
