import { create } from 'zustand';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    locationAllowed: boolean;
    permissionDialogShown: boolean;
    isLoading: boolean;
    updateLocation: () => Promise<boolean>; // Return success status
    disableLocation: () => Promise<boolean>; // New method
    setPermissionDialogShown: (shown: boolean) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    latitude: null,
    longitude: null,
    locationAllowed: localStorage.getItem('locationEnabled') === 'true',
    permissionDialogShown: false,
    isLoading: false,

    updateLocation: async () => {
        try {
            set({ isLoading: true });

            // Get current position from browser
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;

            // Store in localStorage first
            localStorage.setItem('userLat', latitude.toString());
            localStorage.setItem('userLng', longitude.toString());
            localStorage.setItem('locationEnabled', 'true');

            // Send to API
            const response = await api.put('/api/v1/location/update', {
                latitude,
                longitude,
                locationAllowed: true
            });

            if (response.data?.code === 'XS0001') {
                // Also update the user profile latitude longitude
                await api.put('/api/v1/user/user-profile-latitude-longitude-update', {
                    latitude,
                    longitude
                });

                set({
                    latitude,
                    longitude,
                    locationAllowed: true,
                    permissionDialogShown: true
                });

                toast.success('Location services enabled successfully!');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to update location:', error);

            // Handle specific geolocation errors
            if (error.code === 1) {
                toast.error('Location permission denied. Please enable it in your browser settings.');
            } else if (error.code === 2) {
                toast.error('Location information unavailable.');
            } else if (error.code === 3) {
                toast.error('Location request timed out.');
            } else {
                toast.error('Unable to update location. Please try again later.');
            }

            set({ locationAllowed: false });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    disableLocation: async () => {
        try {
            set({ isLoading: true });

            const response = await api.put('/api/v1/location/update', {
                latitude: null,
                longitude: null,
                locationAllowed: false
            });

            if (response.data?.code === 'XS0001') {
                // Clear location data from localStorage
                localStorage.removeItem('userLat');
                localStorage.removeItem('userLng');
                localStorage.setItem('locationEnabled', 'false');

                set({
                    latitude: null,
                    longitude: null,
                    locationAllowed: false
                });

                toast.success('Location services disabled');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error disabling location:', error);
            toast.error('Failed to disable location services');
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    setPermissionDialogShown: (shown) => set({ permissionDialogShown: shown })
}));