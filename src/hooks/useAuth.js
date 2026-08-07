import { useState, useEffect } from 'react';
import { dbService } from '../db/todoDatabase';

export default function useAuth(addToast, addNotification) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const checkAuth = async () => {
    try {
      const response = await dbService.me();
      if (response && response.user) {
        setUser(response.user);
      }
    } catch (err) {
      // User is not authenticated, ignore
    } finally {
      setAuthReady(true);
    }
  };

  const handleAuthSubmit = async (mode, payload, fetchTasks, fetchCategories) => {
    try {
      const response = mode === 'signup'
        ? await dbService.register({ name: payload.fullName, email: payload.email, password: payload.password })
        : await dbService.login({ email: payload.email, password: payload.password, rememberMe: payload.rememberMe });

      setUser(response.user);
      if (mode === 'signup') {
        addToast('Account Created', `Welcome to TaskSphere, ${response.user.name || 'User'}!`, 'success');
      } else {
        addToast('Welcome Back', `Logged in as ${response.user.name || response.user.email}`, 'success');
      }
      addNotification(mode === 'signup' ? `🎉 Welcome to TaskSphere, ${response.user.name}!` : `👋 Welcome back, ${response.user.name}!`);

      await Promise.all([
        fetchTasks(response.user),
        fetchCategories(response.user)
      ]);

      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = async (clearState) => {
    try {
      await dbService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      clearState();
      addToast('Logged Out', 'You have been logged out of your session successfully.', 'info');
    }
  };

  // Load session on startup
  useEffect(() => {
    checkAuth();
  }, []);

  return { user, authReady, setUser, handleAuthSubmit, handleLogout };
}
