import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Loader2, Lock, Mail } from 'lucide-react';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../lib/firebase';
import { isAdminEmail } from '../lib/admin';
import {
  DEMO_ADMIN,
  DEMO_MODE,
  DEMO_STUDENT,
  SIMPLE_EMAIL_LOGIN,
  loginWithSimpleEmail,
  startDemoSession,
} from '../lib/demo';
import SEO from '../components/SEO';

function authErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) return 'Sign in failed. Please try again.';

  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow pop-ups and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
  };

  return messages[error.code] || 'Sign in failed. Please try again.';
}

function safeRedirect(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/dashboard';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = safeRedirect((location.state as { from?: unknown } | null)?.from);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState('');

  const destinationFor = (userEmail?: string | null) => {
    if (requestedPath !== '/dashboard') return requestedPath;
    return isAdminEmail(userEmail) ? '/admin' : '/dashboard';
  };

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoadingAction('email');

    try {
      if (SIMPLE_EMAIL_LOGIN) {
        loginWithSimpleEmail(email);
        window.location.assign(destinationFor(email));
        return;
      }

      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(destinationFor(result.user.email), { replace: true });
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoadingAction('google');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      navigate(destinationFor(result.user.email), { replace: true });
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDemoSignIn = (role: 'student' | 'admin') => {
    const demoUser = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    startDemoSession(demoUser, role);
    window.location.assign(role === 'admin' ? '/admin' : requestedPath);
  };

  const isBusy = loadingAction !== null;

  return (
    <>
      <SEO
        title="Login"
        description="Sign in to Mathemzi Edu to access your courses, exams, payments, and certificates."
        path="/login"
      />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10">
            <Link to="/" className="flex justify-center mb-8" aria-label="Mathemzi Edu home">
              <span className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-[#10B981]" aria-hidden="true" />
                <span className="font-bold text-2xl text-white">
                  Mathemzi<span className="text-[#10B981]">Edu</span>
                </span>
              </span>
            </Link>

            <h1 className="text-center text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-center text-sm text-slate-400 mb-8">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>

            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Email</span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </span>
              </label>

              {!SIMPLE_EMAIL_LOGIN && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Password</span>
                  <span className="relative block">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input
                      type="password"
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      required
                      minLength={6}
                      autoComplete="current-password"
                      placeholder="Your password"
                      className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </span>
                </label>
              )}

              {!SIMPLE_EMAIL_LOGIN && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-xs font-semibold text-blue-300 hover:text-blue-200">
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="w-full rounded-xl bg-[#2563EB] px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {loadingAction === 'email' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loadingAction === 'email' ? 'Signing in...' : 'Sign in with email'}
                </span>
              </button>
            </form>

            {!SIMPLE_EMAIL_LOGIN && (
              <>
                <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
                  <span className="h-px flex-1 bg-white/10" />
                  or
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isBusy}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/10 bg-white hover:bg-gray-50 transition-colors shadow-lg text-gray-700 font-bold text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingAction === 'google' ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-black text-blue-600" aria-hidden="true">G</span>
                  )}
                  {loadingAction === 'google' ? 'Connecting...' : 'Continue with Google'}
                </button>
              </>
            )}

            {DEMO_MODE && (
              <div className="mt-6 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
                <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-purple-200">Local demo access</p>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => handleDemoSignIn('student')} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-white hover:bg-white/10">
                    Demo Student
                  </button>
                  <button type="button" onClick={() => handleDemoSignIn('admin')} className="rounded-xl border border-purple-300/20 bg-purple-500/20 px-3 py-2.5 text-xs font-bold text-purple-100 hover:bg-purple-500/30">
                    Demo Admin
                  </button>
                </div>
              </div>
            )}

            {!SIMPLE_EMAIL_LOGIN && (
              <p className="mt-7 text-center text-sm text-slate-400">
                New to Mathemzi Edu?{' '}
                <Link to="/register" state={{ from: requestedPath }} className="font-bold text-[#10B981] hover:text-emerald-300">
                  Create an account
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
