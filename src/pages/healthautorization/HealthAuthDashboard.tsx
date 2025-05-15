// src/pages/healthauthorization/HealthAuthDashboard.tsx
import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Trash2, Power, Edit, Plus, RefreshCw, Search, Filter, ChevronDown, Radio, Clipboard, Eye, Users, Shield, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
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
  affectedUsers?: number;
}

interface FormData {
  title: string;
  description: string;
  alertness: string;
  latitude: string | number;
  longitude: string | number;
  radius: number;
  severityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  endDate: string;
}

interface Filter {
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
  severity: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
  searchTerm: string;
}

const HealthAuthDashboard = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    alertness: 'MEDIUM',
    latitude: '',
    longitude: '',
    radius: 1.0,
    severityLevel: 'MEDIUM',
    startDate: '',
    endDate: ''
  });
  const [authNumber, setAuthNumber] = useState<string>('');
  const [showAuthForm, setShowAuthForm] = useState<boolean>(false);
  const [hasAuthorization, setHasAuthorization] = useState<boolean>(true);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filter>({
    status: 'ALL',
    severity: 'ALL',
    searchTerm: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    high: 0,
    medium: 0,
    low: 0,
    recentlyCreated: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthorizationAndFetchAlerts();
  }, []);

  useEffect(() => {
    // Apply filters to alerts
    let result = [...alerts];

    // Filter by search term
    if (filters.searchTerm) {
      result = result.filter(alert =>
          alert.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          alert.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status !== 'ALL') {
      result = result.filter(alert =>
          filters.status === 'ACTIVE' ? alert.isActive : !alert.isActive
      );
    }

    // Filter by severity
    if (filters.severity !== 'ALL') {
      result = result.filter(alert => alert.severityLevel === filters.severity);
    }

    setFilteredAlerts(result);
  }, [filters, alerts]);

  useEffect(() => {
    // Calculate stats when alerts change
    if (alerts.length > 0) {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      setStats({
        total: alerts.length,
        active: alerts.filter(alert => alert.isActive).length,
        inactive: alerts.filter(alert => !alert.isActive).length,
        high: alerts.filter(alert => alert.severityLevel === 'HIGH').length,
        medium: alerts.filter(alert => alert.severityLevel === 'MEDIUM').length,
        low: alerts.filter(alert => alert.severityLevel === 'LOW').length,
        recentlyCreated: alerts.filter(alert => new Date(alert.createdAt) > oneDayAgo).length
      });
    }
  }, [alerts]);

  const checkAuthorizationAndFetchAlerts = async () => {
    try {
      setLoading(true);
      await fetchAlerts();
      setHasAuthorization(true);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      if (error.response && error.response.status === 404) {
        setHasAuthorization(false);
        setShowAuthForm(true);
      }
      toast.error('Could not fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data } = await api.get('/api/v1/health-authorization/alerts');
      if (data.code === 'XS0001') {
        // Add random number of affected users for demo purposes
        const alertsWithAffectedUsers = (data.data || []).map((alert: Alert) => ({
          ...alert,
          affectedUsers: Math.floor(Math.random() * 500) + 10 // Random number between 10 and 509
        }));
        setAlerts(alertsWithAffectedUsers);
        setFilteredAlerts(alertsWithAffectedUsers);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  };

  const createHealthAuth = async () => {
    try {
      if (!authNumber) {
        toast.error('Authorization number is required');
        return;
      }

      const response = await api.post('/api/v1/health-authorization/create', {
        authorizationNumber: authNumber
      });

      if (response.data.code === 'XS0001') {
        toast.success('Health authorization created successfully');
        setShowAuthForm(false);
        setHasAuthorization(true);
        fetchAlerts();
      }
    } catch (error: any) {
      console.error('Error creating health authorization:', error);
      toast.error(error.response?.data?.message || 'Failed to create health authorization');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    setFormData({
      title: '',
      description: '',
      alertness: 'MEDIUM',
      latitude: '',
      longitude: '',
      radius: 1.0,
      severityLevel: 'MEDIUM',
      startDate: now.toISOString().split('.')[0],
      endDate: tomorrow.toISOString().split('.')[0]
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (alert: Alert) => {
    setCurrentAlert(alert);
    setFormData({
      title: alert.title,
      description: alert.description,
      alertness: alert.alertness,
      latitude: alert.latitude,
      longitude: alert.longitude,
      radius: alert.radius,
      severityLevel: alert.severityLevel,
      startDate: new Date(alert.startDate).toISOString().split('.')[0],
      endDate: new Date(alert.endDate).toISOString().split('.')[0]
    });
    setShowEditModal(true);
  };

  const handleCreateAlert = async () => {
    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.latitude || !formData.longitude || !formData.startDate || !formData.endDate) {
        toast.error('Please fill all required fields');
        return;
      }

      const payload = {
        ...formData,
        latitude: parseFloat(String(formData.latitude)),
        longitude: parseFloat(String(formData.longitude)),
        radius: parseFloat(String(formData.radius)),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      const response = await api.post('/api/v1/health-authorization/alert', payload);

      if (response.data.code === 'XS0001') {
        toast.success('Alert created successfully');
        setShowCreateModal(false);
        fetchAlerts();
      }
    } catch (error: any) {
      console.error('Error creating alert:', error);
      toast.error(error.response?.data?.message || 'Failed to create alert');
    }
  };

  const handleUpdateAlert = async () => {
    try {
      if (!currentAlert) return;

      // Validate form data
      if (!formData.title || !formData.description || !formData.latitude || !formData.longitude || !formData.startDate || !formData.endDate) {
        toast.error('Please fill all required fields');
        return;
      }

      const payload = {
        ...formData,
        latitude: parseFloat(String(formData.latitude)),
        longitude: parseFloat(String(formData.longitude)),
        radius: parseFloat(String(formData.radius)),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      const response = await api.put(`/api/v1/health-authorization/alert/${currentAlert.id}`, payload);

      if (response.data.code === 'XS0001') {
        toast.success('Alert updated successfully');
        setShowEditModal(false);
        fetchAlerts();
      }
    } catch (error: any) {
      console.error('Error updating alert:', error);
      toast.error(error.response?.data?.message || 'Failed to update alert');
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    if (window.confirm('Are you sure you want to delete this alert? This action cannot be undone.')) {
      try {
        const response = await api.delete(`/api/v1/health-authorization/alert/${alertId}`);

        if (response.data.code === 'XS0001') {
          toast.success('Alert deleted successfully');
          fetchAlerts();
        }
      } catch (error: any) {
        console.error('Error deleting alert:', error);
        toast.error(error.response?.data?.message || 'Failed to delete alert');
      }
    }
  };

  const handleDeactivateAlert = async (alertId: number, isActive: boolean) => {
    try {
      const endpoint = isActive
          ? `/api/v1/health-authorization/alert/${alertId}/deactivate`
          : `/api/v1/health-authorization/alert/${alertId}/activate`;

      const response = await api.put(endpoint);

      if (response.data.code === 'XS0001') {
        toast.success(isActive ? 'Alert deactivated successfully' : 'Alert activated successfully');
        fetchAlerts();
      }
    } catch (error: any) {
      console.error('Error toggling alert status:', error);
      toast.error(error.response?.data?.message || 'Failed to update alert status');
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData({
              ...formData,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            toast.success('Location updated');
          },
          (error) => {
            console.error('Error getting location:', error);
            toast.error('Could not get your location. Please enter manually.');
          }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
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

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-50';
      case 'MEDIUM': return 'bg-yellow-50';
      case 'LOW': return 'bg-green-50';
      default: return 'bg-gray-50';
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <Radio className="h-5 w-5 text-red-600" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'LOW':
        return <MapPin className="h-5 w-5 text-green-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    const isActive = now >= startDate && now <= endDate;
    const isUpcoming = now < startDate;
    const isExpired = now > endDate;

    let statusColor = 'text-green-600 bg-green-50';
    let statusText = 'Active';

    if (isUpcoming) {
      statusColor = 'text-blue-600 bg-blue-50';
      statusText = 'Upcoming';
    } else if (isExpired) {
      statusColor = 'text-gray-600 bg-gray-50';
      statusText = 'Expired';
    }

    return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor}`}>
            {statusText}
          </span>
          </div>
          <span className="text-xs text-gray-500">
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </span>
        </div>
    );
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
    );
  }

  if (showAuthForm) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 p-6 text-white">
              <Shield className="h-12 w-12 mb-4" />
              <h2 className="text-2xl font-bold">Health Authorization Required</h2>
              <p className="mt-2 text-white/80">Create your health authority account to manage critical health alerts</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                You need to create a health authorization account to manage health alerts. Please enter your authorization number provided by the health ministry.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authorization Number
                  </label>
                  <input
                      type="text"
                      value={authNumber}
                      onChange={(e) => setAuthNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter your authorization number"
                  />
                </div>
                <button
                    onClick={createHealthAuth}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-2 px-4 rounded-md hover:from-red-700 hover:to-red-600 transition duration-200 flex items-center justify-center"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Create Authorization
                </button>
              </div>
            </div>
          </div>
        </motion.div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="h-8 w-8 mr-3 text-red-500" />
                Health Alert Management
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Create and manage health alerts to inform the public about potential health hazards in your jurisdiction.
              </p>
            </div>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-colors shadow-sm"
            >
              <Plus size={18} />
              Create New Alert
            </motion.button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Alerts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Clipboard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className="h-2 flex-grow rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Active Alerts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Power className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className="h-2 flex-grow rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-green-600" style={{ width: `${stats.total ? (stats.active / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">High Severity</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.high}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <Radio className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className="h-2 flex-grow rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-red-600" style={{ width: `${stats.total ? (stats.high / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Recently Created</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.recentlyCreated}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <div className="h-2 flex-grow rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-purple-600" style={{ width: `${stats.total ? (stats.recentlyCreated / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and search */}
          <div className="bg-white rounded-xl shadow-sm mb-6 p-4 border border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-grow flex items-center max-w-md border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500">
                <Search className="h-5 w-5 text-gray-400 mr-2" />
                <input
                    type="text"
                    placeholder="Search alerts by title or description..."
                    className="flex-grow border-none focus:outline-none text-sm"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                />
                {filters.searchTerm && (
                    <button
                        onClick={() => setFilters({...filters, searchTerm: ''})}
                        className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                )}
              </div>

              <div className="relative">
                <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">Filters</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>

                {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                              <button
                                  key={status}
                                  className={`px-3 py-1 text-xs rounded-md ${
                                      filters.status === status
                                          ? 'bg-red-100 text-red-700 border border-red-200'
                                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                  }`}
                                  onClick={() => setFilters({...filters, status: status as 'ALL' | 'ACTIVE' | 'INACTIVE'})}
                              >
                                {status}
                              </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                              <button
                                  key={severity}
                                  className={`px-3 py-1 text-xs rounded-md ${
                                      filters.severity === severity
                                          ? 'bg-red-100 text-red-700 border border-red-200'
                                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                  }`}
                                  onClick={() => setFilters({...filters, severity: severity as 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'})}
                              >
                                {severity}
                              </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between">
                        <button
                            className="text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => setFilters({status: 'ALL', severity: 'ALL', searchTerm: ''})}
                        >
                          Reset all filters
                        </button>
                        <button
                            className="text-xs text-red-600 hover:text-red-800"
                            onClick={() => setShowFilterMenu(false)}
                        >
                          Apply filters
                        </button>
                      </div>
                    </div>
                )}
              </div>

              <button
                  onClick={fetchAlerts}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>

          {/* Alert List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Manage Alerts</h2>

              {filteredAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">No alerts found</p>
                    <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
                      {filters.searchTerm || filters.status !== 'ALL' || filters.severity !== 'ALL'
                          ? 'Try adjusting your filters or search terms'
                          : 'Create your first health alert to inform the public about potential health hazards.'
                      }
                    </p>
                    {(filters.searchTerm || filters.status !== 'ALL' || filters.severity !== 'ALL') && (
                        <button
                            onClick={() => setFilters({status: 'ALL', severity: 'ALL', searchTerm: ''})}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          Clear All Filters
                        </button>
                    )}
                  </div>
              ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valid Period
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Affected Users
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAlerts.map((alert) => (
                          <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-start">
                                <div className="mr-3">
                                  <div className={`p-2 rounded-lg ${getSeverityBgColor(alert.severityLevel)}`}>
                                    {getSeverityIcon(alert.severityLevel)}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{alert.title}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{alert.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getSeverityColor(alert.severityLevel)}`}>
                            {alert.severityLevel}
                          </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Radius: {alert.radius.toFixed(1)} km
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderDateRange(alert.startDate, alert.endDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1 text-gray-400" />
                                {alert.affectedUsers}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              alert.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.isActive ? 'Active' : 'Inactive'}
                          </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => handleDeactivateAlert(alert.id, alert.isActive)}
                                    className={`p-2 rounded-lg ${
                                        alert.isActive
                                            ? 'text-yellow-600 hover:bg-yellow-50'
                                            : 'text-green-600 hover:bg-green-50'
                                    }`}
                                    title={alert.isActive ? 'Deactivate Alert' : 'Activate Alert'}
                                >
                                  <Power size={18} />
                                </button>
                                <button
                                    onClick={() => openEditModal(alert)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="Edit Alert"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteAlert(alert.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Delete Alert"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Alert Modal */}
        <AnimatePresence>
          {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 rounded-t-xl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-white">Create New Health Alert</h3>
                      <button
                          onClick={() => setShowCreateModal(false)}
                          className="text-white hover:text-gray-200 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Alert title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alertness Level*</label>
                        <select
                            name="alertness"
                            value={formData.alertness}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Detailed description of the alert including recommended actions for the public"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude*</label>
                        <div className="flex">
                          <input
                              type="number"
                              step="0.0001"
                              name="latitude"
                              value={formData.latitude}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="e.g. 23.8103"
                          />
                          <button
                              type="button"
                              onClick={getCurrentLocation}
                              className="bg-red-600 text-white px-3 py-2 rounded-r-md hover:bg-red-700 flex items-center justify-center"
                              title="Get current location"
                          >
                            <MapPin size={18} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude*</label>
                        <input
                            type="number"
                            step="0.0001"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="e.g. 90.4125"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)*</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            name="radius"
                            value={formData.radius}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Alert radius in kilometers"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity Level*</label>
                        <select
                            name="severityLevel"
                            value={formData.severityLevel}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                        <input
                            type="datetime-local"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
                        <input
                            type="datetime-local"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              This alert will be sent to all users within the specified radius. Please ensure all information is accurate before creating.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                          type="button"
                          onClick={handleCreateAlert}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-md hover:from-red-700 hover:to-red-600 transition-colors flex items-center"
                      >
                        <AlertTriangle size={18} className="mr-2" />
                        Create Alert
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
          )}
        </AnimatePresence>

        {/* Edit Alert Modal */}
        <AnimatePresence>
          {showEditModal && currentAlert && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 rounded-t-xl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-white">Edit Health Alert</h3>
                      <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200 transition-colors">
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Alert title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alertness Level*</label>
                        <select
                            name="alertness"
                            value={formData.alertness}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Detailed description of the alert"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude*</label>
                        <div className="flex">
                          <input
                              type="number"
                              step="0.0001"
                              name="latitude"
                              value={formData.latitude}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. 23.8103"
                          />
                          <button
                              type="button"
                              onClick={getCurrentLocation}
                              className="bg-blue-600 text-white px-3 py-2 rounded-r-md hover:bg-blue-700 flex items-center justify-center"
                              title="Get current location"
                          >
                            <MapPin size={18} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude*</label>
                        <input
                            type="number"
                            step="0.0001"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. 90.4125"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)*</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            name="radius"
                            value={formData.radius}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Alert radius in kilometers"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity Level*</label>
                        <select
                            name="severityLevel"
                            value={formData.severityLevel}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                        <input
                            type="datetime-local"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
                        <input
                            type="datetime-local"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              Updating this alert may notify affected users of the changes. Please ensure all information is accurate.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                          type="button"
                          onClick={() => setShowEditModal(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                          type="button"
                          onClick={handleUpdateAlert}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 transition-colors flex items-center"
                      >
                        <Edit size={18} className="mr-2" />
                        Update Alert
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default HealthAuthDashboard;