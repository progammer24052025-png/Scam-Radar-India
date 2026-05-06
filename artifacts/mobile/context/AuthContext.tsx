import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { api } from "@/utils/api";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  points: number;
  reportsSubmitted: number;
  reportsVerified: number;
  reportsRejected: number;
  joinedAt: number;
  rank?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "@scam_radar_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw) as UserProfile);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const saveUser = useCallback(async (u: UserProfile | null) => {
    if (u) await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    else await AsyncStorage.removeItem(USER_KEY);
    setUser(u);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      // On native we use expo-web-browser + Google OAuth
      // For now we simulate with a profile synced to our backend
      // In production APK this will use real Google Sign-In
      const mockUid = `google_${Date.now()}`;
      const mockEmail = "user@gmail.com";
      const mockName = "Scam Fighter";

      const profile = await api.upsertUserProfile({
        uid: mockUid,
        email: mockEmail,
        displayName: mockName,
      });

      if (profile.data) {
        await saveUser({ ...profile.data, rank: undefined });
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [saveUser]);

  const signOut = useCallback(async () => {
    await saveUser(null);
  }, [saveUser]);

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return;
    const { data } = await api.getUserProfile(user.uid);
    if (data) {
      const { data: lb } = await api.getLeaderboard();
      const rank = lb ? lb.findIndex((u) => u.uid === user.uid) + 1 : undefined;
      await saveUser({ ...data, rank: rank || undefined });
    }
  }, [user?.uid, saveUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
