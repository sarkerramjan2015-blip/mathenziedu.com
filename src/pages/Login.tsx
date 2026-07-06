import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Eye, Shield, User } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { DEMO_MODE, DEMO_STUDENT, DEMO_ADMIN, DEMO_STUDENT_PASSWORD, DEMO_ADMIN_PASSWORD, startDemoSession } from '../lib/demo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('');
      setLoading(true);
      try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      setStatus('');
      await signInWithPopup(auth, provider);
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleDemoLogin = (role: 'student' | 'admin') => {
    const user = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    startDemoSession(user, role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 w-full">
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
          
          <h2 className="text-center text-2xl font-bold text-white mb-8">Sign in to your account</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {status && (
            <div className="bg-[#10B981]/10 border border-[#10B981]/40 text-[#10B981] p-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
              {status}
            </div>
          )}

          {/* Demo Mode Section */}
          {DEMO_MODE && (
            <div className="mb-8 -mx-2 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Demo Access — Local Preview Only</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDemoLogin('student')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 hover:border-[#10B981]/40 transition-all group"
                >
                  <User className="h-5 w-5 text-[#10B981] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Demo Student</span>
                  <span className="text-[9px] text-slate-400">{DEMO_STUDENT_PASSWORD}</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('admin')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 hover:border-[#F59E0B]/40 transition-all group"
                >
                  <Shield className="h-5 w-5 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Demo Admin</span>
                  <span className="text-[9px] text-slate-400">{DEMO_ADMIN_PASSWORD}</span>
                </button>
              </div>
              <p className="text-[9px] text-slate-500 mt-3 text-center">Demo passwords shown above are for UI reference only. No real Firebase login required.</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Email address</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" 
                required 
                className="appearance-none block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl shadow-inner placeholder-slate-500 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors text-white sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" 
                required 
                className="appearance-none block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl shadow-inner placeholder-slate-500 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors text-white sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-black/20 border-white/10 text-[#2563EB] focus:ring-[#2563EB] rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">Remember me</label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-[#2563EB] hover:text-blue-400">Forgot password?</Link>
              </div>
            </div>

            <div>
              <button disabled={loading} type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-[#2563EB] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] focus:ring-[#2563EB] transition-all disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-slate-400 relative z-10 before:absolute before:-z-10 before:inset-0 before:bg-[#0F172A] before:backdrop-blur-md">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button onClick={handleGoogleLogin} type="button" className="w-full flex justify-center py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/10 transition-colors shadow-sm">
              <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#10B981] hover:text-emerald-400">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}
