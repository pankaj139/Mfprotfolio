import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface AuthUser {
  user_id: number;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "mf_auth_token";
const USER_KEY = "mf_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Keep axios default header in sync with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const _persist = (tok: string, u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(tok);
    setUser(u);
    axios.defaults.headers.common["Authorization"] = `Bearer ${tok}`;
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("username", email);
      form.append("password", password);
      const { data } = await axios.post("/api/auth/login", form);
      _persist(data.access_token, { user_id: data.user_id, email: data.email, full_name: data.full_name });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, fullName: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post("/api/auth/register", { email, full_name: fullName, password });
      _persist(data.access_token, { user_id: data.user_id, email: data.email, full_name: data.full_name });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
