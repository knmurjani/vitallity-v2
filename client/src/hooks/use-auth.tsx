import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: number;
  email: string;
  onboardingCompleted: boolean | null;
  onboardingStep: number | null;
  name?: string | null;
  tourCompleted?: boolean | null;
  telegramLinked?: boolean | null;
  googleSheetsConnected?: boolean | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// In-memory token storage (no localStorage per architecture rules)
let memoryToken: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(memoryToken);
  const [loading, setLoading] = useState(true);

  const setAuth = useCallback((t: string | null, u: AuthUser | null) => {
    memoryToken = t;
    setToken(t);
    setUser(u);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!memoryToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${memoryToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser({
          ...data.user,
          name: data.profile?.name,
        });
      } else {
        setAuth(null, null);
      }
    } catch {
      setAuth(null, null);
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    setAuth(data.token, data.user);
  }, [setAuth]);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/signup", { email, password });
    const data = await res.json();
    setAuth(data.token, data.user);
  }, [setAuth]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await apiRequest("POST", "/api/auth/google", { credential });
    const data = await res.json();
    setAuth(data.token, data.user);
  }, [setAuth]);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    await apiRequest("POST", "/api/auth/phone/send-otp", { phone });
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, otp: string) => {
    const res = await apiRequest("POST", "/api/auth/phone/verify-otp", { phone, otp });
    const data = await res.json();
    setAuth(data.token, data.user);
  }, [setAuth]);

  const logout = useCallback(() => {
    setAuth(null, null);
  }, [setAuth]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Helper for authenticated API calls
export function useAuthFetch() {
  return useCallback(async (method: string, url: string, data?: unknown) => {
    const headers: Record<string, string> = {};
    if (memoryToken) headers["Authorization"] = `Bearer ${memoryToken}`;
    if (data) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res;
  }, []);
}
