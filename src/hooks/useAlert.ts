// src/hooks/useAlert.ts
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

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

interface UseAlertReturn {
    alert: Alert | null;
    loading: boolean;
    error: string | null;
    fetchAlert: (id: string) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<boolean>;
}

export const useAlert = (): UseAlertReturn => {
    const [alert, setAlert] = useState<Alert | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAlert = async (id: string): Promise<Alert | null> => {
        if (!id) return null;

        try {
            setLoading(true);
            setError(null);

            const { data } = await api.get(`/api/v1/health-authorization/alert/${id}`);

            if (data.code === 'XS0001') {
                setAlert(data.data);
                return data.data; // Return the alert data
            } else {
                setError('Failed to load alert details');
                toast.error('Failed to load alert details');
                return null;
            }
        } catch (err) {
            console.error('Error fetching alert details:', err);
            setError('Could not retrieve alert information');
            toast.error('Could not retrieve alert information');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string): Promise<boolean> => {
        if (!notificationId) return false;

        try {
            const response = await api.put(`/api/v1/alert/notifications/${notificationId}/read`);
            return response.data.code === 'XS0001';
        } catch (err) {
            console.error('Error marking notification as read:', err);
            return false;
        }
    };

    return {
        alert,
        loading,
        error,
        fetchAlert,
        markAsRead
    };
};

export default useAlert;