import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Loader2 } from 'lucide-react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
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

function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';

  if (!code) return 'Google sign-in failed. Please try again.';

  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Please allow pop-ups and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled yet. Please contact support.',
    'auth/unauthorized-domain': 'This website domain is not authorized for Google sign-in yet.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
  };

  return messages[code] || `Google sign-in failed (${code}). Please try again.`;
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
  const [loadingAction, setLoadingAction] = useState<'google' | null>(null);
  const [error, setError] = useState('');

  const destinationFor = async (firebaseUser?: User | null) => {
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
  };

  useEffect(() => {
    let isActive = true;

    const finishRedirectSignIn = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && isActive) {
          navigate(await destinationFor(result.user), { replace: true });
        }
      } catch (redirectError) {
        if (isActive) setError(authErrorMessage(redirectError));
      }
    };

    void finishRedirectSignIn();
    return () => { isActive = false; };
  }, [navigate, requestedPath]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoadingAction('google');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithRedirect(auth, provider);
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
