import axios from 'axios';

// Set up axios defaults
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const removeAuthToken = () => {
  delete axios.defaults.headers.common['Authorization'];
};

export const getTokenFromStorage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setTokenInStorage = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeTokenFromStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getUserRole = (user) => {
  if (!user) return null;
  return user.userType;
};

export const isAdmin = (user) => {
  return user && user.userType === 'admin';
};

export const isPassenger = (user) => {
  return user && user.userType === 'passenger';
};
