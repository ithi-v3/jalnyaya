// JalNyaya - Authentication Context & Custom Hook
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('jalnyaya_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('jalnyaya_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
          localStorage.setItem('jalnyaya_user', JSON.stringify(res.user));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('jalnyaya_token', res.token);
    localStorage.setItem('jalnyaya_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('jalnyaya_token');
    localStorage.removeItem('jalnyaya_user');
    setToken(null);
    setUser(null);
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isOperator = role === 'OPERATOR';
  const isResident = role === 'RESIDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role,
        isAdmin,
        isOperator,
        isResident,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
