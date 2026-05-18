import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("debatesphere_token");
    const storedUser = localStorage.getItem("debatesphere_user");
    
    if (storedToken && storedUser) {
      try {
        setTokenState(storedToken);
        setUserState(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("debatesphere_token"));
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("debatesphere_token", newToken);
    localStorage.setItem("debatesphere_user", JSON.stringify(newUser));
    setTokenState(newToken);
    setUserState(newUser);
  };

  const logout = () => {
    localStorage.removeItem("debatesphere_token");
    localStorage.removeItem("debatesphere_user");
    setTokenState(null);
    setUserState(null);
  };

  if (!isLoaded) {
    return null; // Or a full screen loader
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        setUser: setUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
