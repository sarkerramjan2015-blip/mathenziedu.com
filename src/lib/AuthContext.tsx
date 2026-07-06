import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEMO_MODE, isDemoSessionActive, getDemoUser, getDemoRole } from './demo';

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
    // Check for demo session first
    if (DEMO_MODE && isDemoSessionActive()) {
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
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              userId: firebaseUser.uid,
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: 'student',
            });
            setUserRole('student');
          } else {
            setUserRole(userDoc.data()?.role || 'student');
          }
        } catch (error) {
          console.error("Error setting up user doc", error);
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
