import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// Module-level token storage -- no localStorage/sessionStorage
let adminTokenMemory: string | null = null;

interface AdminAuthContextType {
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(adminTokenMemory);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Invalid credentials");
    }
    const data = await res.json();
    adminTokenMemory = data.token;
    setAdminToken(data.token);
  }, []);

  const adminLogout = useCallback(() => {
    adminTokenMemory = null;
    setAdminToken(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        isAdminAuthenticated: !!adminToken,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

// Helper for authenticated admin API calls
export async function adminApiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (adminTokenMemory) {
    headers["Authorization"] = `Bearer ${adminTokenMemory}`;
  }
  if (options?.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }

  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res as unknown as T;
}
