import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, Loader2, Mail } from 'lucide-react';
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isAdminUser } from '../lib/admin';
import {
  DEMO_ADMIN,
  DEMO_MODE,
  DEMO_STUDENT,
  startDemoSession,
} from '../lib/demo';
import SEO from '../components/SEO';

const EMAIL_STORAGE_KEY = 'mathenzi-email-for-sign-in';

function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';

  if (!code) return 'Sign-in failed. Please try again.';

  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email or sign-in link is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow pop-ups and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet. Please contact support.',
    'auth/unauthorized-domain': 'This website domain is not authorized for sign-in yet.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/expired-action-code': 'This sign-in link has expired. Please request a new one.',
    'auth/invalid-action-code': 'This sign-in link is invalid or has already been used.',
  };

  return messages[code] || `Sign-in failed (${code}). Please try again.`;
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
  const [email, setEmail] = useState(() => window.localStorage.getItem(EMAIL_STORAGE_KEY) || '');
  const [loadingAction, setLoadingAction] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const autoCompleteEmail = useRef(email);
  const isEmailLink = isSignInWithEmailLink(auth, window.location.href);

  const destinationFor = useCallback(async (firebaseUser?: User | null) => {
    if (requestedPath !== '/dashboard') return requestedPath;
    if (!firebaseUser) return '/dashboard';

    try {
      const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
      const role = userSnapshot.data()?.role;
      return isAdminUser(typeof role === 'string' ? role : null, firebaseUser.email, firebaseUser.emailVerified)
        ? '/admin'
        : '/dashboard';
    } catch {
      // ProtectedRoute remains the authority for access; this only selects the best landing page.
      return isAdminUser(null, firebaseUser.email, firebaseUser.emailVerified) ? '/admin' : '/dashboard';
    }
  }, [requestedPath]);

  const completeEmailSignIn = useCallback(async (emailAddress: string) => {
    const normalizedEmail = emailAddress.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter the Gmail address that received the sign-in link.');
      return;
    }

    setError('');
    setLoadingAction('email');
    try {
      const result = await signInWithEmailLink(auth, normalizedEmail, window.location.href);
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      navigate(await destinationFor(result.user), { replace: true });
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      setLoadingAction(null);
    }
  }, [destinationFor, navigate]);

  useEffect(() => {
    if (!isEmailLink || !autoCompleteEmail.current) return;
    const savedEmail = autoCompleteEmail.current;
    autoCompleteEmail.current = '';
    void completeEmailSignIn(savedEmail);
  }, [completeEmailSignIn, isEmailLink]);

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your Gmail address.');
      return;
    }

    if (isEmailLink) {
      await completeEmailSignIn(normalizedEmail);
      return;
    }

    setError('');
    setLinkSent(false);
    setLoadingAction('email');
    try {
      await sendSignInLinkToEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_STORAGE_KEY, normalizedEmail);
      setLinkSent(true);
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLinkSent(false);
    setLoadingAction('google');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      navigate(await destinationFor(result.user), { replace: true });
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
        description="Sign in to Mathenzi Edu to access your courses, exams, payments, and certificates."
        path="/login"
      />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="max-w-md w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10">
            <Link to="/" className="flex justify-center mb-8" aria-label="Mathenzi Edu home">
              <span className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-[#10B981]" aria-hidden="true" />
                <span className="font-bold text-2xl text-white">
                  Mathenzi<span className="text-[#10B981]">Edu</span>
                </span>
              </span>
            </Link>

            <h1 className="text-center text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-center text-sm text-slate-400 mb-8">আপনার Gmail অ্যাকাউন্ট দিয়ে প্রবেশ করুন</p>

            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {linkSent && (
              <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Sign-in link sent. Please check your Gmail inbox and spam folder.</span>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-xs font-bold uppercase text-slate-400">Gmail address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@gmail.com"
                    disabled={isBusy}
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-950/30 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-400/50 disabled:opacity-60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === 'email' && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                {loadingAction === 'email' ? 'Signing in...' : isEmailLink ? 'Complete sign in' : 'Send sign-in link'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-500" aria-hidden="true">
              <span className="h-px flex-1 bg-white/10" />
              <span>or</span>
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

          </div>
        </div>
      </div>
    </>
  );
}
