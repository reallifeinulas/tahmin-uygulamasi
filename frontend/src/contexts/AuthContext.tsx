import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI, getToken } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Backend'den gelen user verisini frontend formatına çevir
const transformUserData = (backendUser: any): User => {
  return {
    id: backendUser.id.toString(),
    email: backendUser.email,
    name: backendUser.username,
    isAdmin: backendUser.role === 'admin',
    score: backendUser.points || 0,
    createdAt: new Date(backendUser.created_at || backendUser.createdAt)
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      console.log('🔍 Login Response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Login Success - User Data:', response.data.user);
        
        const userData = transformUserData(response.data.user);
        setUser(userData);
        return userData;
      } else {
        console.error('❌ Login Failed:', response.error);
        throw new Error(response.error || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('💥 Login Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const response = await authAPI.register({ 
        username: name, 
        email, 
        password 
      });
      
      console.log('🔍 Register Response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Register Success - User Data:', response.data.user);
        
        const userData = transformUserData(response.data.user);
        setUser(userData);
        return userData;
      } else {
        console.error('❌ Register Failed:', response.error);
        // Backend validation hatalarını handle et
        if (response.errors && Array.isArray(response.errors)) {
          throw new Error(response.errors.join('\n'));
        } else {
          throw new Error(response.error || 'Kayıt başarısız');
        }
      }
    } catch (error) {
      console.error('💥 Register Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const loadUserProfile = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        const userData = transformUserData(response.data);
        setUser(userData);
      } else {
        // Token geçersizse temizle
        authAPI.logout();
      }
    } catch (error) {
      console.error('Profile load error:', error);
      authAPI.logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 