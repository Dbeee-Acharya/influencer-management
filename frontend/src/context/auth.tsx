import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type StaffRole = "admin" | "editor" | "viewer";

export interface StaffPayload {
  sub: string;
  email: string;
  name: string;
  role: StaffRole;
  exp: number;
}

interface AuthState {
  token: string | null;
  staff: StaffPayload | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  canEdit: boolean;
  canCreate: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseToken(token: string): StaffPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload)) as StaffPayload;
  } catch {
    return null;
  }
}

function getInitialState(): AuthState {
  const token = localStorage.getItem("token");
  if (!token) return { token: null, staff: null };

  const staff = parseToken(token);
  // Check expiry
  if (!staff || staff.exp * 1000 < Date.now()) {
    localStorage.removeItem("token");
    return { token: null, staff: null };
  }

  return { token, staff };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialState);

  const login = useCallback((token: string) => {
    const staff = parseToken(token);
    if (!staff) return;
    localStorage.setItem("token", token);
    setState({ token, staff });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setState({ token: null, staff: null });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    isAuthenticated: !!state.staff,
    canEdit: state.staff?.role === "admin" || state.staff?.role === "editor",
    canCreate: state.staff?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
