import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem("token", token);
    } else {
      setAuthToken(null);
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        setAuthToken(token);
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        setToken("");
        setUser(null);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const signup = async (formData) => {
    const response = await api.post("/auth/signup", formData);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const login = async (formData) => {
    const response = await api.post("/auth/login", formData);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      signup,
      login,
      logout,
      isAuthenticated: !!token,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
