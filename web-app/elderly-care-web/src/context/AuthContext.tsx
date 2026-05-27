import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isGoogle?: boolean;
}

interface LoginResponse {
  userId: string;
  name: string;
  email: string;
  role: string;
  token: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  managedElderly: Partial<User> | null;
  login: (data: LoginResponse, isGoogle?: boolean) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setManagedElderly: (elderly: Partial<User> | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [managedElderly, setManagedElderlyState] = useState<Partial<User> | null>(null);

  // 🔑 Load from localStorage khi refresh
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedElderly = localStorage.getItem("managedElderly");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedElderly) {
          setManagedElderlyState(JSON.parse(storedElderly));
        }
      } catch {
        localStorage.clear();
      }
    }
    setIsInitialized(true);
  }, []);

  const setManagedElderly = (elderly: Partial<User> | null) => {
    setManagedElderlyState(elderly);
    if (elderly) {
      localStorage.setItem("managedElderly", JSON.stringify(elderly));
    } else {
      localStorage.removeItem("managedElderly");
    }
  };

  const login = (data: LoginResponse, isGoogle?: boolean) => {
    const userData: User = {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatarUrl,
      isGoogle: isGoogle || false,
    };

    setUser(userData);
    setToken(data.token);
    
    // Clear managedElderly when logging in
    setManagedElderlyState(null);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.removeItem("managedElderly"); // Clear old managed elderly data
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setManagedElderlyState(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, isInitialized, managedElderly, login, logout, updateUser, setManagedElderly }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
