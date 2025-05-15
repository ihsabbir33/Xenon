// src/stores/notificationStore.ts
import { create } from 'zustand';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface LocationStatus {
  enabled: boolean;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  } | null;
}

interface NotificationState {
  unreadCount: number;
  loading: boolean;
  locationStatus: LocationStatus;

  // Notification methods
  fetchUnreadCount: () => Promise<void>;
  getUnreadCount: () => number;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<boolean>;

  // Location methods
  enableLocationServices: () => Promise<boolean>;
  disableLocationServices: () => Promise<boolean>;
  checkLocationStatus: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  loading: false,
  locationStatus: {
    enabled: localStorage.getItem('locationEnabled') === 'true',
    coordinates: null
  },

  fetchUnreadCount: async () => {
    try {
      set({ loading: true });
      // This endpoint is specifically for alert notifications unread count
      const { data } = await api.get('/api/v1/alert/notifications/unread');

      if (data.code === 'XS0001') {
        set({ unreadCount: data.data.length || 0 });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      set({ loading: false });
    }
  },

  getUnreadCount: () => {
    return get().unreadCount;
  },

  markAllAsRead: async () => {
    try {
      set({ loading: true });
      const response = await api.put('/api/v1/alert/notifications/read-all');

      if (response.data.code === 'XS0001') {
        set({ unreadCount: 0 });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId: number) => {
    try {
      const response = await api.put(`/api/v1/alert/notifications/${notificationId}/read`);

      if (response.data.code === 'XS0001') {
        // Update the unread count
        get().fetchUnreadCount();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  enableLocationServices: async () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                // Update location in localStorage first
                localStorage.setItem('userLat', latitude.toString());
                localStorage.setItem('userLng', longitude.toString());
                localStorage.setItem('locationEnabled', 'true');

                // Update location via API
                const response = await api.put('/api/v1/location/update', {
                  latitude,
                  longitude,
                  locationAllowed: true
                });

                if (response.data.code === 'XS0001') {
                  // Also update the user profile latitude longitude
                  await api.put('/api/v1/user/user-profile-latitude-longitude-update', {
                    latitude,
                    longitude
                  });

                  set({
                    locationStatus: {
                      enabled: true,
                      coordinates: { latitude, longitude }
                    }
                  });

                  // Only show one toast message
                  toast.success('Location services enabled');
                  resolve(true);
                } else {
                  toast.error('Failed to update location settings');
                  resolve(false);
                }
              } catch (error) {
                console.error('Error updating location:', error);
                toast.error('Failed to update location settings');
                resolve(false);
              }
            },
            (error) => {
              console.error('Error getting location:', error);
              toast.error('Could not get your location. Please check for permission.');
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        toast.error('Geolocation is not supported by your browser');
        resolve(false);
      }
    });
  },

  disableLocationServices: async () => {
    try {
      const response = await api.put('/api/v1/location/update', {
        latitude: null,
        longitude: null,
        locationAllowed: false
      });

      if (response.data.code === 'XS0001') {
        // Clear location data from localStorage
        localStorage.removeItem('userLat');
        localStorage.removeItem('userLng');
        localStorage.setItem('locationEnabled', 'false');

        set({
          locationStatus: {
            enabled: false,
            coordinates: null
          }
        });

        // Only show one toast message
        toast.success('Location services disabled');
        return true;
      } else {
        toast.error('Failed to update location settings');
        return false;
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location settings');
      return false;
    }
  },

  checkLocationStatus: async () => {
    // Check if location is stored or previously enabled
    const storedLocationState = localStorage.getItem('locationEnabled');
    const isEnabled = storedLocationState === 'true';

    set({
      locationStatus: {
        enabled: isEnabled,
        coordinates: null
      }
    });

    // If location is enabled, attempt to get current coordinates
    if (isEnabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            set({
              locationStatus: {
                enabled: true,
                coordinates: { latitude, longitude }
              }
            });
          },
          (error) => {
            console.error('Error getting location:', error);
          }
      );
    }
  }
}));