// Demo mode is for local/client preview only. Keep disabled in production.
// Enable by setting VITE_DEMO_MODE=true in .env.local

const isDemoEnabled = (): boolean => {
  return import.meta.env.VITE_DEMO_MODE === 'true';
};

const isSimpleEmailLoginEnabled = (): boolean => {
  return import.meta.env.VITE_SIMPLE_EMAIL_LOGIN === 'true';
};

export const DEMO_MODE = isDemoEnabled();
export const SIMPLE_EMAIL_LOGIN = isSimpleEmailLoginEnabled();

// localStorage keys
const DEMO_USER_KEY = 'demoUser';
const DEMO_ROLE_KEY = 'demoRole';
const DEMO_ACTIVE_KEY = 'demoModeActive';
const DEMO_EMAIL_KEY = 'demoEmail';

export interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isDemo: true;
}

// ---- Simple Email Login ----

const ADMIN_EMAILS = new Set([
  'demo.admin@gmail.com',
  'admin@gmail.com',
  'demo.admin@mathemzi.edu',
]);

const STUDENT_EMAILS = new Set([
  'demo.student@gmail.com',
  'student@gmail.com',
  'demo.student@mathemzi.edu',
]);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

export function isStudentEmail(email: string): boolean {
  return STUDENT_EMAILS.has(email.toLowerCase().trim());
}

export function loginWithSimpleEmail(email: string): void {
  const normalized = email.toLowerCase().trim();
  const isAdmin = isAdminEmail(normalized);
  const role = isAdmin ? 'admin' : 'student';
  const name = isAdmin ? 'Demo Admin' : (normalized.split('@')[0] || 'Demo Student');

  const user: DemoUser = {
    uid: isAdmin ? 'demo-admin-user' : `demo-${normalized.replace(/[^a-z0-9]/g, '-')}`,
    email: normalized,
    displayName: name,
    photoURL: null,
    isDemo: true,
  };

  startDemoSession(user, role);
}

// ---- Existing Demo Login (button-based) ----

export const DEMO_STUDENT: DemoUser = {
  uid: 'demo-student-user',
  email: 'demo.student@mathemzi.edu',
  displayName: 'Demo Student',
  photoURL: null,
  isDemo: true,
};

export const DEMO_ADMIN: DemoUser = {
  uid: 'demo-admin-user',
  email: 'demo.admin@mathemzi.edu',
  displayName: 'Demo Admin',
  photoURL: null,
  isDemo: true,
};

export const DEMO_STUDENT_PASSWORD = 'Demo@123';
export const DEMO_ADMIN_PASSWORD = 'Admin@123';

// ---- Session management ----

export function isDemoSessionActive(): boolean {
  if (!DEMO_MODE && !SIMPLE_EMAIL_LOGIN) return false;
  return localStorage.getItem(DEMO_ACTIVE_KEY) === 'true';
}

export function getDemoUser(): DemoUser | null {
  if (!DEMO_MODE) return null;
  const raw = localStorage.getItem(DEMO_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export function getDemoRole(): string | null {
  if (!DEMO_MODE) return null;
  return localStorage.getItem(DEMO_ROLE_KEY);
}

export function startDemoSession(user: DemoUser, role: 'student' | 'admin'): void {
  localStorage.setItem(DEMO_ACTIVE_KEY, 'true');
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  localStorage.setItem(DEMO_ROLE_KEY, role);
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_ACTIVE_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem(DEMO_ROLE_KEY);
}

// ---- LocalStorage demo data fallbacks ----
// Used when Firestore writes fail in demo mode

type DemoRecord = Record<string, unknown> & { id?: string };

export function getDemoLocalData(key: string): any[] {
  try {
    const raw = localStorage.getItem(`demo_${key}`);
    return raw ? (JSON.parse(raw) as any[]) : [];
  } catch {
    return [];
  }
}

export function addDemoLocalData(key: string, item: DemoRecord): any {
  const items = getDemoLocalData(key);
  const saved = { ...item, id: item.id || `demo_${Date.now()}` };
  items.push(saved);
  localStorage.setItem(`demo_${key}`, JSON.stringify(items));
  return saved;
}

export function updateDemoLocalData(key: string, id: string, updates: Record<string, unknown>): any | null {
  const items = getDemoLocalData(key);
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  localStorage.setItem(`demo_${key}`, JSON.stringify(items));
  return items[idx];
}

// Check if Firestore write error is "permission denied" (demo fallback trigger)
export function isPermissionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions');
}
