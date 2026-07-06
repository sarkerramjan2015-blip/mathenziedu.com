import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isAdminEmail } from '../lib/admin';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || '';
      // Redirect admin to /admin, others to /dashboard
      navigate(isAdminEmail(email) ? '/admin' : '/dashboard');
    } catch (err: any) {
      console.error('Google Sign-in error:', err.message);
      alert('Sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 w-full">
      <div className="max-w-md w-full">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-[#10B981]" />
              <span className="font-bold text-2xl text-white">
                Mathemzi<span className="text-[#10B981]">Edu</span>
              </span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-center text-2xl font-bold text-white mb-2">
            Login with Gmail
          </h2>
          <p className="text-center text-xs text-slate-400 mb-8">
            Gmail দিয়ে প্রবেশ করুন
          </p>

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/10 bg-white hover:bg-gray-50 transition-all shadow-lg text-gray-700 font-bold text-sm"
          >
            <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="mt-6 mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-slate-500 text-xs">or</span>
            </div>
          </div>

          {/* Guide Text */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-xs text-slate-400 mb-3">
              Admin এবং Student একই Gmail দিয়ে লগইন করবে।
              Google Sign-in করলে স্বয়ংক্রিয়ভাবে আপনার একাউন্ট তৈরি হবে।
            </p>
            <p className="text-[10px] text-[#10B981] font-bold">
               Login with Google and access Mathemzi Edu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
