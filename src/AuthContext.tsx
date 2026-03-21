import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchMe } from "./api";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
