import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const readStoredValue = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const payload = token.split('.')[1];
    if (!payload) return false;

    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decodedPayload.exp === 'number' && decodedPayload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const storedToken = readStoredValue('token');
    if (isTokenValid(storedToken)) return storedToken;

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // Storage may be unavailable; protected routes still treat the session as signed out.
    }
    return null;
  });
  const [user, setUser] = useState(() => {
    try {
      if (!token) return null;
      const savedUser = readStoredValue('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false);

  const login = (authResponse) => {
    const { token: authToken, ...userInfo } = authResponse;
    try {
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userInfo));
    } catch {
      // Ignore storage errors and continue with in-memory auth state.
    }
    setToken(authToken);
    setUser(userInfo);
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // Ignore storage errors while clearing auth state.
    }
    setToken(null);
    setUser(null);
  };

  const updateUser = (userUpdates) => {
    setUser((currentUser) => {
      const nextUser = { ...currentUser, ...userUpdates };
      try {
        localStorage.setItem('user', JSON.stringify(nextUser));
      } catch {
        // Keep the in-memory profile update even if storage is unavailable.
      }
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
