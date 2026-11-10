import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SERVER_URL, API_BASE_URL } from '../services/api';
const SocketContext = createContext(undefined);
export const SocketProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState([]);
    // Load existing notifications via HTTP
    const refreshNotifications = async () => {
        if (!token)
            return;
        try {
            const res = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        }
        catch (err) {
            console.warn('Failed to fetch notifications:', err);
        }
    };
    // Load active temporary messages via HTTP
    const refreshMessages = async () => {
        if (!token)
            return;
        try {
            const res = await fetch(`${API_BASE_URL}/temporary-messages/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages || []);
            }
        }
        catch (err) {
            console.warn('Failed to fetch temporary messages:', err);
        }
    };
    useEffect(() => {
        if (!isAuthenticated || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setIsConnected(false);
            return;
        }
        refreshNotifications();
        refreshMessages();
        const newSocket = io(SERVER_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });
        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket.IO connected to Class Connect server');
        });
        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });
        // Handle new temporary messages from Section 21
        newSocket.on('new_temporary_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        // Handle deleted temporary message
        newSocket.on('delete_temporary_message', ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        });
        // Handle user notifications
        newSocket.on('new_notification', (notif) => {
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((c) => c + 1);
        });
        // Handle section announcement
        newSocket.on('section_announcement', (announcement) => {
            const pseudoNotif = {
                _id: 'announcement_' + Date.now(),
                title: `📢 Announcement: ${announcement.title}`,
                message: announcement.message,
                type: 'announcement',
                isRead: false,
                createdAt: new Date().toISOString(),
            };
            setNotifications((prev) => [pseudoNotif, ...prev]);
            setUnreadCount((c) => c + 1);
        });
        // Typing indicators
        newSocket.on('user_typing', ({ userName }) => {
            setTypingUsers((prev) => (prev.includes(userName) ? prev : [...prev, userName]));
        });
        newSocket.on('user_stop_typing', ({ userName }) => {
            setTypingUsers((prev) => prev.filter((u) => u !== userName));
        });
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated, token]);
    const sendMessage = async (text, ttlHours) => {
        if (!token)
            return;
        try {
            await fetch(`${API_BASE_URL}/temporary-messages/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: text, ttlHours }),
            });
        }
        catch (err) {
            console.error('Failed to post temporary message:', err);
        }
    };
    const sendTyping = () => {
        if (socket && isConnected) {
            socket.emit('typing');
        }
    };
    const sendStopTyping = () => {
        if (socket && isConnected) {
            socket.emit('stop_typing');
        }
    };
    const markNotificationRead = async (id) => {
        if (!token)
            return;
        try {
            await fetch(`${API_BASE_URL}/notifications/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        }
        catch (err) {
            console.error('Error marking notification read:', err);
        }
    };
    const markAllNotificationsRead = async () => {
        if (!token)
            return;
        try {
            await fetch(`${API_BASE_URL}/notifications/notifications/read-all`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
        catch (err) {
            console.error('Error marking all notifications read:', err);
        }
    };
    return (<SocketContext.Provider value={{
            socket,
            isConnected,
            messages,
            notifications,
            unreadNotificationCount: unreadCount,
            typingUsers,
            sendMessage,
            sendTyping,
            sendStopTyping,
            markNotificationRead,
            markAllNotificationsRead,
            refreshNotifications,
            refreshMessages,
        }}>
      {children}
    </SocketContext.Provider>);
};
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
