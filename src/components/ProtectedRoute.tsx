import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { isAdminUser } from '../lib/admin';
import { DEMO_MODE, SIMPLE_EMAIL_LOGIN, isDemoSessionActive, getDemoRole } from '../lib/demo';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

function RouteLoader() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center" role="status" aria-label="Checking access">
      <div className="h-12 w-12 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin" aria-hidden="true" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0F172A] text-white">
      <div className="max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-300" />
        <h1 className="mb-3 text-2xl font-bold">Access restricted</h1>
        <p className="text-sm leading-relaxed text-slate-300">
          This area is reserved for Mathenzi Edu administrators. Please sign in with an approved admin account.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/dashboard" className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
            Student dashboard
          </Link>
          <Link to="/" className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  // Demo / Simple Email Login check — runs alongside Firebase auth
  const demoActive = (DEMO_MODE || SIMPLE_EMAIL_LOGIN) && isDemoSessionActive();

  if (loading && !demoActive) return <RouteLoader />;

  // Demo mode: skip Firebase auth requirement
  if (demoActive) {
    const demoRole = getDemoRole();
    if (adminOnly && demoRole !== 'admin') {
      return <AccessDenied />;
    }
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdminUser(userRole, user.email, user.emailVerified)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
