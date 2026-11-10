import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('classconnect_user') || localStorage.getItem('sectionspace_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => {
        return localStorage.getItem('classconnect_token') || localStorage.getItem('sectionspace_token');
    });
    const [loading, setLoading] = useState(true);
    const refreshUser = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/auth/me');
            if (res.data.success && res.data.user) {
                setUser(res.data.user);
                localStorage.setItem('classconnect_user', JSON.stringify(res.data.user));
            }
        }
        catch {
            // Token might be invalid or expired
            setUser(null);
            setToken(null);
            localStorage.removeItem('classconnect_token');
            localStorage.removeItem('classconnect_user');
            localStorage.removeItem('sectionspace_token');
            localStorage.removeItem('sectionspace_user');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        refreshUser();
    }, [token]);
    const login = async (loginId, password) => {
        const res = await api.post('/auth/login', { loginId, password });
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('classconnect_token', newToken);
        localStorage.setItem('classconnect_user', JSON.stringify(newUser));
        return newUser;
    };
    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('classconnect_token', newToken);
        localStorage.setItem('classconnect_user', JSON.stringify(newUser));
        return newUser;
    };
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('classconnect_token');
        localStorage.removeItem('classconnect_user');
        localStorage.removeItem('sectionspace_token');
        localStorage.removeItem('sectionspace_user');
    };
    const updateUser = (updated) => {
        if (user) {
            const merged = { ...user, ...updated };
            setUser(merged);
            localStorage.setItem('classconnect_user', JSON.stringify(merged));
        }
    };
    const isAuthenticated = !!token && !!user;
    const isApproved = user?.role === 'admin' || user?.status === 'approved';
    const isPending = user?.status === 'pending';
    const isAdmin = user?.role === 'admin';
    return (<AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            register,
            logout,
            refreshUser,
            updateUser,
            isAuthenticated,
            isApproved,
            isPending,
            isAdmin,
        }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
