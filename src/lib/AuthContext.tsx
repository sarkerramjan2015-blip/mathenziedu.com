import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEMO_MODE, SIMPLE_EMAIL_LOGIN, isDemoSessionActive, getDemoUser, getDemoRole } from './demo';

const INITIAL_ADMIN_EMAIL = import.meta.env.VITE_INITIAL_ADMIN_EMAIL || 'sarkerramjan2015@gmail.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  isDemo: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for demo/simple email session first
    if ((DEMO_MODE || SIMPLE_EMAIL_LOGIN) && isDemoSessionActive()) {
      const demoUser = getDemoUser();
      const demoRole = getDemoRole();
      if (demoUser) {
        // Create a mock Firebase User object
        const mockUser = {
          uid: demoUser.uid,
          email: demoUser.email,
          displayName: demoUser.displayName,
          photoURL: demoUser.photoURL,
          emailVerified: true,
          isAnonymous: false,
          providerId: 'demo',
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => '',
          getIdTokenResult: async () => ({} as any),
          reload: async () => {},
          toJSON: () => ({}),
        } as unknown as User;

        setUser(mockUser);
        setUserRole(demoRole);
        setIsDemo(true);
        setLoading(false);
        return;
      }
    }

    // Normal Firebase auth flow
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userEmail = firebaseUser.email || '';
        const isInitialAdmin = firebaseUser.emailVerified && userEmail === INITIAL_ADMIN_EMAIL;
        const defaultRole = isInitialAdmin ? 'admin' : 'student';
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              userId: firebaseUser.uid,
              displayName: firebaseUser.displayName || '',
              email: userEmail,
              role: defaultRole,
            });
            setUserRole(defaultRole);
          } else {
            const firestoreRole = userDoc.data()?.role;
            const finalRole = isInitialAdmin ? 'admin' : (typeof firestoreRole === 'string' && firestoreRole ? firestoreRole : 'student');
            if (isInitialAdmin && firestoreRole !== 'admin') {
              await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' }, { merge: true });
            }
            setUserRole(finalRole);
          }
        } catch (error) {
          console.error("Error setting up user doc", error);
          // Fallback: still set role if admin email
          setUserRole(defaultRole);
        }
      } else {
        setUserRole(null);
      }
      setIsDemo(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
};
