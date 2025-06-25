'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { User } from '../types/db';
import { UserService } from '../services/userService';

interface AuthContextType {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  updateProfile: (profile: User) => Promise<void>;
  profile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signIn, setSignIn] = useState<() => Promise<void>>(() => Promise.resolve());
  const [signInWithGoogle, setSignInWithGoogle] = useState<() => Promise<void>>(() => Promise.resolve());
  const [signUp, setSignUp] = useState<() => Promise<void>>(() => Promise.resolve());
  const [updateProfile, setUpdateProfile] = useState<() => Promise<void>>(() => Promise.resolve());

  // TODO: Implement these functions
  console.log(setSignIn, setSignInWithGoogle, setSignUp, setUpdateProfile);
  const fetchProfile = async (userId: string) => {
    try {
      const userProfile = await UserService.getUser(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    updateProfile,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
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