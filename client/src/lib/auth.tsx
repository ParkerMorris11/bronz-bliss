import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./queryClient";

interface AuthState {
  authenticated: boolean | null; // null = loading
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  authenticated: null,
  login: async () => ({ ok: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check session on mount
    apiRequest("GET", "/api/auth/me")
      .then(r => r.json())
      .then(d => setAuthenticated(!!d.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  async function login(password: string) {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { password });
      if (res.ok) {
        setAuthenticated(true);
        return { ok: true };
      }
      const data = await res.json();
      return { ok: false, error: data.error ?? "Login failed" };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }

  async function logout() {
    await apiRequest("POST", "/api/auth/logout");
    setAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
