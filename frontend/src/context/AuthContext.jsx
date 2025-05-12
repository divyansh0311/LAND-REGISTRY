import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["x-auth-token"] = token;
      // Verify token and get user data
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/auth/me");
      setUser(res.data);
      setLoading(false);
    } catch (err) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["x-auth-token"];
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common["x-auth-token"] = res.data.token;
      setUser(res.data.user);
      setError("");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post(
        "http://localhost:5001/api/auth/register",
        userData
      );
      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common["x-auth-token"] = res.data.token;
      setUser(res.data.user);
      setError("");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["x-auth-token"];
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
