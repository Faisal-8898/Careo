'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import { authApi } from '../services/api';
import { setAuthToken, removeAuthToken } from '../utils/auth';
import Cookies from 'js-cookie';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load token from cookies on mount
  useEffect(() => {
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthToken(token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials, userType = 'passenger') => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const endpoint = userType === 'admin' ? 'admin/login' : 'passenger/login';
      const response = await authApi.post(endpoint, credentials);
      
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        const user = { ...userData, userType };
        
        // Store in cookies
        Cookies.set('token', token, { expires: 1 }); // 1 day
        Cookies.set('user', JSON.stringify(user), { expires: 1 });
        
        setAuthToken(token);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        
        return { success: true, user };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authApi.post('passenger/register', userData);
      
      if (response.data.success) {
        const { token, ...userInfo } = response.data.data;
        const user = { ...userInfo, userType: 'passenger' };
        
        // Store in cookies
        Cookies.set('token', token, { expires: 1 });
        Cookies.set('user', JSON.stringify(user), { expires: 1 });
        
        setAuthToken(token);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        
        return { success: true, user };
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_ERROR',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authApi.put('profile', profileData);
      
      if (response.data.success) {
        // Update user data in state and cookies
        const updatedUser = { ...state.user, ...profileData };
        Cookies.set('user', JSON.stringify(updatedUser), { expires: 1 });
        
        dispatch({
          type: 'UPDATE_USER',
          payload: profileData,
        });
        
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authApi.post('change-password', passwordData);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.error || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
