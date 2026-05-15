// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../config/firebase';
import { setCurrentUserId, clearLocalOnly } from '../utils/storage';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    (currentUser) => {
      setCurrentUserId(currentUser?.uid || null); // ← ya lo tienes, verifica que esté
      setUser(currentUser);
      setLoading(false);
    },
    (err) => {
      setError(err.message);
      setLoading(false);
    }
  );
  return () => unsubscribe();
}, []);

  const register = useCallback(async (email, password, displayName) => {
  try {
    setError(null);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    setCurrentUserId(userCredential.user.uid);                    // ← establecer UID real
    setUser(userCredential.user);
    return userCredential.user;
  } catch (err) {
    setError(err.message);
    throw err;
  }
}, []);

  // AuthContext.js — función login
const login = useCallback(async (email, password) => {
  try {
    setError(null);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setCurrentUserId(userCredential.user.uid); // ← UID primero
    await clearLocalOnly();                    // ← solo limpia AsyncStorage
    setUser(userCredential.user);
    return userCredential.user;
  } catch (err) {
    setError(err.message);
    throw err;
  }
}, []);

  const logout = useCallback(async () => {
  try {
    setError(null);
    await signOut(auth);
    await clearAll();                  // ← limpiar AsyncStorage
    setCurrentUserId(null);           // ← limpiar UID global
    setUser(null);
  } catch (err) {
    setError(err.message);
    throw err;
  }
}, []);

  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    resetPassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}

