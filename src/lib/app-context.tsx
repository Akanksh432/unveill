import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AlertItem } from "@/lib/sample-data";

export type Role = "officer" | "forensic analyst" | "customer" | "security";

interface AppState {
  // Auth
  isAuthenticated: boolean;
  role: Role;
  login: (r: Role) => void;
  logout: () => void;
  // UI
  search: string;
  setSearch: (s: string) => void;
  activeAlert: AlertItem | null;
  openAlert: (a: AlertItem) => void;
  closeAlert: () => void;
  activeDocId: string | null;
  openDoc: (id: string) => void;
  closeDoc: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>("officer");
  const [search, setSearch] = useState("");
  const [activeAlert, setActiveAlert] = useState<AlertItem | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const login = useCallback((r: Role) => {
    setRole(r);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setRole("officer");
  }, []);

  const openAlert = useCallback((a: AlertItem) => setActiveAlert(a), []);
  const closeAlert = useCallback(() => setActiveAlert(null), []);
  const openDoc = useCallback((id: string) => setActiveDocId(id), []);
  const closeDoc = useCallback(() => setActiveDocId(null), []);

  const value = useMemo<AppState>(
    () => ({
      isAuthenticated,
      role,
      login,
      logout,
      search,
      setSearch,
      activeAlert,
      openAlert,
      closeAlert,
      activeDocId,
      openDoc,
      closeDoc,
    }),
    [isAuthenticated, role, login, logout, search, activeAlert, activeDocId, openAlert, closeAlert, openDoc, closeDoc],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function matchesSearch(query: string, ...fields: (string | number | undefined | null)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
}
