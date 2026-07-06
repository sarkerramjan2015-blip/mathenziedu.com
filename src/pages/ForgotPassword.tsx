import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import SEO from '../components/SEO';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Forgot Password" description="Reset your Mathemzi Edu account password." path="/forgot-password" />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 relative z-10 w-full">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10">
            <div className="flex justify-center mb-8">
              <Link to="/" className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-[#10B981]" />
                <span className="font-display font-bold text-2xl text-white">
                  Mathemzi<span className="text-[#10B981]">Edu</span>
                </span>
              </Link>
            </div>

            {sent ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 mb-6">
                  <CheckCircle className="h-8 w-8 text-[#10B981]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-slate-400 text-sm mb-6">
                  A password reset link has been sent to <strong className="text-white">{email}</strong>. Please check your inbox and follow the instructions.
                </p>
                <p className="text-xs text-slate-500 mb-8">Didn't receive it? Check your spam folder or try again.</p>
                <Link to="/login" className="inline-block bg-[#2563EB] text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg">
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-center text-2xl font-bold text-white mb-2">Forgot Password</h2>
                <p className="text-center text-slate-400 text-sm mb-8">Enter your email and we'll send you a reset link.</p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </div>
                )}

                <form onSubmit={handleReset} className="space-y-6">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Email address</label>
                    <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="appearance-none block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl shadow-inner placeholder-slate-500 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] text-white sm:text-sm"
                      placeholder="you@example.com" />
                  </div>
                  <button disabled={loading} type="submit"
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-full shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-[#2563EB] hover:bg-blue-600 transition-all disabled:opacity-50">
                    {loading ? 'Sending...' : <><Mail className="h-4 w-4" /> Send Reset Link</>}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-400">
                  Remember your password?{' '}
                  <Link to="/login" className="font-bold text-[#10B981] hover:text-emerald-400">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
