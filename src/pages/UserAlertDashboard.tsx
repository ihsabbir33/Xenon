// src/pages/UserAlertDashboard.tsx
import { useState, useEffect } from 'react';
import { MapPin, Bell, AlertTriangle, Check, X, Info, Shield, LocateFixed, Radio, Calendar, Eye, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';
import { useLocationStore } from '../stores/LocationStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
    id: number;
    title: string;
    description: string;
    alertness: string;
    latitude: number;
    longitude: number;
    radius: number;
    severityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    isActive: boolean;
    startDate: string;
    endDate: string;
    healthAuthorizationName: string;
    createdAt: string;
    updatedAt: string;
    distanceFromUser?: number | null;
}

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

const UserAlertDashboard = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [nearbyAlerts, setNearbyAlerts] = useState<Alert[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentTab, setCurrentTab] = useState<'nearby' | 'notifications'>('nearby');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
    const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
    const navigate = useNavigate();
    const location = useLocation();
    const notificationStore = useNotificationStore();
    const locationStore = useLocationStore();

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Check if we're being navigated from the notification icon in header
        if (location.state && location.state.tab === 'notifications') {
            setCurrentTab('notifications');
        }

        // Fetch nearby alerts if location is enabled
        if (locationStore.locationAllowed) {
            fetchNearbyAlerts();
        }

        // Set up a refresh interval for nearby alerts if location is enabled
        const refreshInterval = setInterval(() => {
            if (locationStore.locationAllowed) {
                fetchNearbyAlerts();
            }
        }, 300000); // Refresh every 5 minutes

        return () => clearInterval(refreshInterval);
    }, [location, locationStore.locationAllowed]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/v1/alert/notifications?page=0&size=10&sortBy=createdAt&direction=desc');
            if (data.code === 'XS0001') {
                setNotifications(data.data.content || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const { data } = await api.get('/api/v1/alert/notifications/unread');
            if (data.code === 'XS0001') {
                setUnreadCount(data.data.length || 0);
                // Update the global notification store as well
                notificationStore.fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNearbyAlerts = async () => {
        try {
            setLoading(true);

            // Check if user is logged in and location is enabled
            const storedLocationState = localStorage.getItem('locationEnabled');
            if (storedLocationState !== 'true') {
                toast.error('Please enable location services to see nearby alerts');
                return;
            }

            // The backend uses the user's stored location from the database
            // Just make a GET request without sending coordinates
            const { data } = await api.get('/api/v1/alert/nearby');

            if (data && data.code === 'XS0001' && Array.isArray(data.data)) {
                setNearbyAlerts(data.data || []);

                // If nearby alerts are empty, show a meaningful message
                if (data.data.length === 0) {
                    toast.info('No health alerts found in your area.');
                } else {
                    toast.success(`Found ${data.data.length} alert${data.data.length > 1 ? 's' : ''} in your area`);
                }
            } else {
                console.error('Invalid data format returned from API:', data);
                setNearbyAlerts([]);
                toast.error('Could not load nearby alerts');
            }
        } catch (error) {
            console.error('Error fetching nearby alerts:', error);
            setNearbyAlerts([]);

            // Show more specific error message based on error status
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (status === 404 && data?.message?.includes('User location not found')) {
                    toast.error('Location not found. Please enable location sharing.');
                    handleEnableLocation();
                } else if (status === 400 && data?.message?.includes('Location sharing is disabled')) {
                    toast.error('Location sharing is disabled. Please enable it to see nearby alerts.');
                    handleEnableLocation();
                } else if (status === 401) {
                    toast.error('Please log in to view nearby alerts');
                } else {
                    toast.error(`Server error: ${data?.message || 'Unknown error'}`);
                }
            } else if (error.request) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('Error connecting to alert service');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEnableLocation = async () => {
        const success = await locationStore.updateLocation();
        if (success) {
            fetchNearbyAlerts();
        }
    };

    const handleDisableLocation = async () => {
        const success = await locationStore.disableLocation();
        if (success) {
            setNearbyAlerts([]);
        }
    };

    const markNotificationAsRead = async (notificationId: number) => {
        try {
            const success = await notificationStore.markAsRead(notificationId);
            if (success) {
                // Update the notification in state
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, isRead: true }
                            : notification
                    )
                );
                fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle notification click to navigate to alert details and mark as read
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
        }

        // Navigate to the notification detail page with the alertId parameter
        navigate(`/notifications/${notification.alertId}`, {
            state: {
                fromNotifications: true,
                notificationId: notification.id
            }
        });
    };

    // Handle alert click to view details
    const handleAlertClick = (alert: Alert) => {
        if (!alert || !alert.id) {
            toast.error('Alert information is missing');
            return;
        }

        // Make sure we're navigating with complete alert data
        navigate(`/alerts/${alert.id}`, {
            state: {
                fromAlerts: true,
                alertData: alert // Pass the full alert data to avoid empty page
            }
        });
    };

    const markAllAsRead = async () => {
        const success = await notificationStore.markAllAsRead();
        if (success) {
            // Update all notifications in state to be read
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({ ...notification, isRead: true }))
            );
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } else {
            toast.error('Failed to mark all notifications as read');
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

    const getSeverityTextColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'text-red-600';
            case 'MEDIUM': return 'text-yellow-600';
            case 'LOW': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    const formatDistanceText = (distance: number | undefined | null) => {
        if (distance === undefined || distance === null) return 'Unknown distance';
        if (distance < 1) {
            return `${(distance * 1000).toFixed(0)} meters away`;
        }
        return `${distance.toFixed(1)} km away`;
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    const filteredNearbyAlerts = nearbyAlerts.filter(alert => {
        if (filterSeverity === 'ALL') return true;
        return alert.severityLevel === filterSeverity;
    });

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'HIGH':
                return <Radio className="h-5 w-5 text-red-600" />;
            case 'MEDIUM':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'LOW':
                return <Info className="h-5 w-5 text-green-600" />;
            default:
                return <Info className="h-5 w-5 text-gray-600" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Shield className="h-8 w-8 mr-3 text-red-500" />
                        Health Alert Center
                    </h1>
                    <p className="mt-2 text-gray-600 max-w-2xl">
                        Stay informed about health alerts in your area. Get real-time updates on health hazards, advisories, and safety measures.
                    </p>
                </div>

                {!locationStore.locationAllowed && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-6 mb-8 shadow-sm"
                    >
                        <div className="flex items-start">
                            <div className="mr-4 bg-red-100 p-3 rounded-full">
                                <LocateFixed className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-red-800">Location services disabled</h3>
                                <p className="mt-2 text-sm text-red-700">
                                    Enable location services to receive alerts about health hazards in your area. This helps you stay informed about important health notifications relevant to your location.
                                </p>
                                <button
                                    onClick={handleEnableLocation}
                                    disabled={locationStore.isLoading}
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MapPin className="h-5 w-5 mr-2" />
                                    {locationStore.isLoading ? 'Enabling...' : 'Enable Location'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
                                currentTab === 'nearby'
                                    ? 'text-red-600 border-b-2 border-red-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setCurrentTab('nearby')}
                        >
                            <div className="flex items-center justify-center">
                                <MapPin className="h-5 w-5 mr-2" />
                                Nearby Alerts
                            </div>
                        </button>
                        <button
                            className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
                                currentTab === 'notifications'
                                    ? 'text-red-600 border-b-2 border-red-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={() => setCurrentTab('notifications')}
                        >
                            <div className="flex items-center justify-center">
                                <Bell className="h-5 w-5 mr-2" />
                                My Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {currentTab === 'nearby' ? (
                                <motion.div
                                    key="nearby"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-gray-800">Health Alerts Near You</h2>
                                        <div className="flex space-x-2">
                                            {locationStore.locationAllowed && (
                                                <>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                                            className="text-sm text-gray-600 hover:text-red-600 flex items-center px-3 py-2 rounded-md border border-gray-200 hover:border-red-200 transition-colors"
                                                        >
                                                            Filter: {filterSeverity === 'ALL' ? 'All Severities' : filterSeverity}
                                                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {isFilterMenuOpen && (
                                                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                                <div className="py-1">
                                                                    {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                                                                        <button
                                                                            key={severity}
                                                                            className={`block w-full text-left px-4 py-2 text-sm ${
                                                                                filterSeverity === severity
                                                                                    ? 'bg-red-50 text-red-600'
                                                                                    : 'text-gray-700 hover:bg-gray-50'
                                                                            }`}
                                                                            onClick={() => {
                                                                                setFilterSeverity(severity);
                                                                                setIsFilterMenuOpen(false);
                                                                            }}
                                                                        >
                                                                            {severity === 'ALL' ? 'All Severities' : severity}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => fetchNearbyAlerts()}
                                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center px-3 py-2 rounded-md border border-gray-200 hover:border-blue-200 transition-colors"
                                                    >
                                                        <AlertTriangle size={16} className="mr-1" />
                                                        Refresh
                                                    </button>
                                                    <button
                                                        onClick={handleDisableLocation}
                                                        disabled={locationStore.isLoading}
                                                        className="text-sm text-gray-500 hover:text-red-600 flex items-center px-3 py-2 rounded-md border border-gray-200 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <X size={16} className="mr-1" />
                                                        {locationStore.isLoading ? 'Disabling...' : 'Disable Location'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {!locationStore.locationAllowed ? (
                                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-500 font-medium mb-4">Enable location services to see alerts near you</p>
                                            <button
                                                onClick={handleEnableLocation}
                                                disabled={locationStore.isLoading}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <LocateFixed className="h-5 w-5 mr-2" />
                                                {locationStore.isLoading ? 'Enabling...' : 'Enable Location'}
                                            </button>
                                        </div>
                                    ) : loading ? (
                                        <div className="text-center py-16">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
                                            <p className="mt-4 text-gray-500">Loading nearby alerts...</p>
                                        </div>
                                    ) : filteredNearbyAlerts.length === 0 ? (
                                        <div className="text-center py-16 bg-green-50 rounded-xl border border-green-100">
                                            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                                <Check size={32} className="text-green-500" />
                                            </div>
                                            <h3 className="text-lg font-medium text-green-800 mb-2">No active alerts in your area</h3>
                                            <p className="text-green-600 max-w-md mx-auto">
                                                You're in a safe zone! We'll notify you if any health alerts are issued for your location.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredNearbyAlerts.map((alert) => (
                                                <motion.div
                                                    key={alert.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-1"
                                                    onClick={() => handleAlertClick(alert)}
                                                >
                                                    <div className={`${getSeverityColor(alert.severityLevel)} h-1.5`}></div>
                                                    <div className="p-5">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-start space-x-3">
                                                                <div className={`p-2 rounded-full ${
                                                                    alert.severityLevel === 'HIGH' ? 'bg-red-100' :
                                                                        alert.severityLevel === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                                                                }`}>
                                                                    {getSeverityIcon(alert.severityLevel)}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold text-lg text-gray-800">{alert.title}</h3>
                                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{alert.description}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2 py-1 text-xs rounded-full text-white ${getSeverityColor(alert.severityLevel)} ml-2 flex-shrink-0`}>
                                                                {alert.severityLevel}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                                                <MapPin size={16} className="mr-1" />
                                                                <span>{alert.distanceFromUser !== null ? formatDistanceText(alert.distanceFromUser) : 'Location unavailable'}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm text-gray-500">
                                                                    <span className="font-medium">From:</span> {alert.healthAuthorizationName}
                                                                </div>
                                                                <div className="flex items-center text-sm text-gray-500">
                                                                    <Calendar size={14} className="mr-1" />
                                                                    <span>Until {new Date(alert.endDate).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-gray-800">My Notifications</h2>
                                        {notifications.length > 0 && unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-sm text-red-600 hover:text-red-800 flex items-center px-3 py-2 rounded-md border border-gray-200 hover:border-red-200 transition-colors"
                                            >
                                                <Check size={16} className="mr-1" />
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-16">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
                                            <p className="mt-4 text-gray-500">Loading notifications...</p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                                            <p className="text-gray-500 font-medium">You don't have any notifications</p>
                                            <p className="text-gray-400 text-sm mt-2">When you receive alerts about health hazards in your area, they will appear here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {notifications.map((notification) => (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`border rounded-lg overflow-hidden transition-all cursor-pointer transform hover:-translate-y-1 ${
                                                        notification.isRead
                                                            ? 'border-gray-200 bg-white hover:shadow-md'
                                                            : 'border-red-200 bg-red-50 hover:shadow-md'
                                                    }`}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <div className={`${getSeverityColor(notification.severityLevel)} h-1`}></div>
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-start">
                                                                <div className={`mr-3 mt-0.5 p-2 rounded-full ${
                                                                    notification.severityLevel === 'HIGH' ? 'bg-red-100' :
                                                                        notification.severityLevel === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                                                                }`}>
                                                                    {getSeverityIcon(notification.severityLevel)}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium text-gray-800">{notification.title}</h3>
                                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.description}</p>
                                                                </div>
                                                            </div>
                                                            {!notification.isRead && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markNotificationAsRead(notification.id);
                                                                    }}
                                                                    className="ml-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 flex justify-between items-center">
                                                            <div className="flex items-center text-xs text-gray-500">
                                                                <span className={`mr-2 px-2 py-0.5 rounded-full ${
                                                                    getSeverityColor(notification.severityLevel)} text-white text-xs`}>
                                                                    {notification.severityLevel}
                                                                </span>
                                                                <span>{formatTimeAgo(notification.createdAt)}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                {notification.distance !== undefined && notification.distance !== null && (
                                                                    <span className="text-xs text-gray-500 flex items-center">
                                                                        <MapPin size={12} className="inline mr-1" />
                                                                        {formatDistanceText(notification.distance)}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleNotificationClick(notification);
                                                                    }}
                                                                    className="ml-3 p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 flex items-center"
                                                                    title="View details"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6 mb-8">
                    <div className="flex items-start">
                        <div className="mr-4 bg-gradient-to-br from-red-100 to-blue-100 p-3 rounded-full">
                            <Info className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-800">About Health Alerts</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Health alerts are issued by authorized health organizations when potential health hazards are identified in your area.
                                These alerts help you stay informed about situations that might affect your health and wellbeing.
                            </p>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-red-50 to-red-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <div className="h-3 w-3 rounded-full bg-red-600 mr-2"></div>
                                        <span className="font-medium">High Severity</span>
                                    </div>
                                    <p className="text-sm text-gray-700">Immediate attention required. Could pose significant health risks. Take precautionary measures immediately.</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                                        <span className="font-medium">Medium Severity</span>
                                    </div>
                                    <p className="text-sm text-gray-700">Be cautious. Potential health concerns that should be monitored. Stay informed about developments.</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-2">
                                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                                        <span className="font-medium">Low Severity</span>
                                    </div>
                                    <p className="text-sm text-gray-700">Informational. General health advisories with minimal risk. Good to know but no immediate action required.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Tips for Staying Safe</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm mr-3">
                                <LocateFixed className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800">Keep Location Services On</h4>
                                <p className="text-sm text-gray-600 mt-1">Enable location services to receive alerts specific to your area, especially when traveling.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm mr-3">
                                <Bell className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800">Enable Notifications</h4>
                                <p className="text-sm text-gray-600 mt-1">Make sure your notification settings are enabled to get real-time alerts about emergencies.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm mr-3">
                                <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800">Follow Official Guidance</h4>
                                <p className="text-sm text-gray-600 mt-1">Always follow instructions from local health authorities during health emergencies.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm mr-3">
                                <AlertTriangle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-800">Check Alerts Regularly</h4>
                                <p className="text-sm text-gray-600 mt-1">Routinely check for new alerts, especially during disease outbreaks or environmental hazards.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAlertDashboard;