import { LEGACY_ADMIN_EMAILS } from './config';

const INITIAL_ADMIN_EMAIL = import.meta.env.VITE_INITIAL_ADMIN_EMAIL || 'sarkerramjan2015@gmail.com';

/**
 * Check if a user has admin role (Firestore-based).
 * Falls back to initial admin email and legacy email check.
 */
export function isAdminUser(role: string | null | undefined, email?: string | null): boolean {
  // Primary: Firestore role check
  if (role === 'admin') return true;
  
  // Bootstrap: initial admin email (auto-promoted by AuthContext)
  if (email === INITIAL_ADMIN_EMAIL) return true;
  
  // Fallback: legacy hardcoded email (for migration period)
  if (email && LEGACY_ADMIN_EMAILS.has(email)) return true;
  
  return false;
}

/**
 * Legacy check — kept for backward compatibility.
 * Prefer isAdminUser(role, email) instead.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email === INITIAL_ADMIN_EMAIL || LEGACY_ADMIN_EMAILS.has(email);
}
