import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, FirebaseUser } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, Loader2, Brain } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error('Sign-in failed. Please check your connection or project state.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.info('Signed out');
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function LoginScreen() {
  const { login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await login();
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass rounded-[40px] p-12 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-google-blue/20">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Nexus AI</h1>
        <p className="text-gray-400 mb-10 leading-relaxed">
          Welcome to the unified developer dashboard. Please sign in with your Google account to access your workspace.
        </p>
        
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full h-14 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-4 hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoggingIn ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <LogIn className="w-6 h-6" />
              Sign in with Google
            </>
          )}
        </button>

        <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          Secure Neural Enterprise Access
        </p>
      </motion.div>
    </div>
  );
}
