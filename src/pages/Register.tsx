import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../lib/firebase';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = (location.state as { from?: unknown } | null)?.from;
  const redirectTo = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
    ? requestedPath
    : '/dashboard';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, text: '', color: 'bg-slate-700' };
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score === 0) return { score, text: 'Very Weak', color: 'bg-red-500' };
    if (score === 1) return { score, text: 'Weak', color: 'bg-red-400' };
    if (score === 2) return { score, text: 'Fair', color: 'bg-yellow-400' };
    if (score === 3) return { score, text: 'Good', color: 'bg-blue-400' };
    return { score, text: 'Strong', color: 'bg-[#10B981]' };
  };

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (validate()) {
      setIsSubmitting(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, {
          displayName: formData.name
        });
        try {
          await sendEmailVerification(userCredential.user);
        } catch {
          // The dashboard offers a resend action if email delivery is temporarily unavailable.
        }
        
        // Auth observer in Context will handle creating the user document, but we can update it early if needed
        navigate(redirectTo, { state: { accountCreated: true } });
      } catch (err) {
        const code = err instanceof FirebaseError ? err.code : '';
        setServerError(
          code === 'auth/email-already-in-use'
            ? 'An account already exists for this email. Please sign in instead.'
            : code === 'auth/weak-password'
              ? 'Choose a stronger password with at least 8 characters.'
              : 'Could not create your account. Please try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setServerError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(redirectTo);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setServerError(code === 'auth/popup-closed-by-user' ? 'Google sign-in was cancelled.' : 'Could not sign in with Google. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 w-full overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#2563EB] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#10B981] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-5 mix-blend-overlay"></div>

          <div className="flex justify-center mb-8 relative z-10">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="font-display font-bold text-2xl text-white tracking-tight uppercase">
                Mathenzi<span className="text-[#10B981]">Edu</span>
              </span>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Join Free Today</h2>
            <p className="mt-2 text-sm text-slate-400 font-medium">Create your account and start discovering maths</p>
          </div>
          
          {serverError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm relative z-10">
              <AlertCircle className="h-4 w-4" />
              {serverError}
            </div>
          )}

          <form className="space-y-5 relative z-10" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
              <div className="relative">
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-black/20 border ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-[#2563EB] focus:ring-[#2563EB]'} rounded-xl shadow-inner placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors text-white sm:text-sm`}
                  placeholder="John Doe"
                />
                {errors.name && <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />}
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <div className="relative">
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-black/20 border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-[#2563EB] focus:ring-[#2563EB]'} rounded-xl shadow-inner placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors text-white sm:text-sm`}
                  placeholder="you@example.com"
                />
                {errors.email && <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />}
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-black/20 border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-[#2563EB] focus:ring-[#2563EB]'} rounded-xl shadow-inner placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors text-white sm:text-sm`}
                  placeholder="••••••••"
                />
                {errors.password && <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />}
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Password strength:</span>
                    <span className={`text-xs font-semibold ${strength.text === 'Strong' ? 'text-[#10B981]' : strength.text === 'Good' ? 'text-blue-400' : strength.text === 'Fair' ? 'text-yellow-400' : 'text-red-400'}`}>{strength.text}</span>
                  </div>
                  <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-white/5">
                    {[0, 1, 2, 3].map((index) => (
                      <div 
                        key={index} 
                        className={`flex-1 ${index < strength.score ? strength.color : 'bg-transparent'} transition-all duration-300`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Confirm Password</label>
              <div className="relative">
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 bg-black/20 border ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-[#2563EB] focus:ring-[#2563EB]'} rounded-xl shadow-inner placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors text-white sm:text-sm`}
                  placeholder="••••••••"
                />
                {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                   <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-[#10B981]" />
                )}
                {errors.confirmPassword && <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />}
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] focus:ring-[#2563EB] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
              By joining, you agree to our <Link to="/terms" className="text-[#2563EB] hover:text-blue-400">Terms of Service</Link> and <Link to="/privacy" className="text-[#2563EB] hover:text-blue-400">Privacy Policy</Link>
            </p>
          </form>
          
          <div className="mt-6 relative z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-transparent text-slate-400 font-medium relative z-10 before:absolute before:-z-10 before:inset-0 before:bg-[#111827] before:rounded-full">Or</span>
            </div>
          </div>
          
          <div className="mt-6 relative z-10">
            <button onClick={handleGoogleLogin} className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-bold text-white hover:bg-white/10 transition-all shadow-sm">
              <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
              Sign up with Google
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#10B981] hover:text-emerald-400 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
