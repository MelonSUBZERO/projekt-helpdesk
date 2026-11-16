"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getPocketbaseErrorMessage, hasPocketbaseConfig, pb } from "@/lib/pocketbase";
import type { AuthUser } from "@/lib/pocketbase";

type Role = "uzytkownik" | "technik";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUser = useCallback(() => {
    setUser((pb.authStore.model as AuthUser | null) ?? null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!hasPocketbaseConfig) {
      setUser(null);
      setIsLoading(false);
      return false;
    }

    try {
      await pb.collection("users").authRefresh();
      syncUser();
      return true;
    } catch {
      pb.authStore.clear();
      syncUser();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncUser]);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      syncUser();
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession();

    return unsubscribe;
  }, [refreshSession, syncUser]);

  const role = useMemo<Role | null>(() => {
    const rawRole = user?.rola ?? user?.role ?? "uzytkownik";

    if (rawRole === "technik") {
      return "technik";
    }

    if (rawRole === "uzytkownik" || !rawRole) {
      return "uzytkownik";
    }

    return null;
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    if (!hasPocketbaseConfig) {
      throw new Error("Brak zmiennej środowiskowej NEXT_PUBLIC_POCKETBASE_URL.");
    }

    setIsLoading(true);

    try {
      await pb.collection("users").authWithPassword(email.trim(), password);
      syncUser();
    } catch (error) {
      throw new Error(mapLoginError(error));
    } finally {
      setIsLoading(false);
    }
  }, [syncUser]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    if (!hasPocketbaseConfig) {
      throw new Error("Brak zmiennej środowiskowej NEXT_PUBLIC_POCKETBASE_URL.");
    }

    setIsLoading(true);

    try {
      await pb.collection("users").create({
        email: email.trim(),
        password,
        passwordConfirm: password,
        name: name.trim(),
      });

      await pb.collection("users").authWithPassword(email.trim(), password);
      syncUser();
    } catch (error) {
      throw new Error(mapLoginError(error));
    } finally {
      setIsLoading(false);
    }
  }, [syncUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      pb.authStore.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      role,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, isLoading, role, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

function mapLoginError(error: unknown) {
  const message = getPocketbaseErrorMessage(error);
  const lower = message.toLowerCase();

  if (lower.includes("failed to fetch")) {
    return "Nie można połączyć się z PocketBase. Sprawdź adres NEXT_PUBLIC_POCKETBASE_URL.";
  }

  if (lower.includes("failed to authenticate")) {
    return "Nieprawidłowy adres e-mail lub hasło.";
  }

  if (lower.includes("invalid email") || lower.includes("email")) {
    return "Nieprawidłowy adres e-mail.";
  }

  if (lower.includes("password") || lower.includes("hasło")) {
    return "Nieprawidłowe hasło.";
  }

  if (lower.includes("already exists") || lower.includes("już istnieje")) {
    return "Użytkownik z tym adresem e-mail już istnieje.";
  }

  if (lower.includes("length") && lower.includes("password")) {
    return "Hasło musi mieć co najmniej 8 znaków.";
  }

  return message;
}
