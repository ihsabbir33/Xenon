// src/components/layout/HeaderNotificationMenu.tsx
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../stores/notificationStore';
import { api } from '../../lib/api';

interface Notification {
    id: number;
    alertId: number;
    title: string;
    description: string;
    alertness: string;
    severityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    isRead: boolean;
    createdAt: string;
    readAt?: string;
    distance?: number | null;
}

const AnimatedBellNotification = ({ unreadCount }) => {
    const [isRinging, setIsRinging] = useState(false);
    const [prevCount, setPrevCount] = useState(unreadCount);

    useEffect(() => {
        // Trigger animation when unreadCount increases
        if (unreadCount > prevCount) {
            setIsRinging(true);
            const timer = setTimeout(() => setIsRinging(false), 2000);
            return () => clearTimeout(timer);
        }
        setPrevCount(unreadCount);
    }, [unreadCount, prevCount]);

    return (
        <div className="relative">
            <motion.div
                animate={isRinging ? {
                    rotate: [0, 15, -15, 10, -10, 5, -5, 0],
                } : {}}
                transition={{ duration: 0.5 }}
            >
                <Bell
                    size={20}
                    className={`transition-colors ${unreadCount > 0 ? 'text-red-600' : 'text-gray-500'}`}
                />
            </motion.div>

            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.div
                        key="badge"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const HeaderNotificationMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationStore = useNotificationStore();
    const unreadCount = notificationStore.getUnreadCount();
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/v1/alert/notifications?page=0&size=5&sortBy=createdAt&direction=desc');
            if (data.code === 'XS0001') {
                setNotifications(data.data.content || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await notificationStore.markAsRead(notification.id);
        }
        setIsOpen(false);
        navigate(`/notifications/${notification.alertId}`);
    };

    const markAllAsRead = async () => {
        const success = await notificationStore.markAllAsRead();
        if (success) {
            // Update local notification state to reflect all are read
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, isRead: true }))
            );
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'bg-red-600';
            case 'MEDIUM': return 'bg-yellow-500';
            case 'LOW': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };
    // 2. Bell Icon Animation - Update in HeaderNotificationMenu.tsx
// Add this animation component near the top of the file:

    const BellAnimation = ({ unreadCount }: { unreadCount: number }) => {
        const [animated, setAnimated] = useState(false);

        useEffect(() => {
            // Trigger animation when unreadCount changes
            if (unreadCount > 0) {
                setAnimated(true);
                const timer = setTimeout(() => setAnimated(false), 2000);
                return () => clearTimeout(timer);
            }
        }, [unreadCount]);

        return (
            <div className="relative">
                <Bell size={20} className={animated ? "animate-pulse text-red-600" : ""} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full"
                    >
                        {unreadCount}
                    </motion.span>
                )}
            </div>
        );
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-50 rounded-full transition-colors focus:outline-none"
                aria-label="Notifications"
            >
                <AnimatedBellNotification unreadCount={unreadCount} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                    >
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        className="text-xs text-red-600 hover:text-red-800 flex items-center"
                                        onClick={markAllAsRead}
                                    >
                                        <Check size={14} className="mr-1" />
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center items-center py-6">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-6 text-center text-gray-500">
                                    <Bell size={24} className="mx-auto mb-2 text-gray-400" />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                            notification.isRead
                                                ? 'hover:bg-gray-50'
                                                : 'bg-red-50 hover:bg-red-100'
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <div className={`p-1 rounded-full mt-0.5 mr-2 ${getSeverityColor(notification.severityLevel)}`}>
                                                <AlertTriangle size={14} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-800 line-clamp-1">{notification.title}</p>
                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.description}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full text-white ${getSeverityColor(notification.severityLevel)}`}>
                            {notification.severityLevel}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-2 border-t border-gray-100">
                            <Link
                                to="/alerts"
                                state={{ tab: 'notifications' }}
                                className="block w-full py-2 px-3 text-center text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};