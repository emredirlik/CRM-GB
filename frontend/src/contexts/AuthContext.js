import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = not auth, object = authenticated
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Check localStorage for token
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/check`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      if (response.data.authenticated) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('token');
        setUser(false);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, 
        { username, password },
        { withCredentials: true }
      );
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      setUser(response.data);
      return { success: true };
    } catch (error) {
      const detail = error.response?.data?.detail;
      let message = 'Giriş başarısız';
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map(e => e.msg || JSON.stringify(e)).join(' ');
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
