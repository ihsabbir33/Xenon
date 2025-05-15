// src/pages/NotificationDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    MapPin,
    AlertTriangle,
    ArrowLeft,
    Shield,
    Calendar,
    Clock,
    User,
    ExternalLink,
    Share2,
    Radio,
    Globe,
    Phone,
    Clipboard,
    ThumbsUp,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import useAlert from '../hooks/useAlert';

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

const NotificationDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { alert, loading, fetchAlert, markAsRead } = useAlert();
    const [localAlert, setLocalAlert] = useState<Alert | null>(null);


    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showMap, setShowMap] = useState(false); // For toggling map visibility
    const [relatedResources, setRelatedResources] = useState<string[]>([]);
    const [emergencyContacts, setEmergencyContacts] = useState<{name: string, number: string}[]>([]);

    // Determine if we came from a notification (vs an alert)
    const isFromNotification = location.pathname.includes('notifications') ||
        (location.state && (location.state as any).fromNotifications);

    // Extract notificationId from location state if present
    const notificationId = location.state && (location.state as any).notificationId;

    useEffect(() => {
        if (id) {
            fetchAlert(id);

            // If this was accessed from a notification and we have a notificationId, mark it as read
            if (isFromNotification && notificationId) {
                markAsRead(notificationId.toString());
            }

            // Simulate loading map after a delay
            setTimeout(() => setShowMap(true), 1000);
        }
    }, [id, isFromNotification, notificationId]);

    useEffect(() => {
        if (id) {
            fetchAlert(id).then(alertData => {
                if (alertData) {
                    setLocalAlert(alertData);
                }
            });

            // If we navigated with state data, use it while loading
            if (location.state && location.state.alertData) {
                setLocalAlert(location.state.alertData);
            }

            // If this was accessed from a notification and we have a notificationId, mark it as read
            if (isFromNotification && notificationId) {
                markAsRead(notificationId.toString());
            }
        }
    }, [id, isFromNotification, notificationId, location.state]);

    // Generate emergency contacts based on severity
    useEffect(() => {
        if (alert) {
            const generatedContacts = [];

            // Always add health authority
            generatedContacts.push({
                name: alert.healthAuthorizationName,
                number: "+1-800-555-" + Math.floor(1000 + Math.random() * 9000)
            });

            // Add emergency services for high severity
            if (alert.severityLevel === 'HIGH') {
                generatedContacts.push({
                    name: "Emergency Services",
                    number: "911"
                });
                generatedContacts.push({
                    name: "Crisis Helpline",
                    number: "+1-800-273-8255"
                });
            }

            setEmergencyContacts(generatedContacts);

            // Generate related resources
            const resources = [];
            switch (alert.severityLevel) {
                case 'HIGH':
                    resources.push(
                        "WHO Emergency Guidelines",
                        "CDC Evacuation Protocols",
                        "Emergency Preparedness Guide"
                    );
                    break;
                case 'MEDIUM':
                    resources.push(
                        "Health Advisory Information",
                        "Preventive Measures Guide",
                        "Community Support Resources"
                    );
                    break;
                case 'LOW':
                    resources.push(
                        "General Health Information",
                        "Awareness Guidelines",
                        "Health Department Updates"
                    );
                    break;
            }
            setRelatedResources(resources);
        }
    }, [alert]);

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

    const getSeverityBgColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'bg-red-50';
            case 'MEDIUM': return 'bg-yellow-50';
            case 'LOW': return 'bg-green-50';
            default: return 'bg-gray-50';
        }
    };

    const getSeverityGradient = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'from-red-500 to-red-600';
            case 'MEDIUM': return 'from-yellow-400 to-yellow-500';
            case 'LOW': return 'from-green-400 to-green-500';
            default: return 'from-gray-400 to-gray-500';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'HIGH':
                return <Radio className="h-6 w-6 text-red-600" />;
            case 'MEDIUM':
                return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
            case 'LOW':
                return <MapPin className="h-6 w-6 text-green-600" />;
            default:
                return <AlertTriangle className="h-6 w-6 text-gray-600" />;
        }
    };

    const formatDistanceText = (distance: number | undefined | null) => {
        if (distance === undefined || distance === null) return 'Unknown distance';
        if (distance < 1) {
            return `${(distance * 1000).toFixed(0)} meters away`;
        }
        return `${distance.toFixed(1)} km away`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleShare = async () => {
        if (!alert) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Health Alert: ${alert.title}`,
                    text: `Health Alert (${alert.severityLevel}): ${alert.title}. ${alert.description.substring(0, 100)}...`,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
                setShowShareOptions(true);
            }
        } else {
            setShowShareOptions(true);
        }
    };

    const copyToClipboard = () => {
        if (!alert) return;

        try {
            const shareText = `Health Alert (${alert.severityLevel}): ${alert.title}. ${alert.description.substring(0, 100)}... Check more details at: ${window.location.href}`;
            navigator.clipboard.writeText(shareText);
            toast.success('Link copied to clipboard');
            setShowShareOptions(false);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            toast.error('Failed to copy to clipboard');
        }
    };

    const getAffectedAreaDescription = (radius: number) => {
        if (radius < 1) {
            return `Small area (${(radius * 1000).toFixed(0)} meters radius)`;
        } else if (radius < 5) {
            return `Neighborhood (${radius.toFixed(1)} km radius)`;
        } else if (radius < 20) {
            return `City district (${radius.toFixed(1)} km radius)`;
        } else {
            return `Large area (${radius.toFixed(1)} km radius)`;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors bg-white py-2 px-4 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Back to alerts
                </motion.button>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto"></div>
                        <p className="mt-6 text-gray-600 font-medium">Loading alert details...</p>
                    </div>
                ) : alert ? (
                    <div className="space-y-6">
                        {/* Main Alert Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden"
                        >
                            <div className={`h-2 bg-gradient-to-r ${getSeverityGradient(alert.severityLevel)}`}></div>
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                    <div className="flex items-start">
                                        <div className={`p-3 rounded-full mr-4 ${getSeverityBgColor(alert.severityLevel)}`}>
                                            {getSeverityIcon(alert.severityLevel)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{alert.title}</h2>
                                            <div className="flex items-center mt-2">
                                                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getSeverityTextColor(alert.severityLevel)} ${getSeverityBgColor(alert.severityLevel)}`}>
                                                    {getSeverityIcon(alert.severityLevel)}
                                                    <span className="ml-1">{alert.severityLevel} SEVERITY</span>
                                                </span>
                                                <span className="ml-3 text-sm text-gray-500">
                                                    {alert.isActive ? (
                                                        <span className="flex items-center text-green-600">
                                                            <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-gray-500">
                                                            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                                                            Inactive
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handleShare}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Share2 size={16} />
                                            Share
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6 mt-6">
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4 overflow-auto">
                                        <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed max-h-80">
                                            {alert.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg mb-6 border border-gray-100">
                                    {alert.distanceFromUser !== undefined && (
                                        <div className="flex items-center text-gray-700">
                                            <div className="bg-blue-50 p-2 rounded-full mr-3">
                                                <MapPin size={18} className="text-blue-600" />
                                            </div>
                                            <span>{formatDistanceText(alert.distanceFromUser)}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center text-gray-700">
                                        <div className="bg-purple-50 p-2 rounded-full mr-3">
                                            <User size={18} className="text-purple-600" />
                                        </div>
                                        <span>Issued by: {alert.healthAuthorizationName}</span>
                                    </div>

                                    <div className="flex items-center text-gray-700">
                                        <div className="bg-green-50 p-2 rounded-full mr-3">
                                            <Calendar size={18} className="text-green-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>From: {formatDate(alert.startDate)}</span>
                                            <span>To: {formatDate(alert.endDate)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-700">
                                        <div className="bg-amber-50 p-2 rounded-full mr-3">
                                            <Clock size={18} className="text-amber-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>Last updated: {formatTime(alert.updatedAt)}</span>
                                            <span>{formatDate(alert.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Section - Now with animated loading */}
                                <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                                        <Globe className="mr-2 text-blue-500" />
                                        Affected Area
                                    </h3>
                                    <div className={`h-64 relative rounded-lg overflow-hidden border border-gray-200 ${showMap ? '' : 'bg-gray-50'}`}>
                                        {!showMap ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
                                                <p className="text-gray-500 ml-3">Loading map...</p>
                                            </div>
                                        ) : (
                                            <div className="relative h-full">
                                                <div className="h-full bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-center">
                                                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-blue-900 opacity-5 pattern-dots"></div>
                                                    <div className="text-center relative">
                                                        <MapPin size={32} className={`mx-auto mb-2 ${getSeverityTextColor(alert.severityLevel)}`} />
                                                        <div className={`${getSeverityColor(alert.severityLevel)} w-12 h-12 mx-auto rounded-full opacity-20 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4 animate-pulse`}></div>
                                                        <p className="font-medium text-gray-800">Alert Location</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                                                        </p>
                                                        <p className="text-sm text-gray-500 mt-4">
                                                            {getAffectedAreaDescription(alert.radius)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Safety instructions based on severity */}
                                <div className={`mt-6 p-5 rounded-lg ${getSeverityBgColor(alert.severityLevel)} border-l-4 ${getSeverityColor(alert.severityLevel)}`}>
                                    <h3 className="font-medium text-lg mb-3 flex items-center">
                                        <AlertTriangle size={20} className={`mr-2 ${getSeverityTextColor(alert.severityLevel)}`} />
                                        Safety Instructions
                                    </h3>
                                    <div className="text-gray-700 space-y-2">
                                        {alert.severityLevel === 'HIGH' && (
                                            <>
                                                <p className="font-medium">This is a HIGH severity alert. Please take the following precautions immediately:</p>
                                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                                    <li>Avoid the affected area completely if possible</li>
                                                    <li>Follow all instructions from local health authorities</li>
                                                    <li>Stay informed through official channels for updates</li>
                                                    <li>Prepare emergency supplies if advised</li>
                                                    <li>Consider evacuation plans if the situation worsens</li>
                                                </ul>
                                            </>
                                        )}
                                        {alert.severityLevel === 'MEDIUM' && (
                                            <>
                                                <p className="font-medium">This is a MEDIUM severity alert. Exercise caution with the following measures:</p>
                                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                                    <li>Monitor official updates regularly</li>
                                                    <li>Take recommended preventive measures</li>
                                                    <li>Prepare to follow additional instructions if the situation changes</li>
                                                    <li>Avoid unnecessary travel to the affected area</li>
                                                    <li>Be especially cautious if you have underlying health conditions</li>
                                                </ul>
                                            </>
                                        )}
                                        {alert.severityLevel === 'LOW' && (
                                            <>
                                                <p className="font-medium">This is a LOW severity alert. General awareness is advised:</p>
                                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                                    <li>Be aware of the situation</li>
                                                    <li>Follow basic preventive measures</li>
                                                    <li>Continue to monitor updates from health authorities</li>
                                                    <li>No immediate action is required</li>
                                                    <li>Stay informed about any changes in the alert status</li>
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Additional Resources Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6"
                        >
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <ExternalLink size={20} className="mr-2 text-indigo-500" />
                                Related Resources
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relatedResources.map((resource, index) => (
                                    <a
                                        key={index}
                                        href="#"
                                        className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                                    >
                                        <div className="p-2 bg-indigo-100 rounded-full mr-3 group-hover:bg-indigo-200 transition-colors">
                                            <ExternalLink size={16} className="text-indigo-600" />
                                        </div>
                                        <span className="text-gray-700 group-hover:text-indigo-700 transition-colors">{resource}</span>
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Emergency Contacts Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6"
                        >
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Phone size={20} className="mr-2 text-green-500" />
                                Emergency Contacts
                            </h3>
                            <div className="space-y-3">
                                {emergencyContacts.map((contact, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50 transition-colors">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-green-100 rounded-full mr-3">
                                                <Phone size={16} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{contact.name}</p>
                                                <p className="text-sm text-gray-500">{contact.number}</p>
                                            </div>
                                        </div>
                                        <button className="p-2 text-green-600 hover:bg-green-100 rounded-full">
                                            <Phone size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* User Action Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm overflow-hidden p-6"
                        >
                            <h3 className="text-lg font-semibold mb-3 text-blue-800">Was this information helpful?</h3>
                            <p className="text-blue-700 mb-4">Your feedback helps us improve health alerts.</p>
                            <div className="flex space-x-3">
                                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    <ThumbsUp size={16} />
                                    Yes, this was helpful
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                    <X size={16} />
                                    No, I need more information
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center py-12 bg-white border border-gray-200 rounded-xl shadow-sm"
                    >
                        <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-700 font-medium mb-4">Alert not found or no longer available</p>
                        <button
                            onClick={() => navigate('/alerts')}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            View All Alerts
                        </button>
                    </motion.div>
                )}

                {/* Share Options Popup */}
                <AnimatePresence>
                    {showShareOptions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
                            onClick={() => setShowShareOptions(false)}
                        >
                            <div
                                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-900">Share this alert</h3>
                                    <button
                                        onClick={() => setShowShareOptions(false)}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <div className="p-2 bg-blue-100 rounded-full mr-3">
                                                <Clipboard size={16} className="text-blue-600" />
                                            </div>
                                            <span className="text-gray-700">Copy link to clipboard</span>
                                        </div>
                                        <ArrowLeft size={16} className="text-gray-400 transform rotate-180" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationDetailPage;