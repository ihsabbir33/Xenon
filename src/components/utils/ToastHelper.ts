// src/utils/ToastHelper.ts
import { toast, ToastOptions } from 'react-hot-toast';
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from '../ToastComponents';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface CustomToastOptions extends ToastOptions {
    icon?: React.ReactNode;
}

const defaultDuration = 4000;

// Track active toasts to prevent duplicates
const activeToasts = new Map<string, string>();

// Function to generate a unique key for each toast
const generateToastKey = (message: string, type: ToastType): string => {
    return `${type}:${message}`;
};

// Main function to show toast with duplicate prevention
export const showToast = (
    message: string,
    type: ToastType = 'info',
    options?: CustomToastOptions
): string => {
    // Create a unique key for this toast message
    const toastKey = generateToastKey(message, type);

    // If this exact message is already displayed, don't show another one
    if (activeToasts.has(toastKey)) {
        const existingToastId = activeToasts.get(toastKey)!;

        // Optionally, you can dismiss the existing toast and show a new one
        // toast.dismiss(existingToastId);

        // Or just return the existing toast ID
        return existingToastId;
    }

    // Choose appropriate toast component based on type
    let toastId: string;

    // Add custom onDismiss handler to clean up
    const enhancedOptions = {
        ...options,
        onDismiss: () => {
            activeToasts.delete(toastKey);
            options?.onDismiss?.();
        }
    };

    switch (type) {
        case 'success':
            toastId = showSuccessToast(message, 'Success');
            break;
        case 'error':
            toastId = showErrorToast(message, 'Error');
            break;
        case 'info':
            toastId = showInfoToast(message, 'Information');
            break;
        case 'warning':
            toastId = showWarningToast(message, 'Warning');
            break;
        default:
            toastId = toast(message, enhancedOptions);
    }

    // Store the toast ID to prevent duplicates
    activeToasts.set(toastKey, toastId);

    // Auto-remove from active toasts after duration
    const duration = options?.duration || defaultDuration;
    setTimeout(() => {
        activeToasts.delete(toastKey);
    }, duration);

    return toastId;
};

// Helper functions for specific toast types
export const toastSuccess = (message: string, options?: CustomToastOptions): string => {
    return showToast(message, 'success', options);
};

export const toastError = (message: string, options?: CustomToastOptions): string => {
    return showToast(message, 'error', options);
};

export const toastInfo = (message: string, options?: CustomToastOptions): string => {
    return showToast(message, 'info', options);
};

export const toastWarning = (message: string, options?: CustomToastOptions): string => {
    return showToast(message, 'warning', options);
};

// Function to dismiss all toasts
export const dismissAllToasts = (): void => {
    toast.dismiss();
    activeToasts.clear();
};

// Function to dismiss a specific toast
export const dismissToast = (toastId: string): void => {
    toast.dismiss(toastId);

    // Remove from activeToasts map
    for (const [key, value] of activeToasts.entries()) {
        if (value === toastId) {
            activeToasts.delete(key);
            break;
        }
    }
};

// Custom icons for toasts
export const TOAST_ICONS = {
    LOCATION: '📍',
    NOTIFICATION: '🔔',
    ALERT: '🚨',
    CHECK: '✓',
    WARNING: '⚠️',
    ERROR: '❌',
    INFO: 'ℹ️',
    SUCCESS: '✅',
    CLOCK: '⏰',
    DISABLE: '🚫',
    LOADING: '⌛',
    HEART: '❤️',
    FIRE: '🔥',
    STAR: '⭐',
    THUMBS_UP: '👍',
    THUMBS_DOWN: '👎',
};

// Promise-based toasts for async operations
export const toastPromise = <T>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
    },
    options?: CustomToastOptions
): Promise<T> => {
    return toast.promise(
        promise,
        {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
        },
        options
    );
};

// Custom loading toast that can be updated
export const toastLoading = (message: string, options?: CustomToastOptions): string => {
    return toast.loading(message, options);
};

// Update existing toast
export const updateToast = (toastId: string, message: string, type: ToastType = 'info', options?: CustomToastOptions): void => {
    toast.dismiss(toastId);

    // Remove from active toasts to allow new toast to be shown
    for (const [key, value] of activeToasts.entries()) {
        if (value === toastId) {
            activeToasts.delete(key);
            break;
        }
    }

    showToast(message, type, options);
};

// Export default object with all methods
const toastHelper = {
    showToast,
    success: toastSuccess,
    error: toastError,
    info: toastInfo,
    warning: toastWarning,
    loading: toastLoading,
    promise: toastPromise,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
    update: updateToast,
    icons: TOAST_ICONS,
};

export default toastHelper;