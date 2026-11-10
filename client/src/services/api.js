import axios from 'axios';
// Dynamic API and Server URLs supporting development and production deployments
export const SERVER_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? window.location.origin
        : 'http://localhost:5000');

export const API_BASE_URL = `${SERVER_URL}/api`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Request interceptor to attach JWT auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('classconnect_token') || localStorage.getItem('sectionspace_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
// Response interceptor to catch token expiration and network errors
api.interceptors.response.use((response) => response, (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
        // Don't auto-redirect if already on auth routes
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
            localStorage.removeItem('classconnect_token');
            localStorage.removeItem('classconnect_user');
            localStorage.removeItem('sectionspace_token');
            localStorage.removeItem('sectionspace_user');
            window.location.href = '/login?session_expired=true';
        }
    }
    return Promise.reject(new Error(message));
});
export const adminApi = {
    getStats: () => api.get('/admin/stats'),
    getPendingUsers: () => api.get('/admin/pending-users'),
    getUsers: (params) => api.get('/admin/users', { params }),
    approveUser: (userId, notes) => api.post(`/admin/approve-user/${userId}`, { notes }),
    rejectUser: (userId, reason) => api.post(`/admin/reject-user/${userId}`, { reason }),
    updateUserStatus: (userId, status, notes) => api.put(`/admin/user-status/${userId}`, { status, notes }),
    postAnnouncement: (title, message) => api.post('/admin/announcements', { title, message }),
};
