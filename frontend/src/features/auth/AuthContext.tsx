import React, { createContext, useContext, useState, useEffect } from 'react';
import { request, setAccessToken } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, passwordPlain: string) => Promise<boolean>;
  register: (email: string, username: string, passwordPlain: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const initializeAuth = async () => {
    try {
      // Silently request fresh access token on mount
      const res = await request('/auth/refresh', { method: 'POST' });
      if (res.success && res.data?.accessToken) {
        const token = res.data.accessToken;
        setAccessToken(token);
        const decoded = parseJwt(token);
        
        // Let's mock the username and email from details or just store decoded.
        // In a real app we might fetch user profile. Here, we can populate user from decoded token payload.
        // Let's store user info. Since jwt contains userId and role, we'll store basic details.
        // For username/email, we can also extract them or fetch profile.
        // Since we want full profile info, let's fetch user profile, or simply set basic user details.
        // Let's decode userId and role from JWT, and since we need username, let's fetch profile!
        // Wait, do we have a user profile endpoint? We don't have a specific /users/me endpoint in the tasks,
        // but we can decode the token or we can just decode user profile.
        // Wait! Let's check: can we just store the decoded payload?
        // Let's store user info. Since jwt payload has userId and role, let's also pass username/email if we include it in the token.
        // Ah! In backend `tokens.ts`, we signed: `generateAccessToken({ userId: user.id, role: user.role })`.
        // If we modify backend `tokens.ts` to sign: `generateAccessToken({ userId: user.id, role: user.role, username: user.username, email: user.email })`,
        // then the frontend can extract EVERYTHING from the JWT! That is extremely neat, requires zero extra database hits,
        // and aligns perfectly with stateless JWT principles.
        // Let's do that! Let's check tokens.ts. We signed `{ userId: user.id, role: user.role }`.
        // If we expand the payload to include `username` and `email`, the token holds all session state.
        // Let's make this adjustment in backend src/utils/tokens.ts. That is a brilliant design decision.
        
        setUser({
          id: decoded.userId,
          email: decoded.email || '',
          username: decoded.username || '',
          role: decoded.role,
        });
      }
    } catch (err) {
      // Guest user session
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();

    // Listen to silent logout events (e.g. refresh failed)
    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      toast('Session expired. Please log in again.', 'error');
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, [toast]);

  const login = async (emailOrUsername: string, passwordPlain: string): Promise<boolean> => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password: passwordPlain }),
    });

    if (res.success && res.data) {
      const { accessToken, user } = res.data;
      setAccessToken(accessToken);
      setUser(user);
      toast(`Welcome back, ${user.username}!`, 'success');
      return true;
    } else {
      toast(res.error?.message || 'Login failed', 'error');
      return false;
    }
  };

  const register = async (email: string, username: string, passwordPlain: string): Promise<boolean> => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password: passwordPlain }),
    });

    if (res.success) {
      toast('Registration successful! Please log in.', 'success');
      return true;
    } else {
      toast(res.error?.message || 'Registration failed', 'error');
      return false;
    }
  };

  const logout = async () => {
    await request('/auth/logout', { method: 'POST' });
    setAccessToken(null);
    setUser(null);
    toast('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
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
