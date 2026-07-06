import { LEGACY_ADMIN_EMAILS } from './config';

/**
 * Check if a user has admin role (Firestore-based).
 * Falls back to legacy email check if no role is set.
 */
export function isAdminUser(role: string | null | undefined, email?: string | null): boolean {
  // Primary: Firestore role check
  if (role === 'admin') return true;
  
  // Fallback: legacy hardcoded email (for migration period)
  if (email && LEGACY_ADMIN_EMAILS.has(email)) return true;
  
  return false;
}

/**
 * Legacy check — kept for backward compatibility.
 * Prefer isAdminUser(role, email) instead.
 */
export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && LEGACY_ADMIN_EMAILS.has(email));
}
