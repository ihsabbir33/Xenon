// src/components/ToastComponents.tsx
import { AlertTriangle, CheckCircle, Info, AlertOctagon, X } from 'lucide-react';
import { toast, Toast as ToastType } from 'react-hot-toast';

// Enhanced Toast Component
export const Toast = ({
                          t,
                          type,
                          title,
                          message,
                          onDismiss
                      }: {
    t: ToastType;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    onDismiss?: () => void;
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'error':
                return <AlertOctagon className="h-6 w-6 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="h-6 w-6 text-amber-500" />;
            case 'info':
                return <Info className="h-6 w-6 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return 'bg-green-50 border-l-4 border-green-500';
            case 'error': return 'bg-red-50 border-l-4 border-red-500';
            case 'warning': return 'bg-amber-50 border-l-4 border-amber-500';
            case 'info': return 'bg-blue-50 border-l-4 border-blue-500';
        }
    };
/*

// Enhanced toast functions
export const showSuccessToast = (message: string, title: string = 'Success') => {
    return toast.custom((t) => (
        <Toast t={t} type="success" title={title} message={message} />
    ));
};

export const showErrorToast = (message: string, title: string = 'Error') => {
    return toast.custom((t) => (
        <Toast t={t} type="error" title={title} message={message} />
    ));
};

export const showInfoToast = (message: string, title: string = 'Information') => {
    return toast.custom((t) => (
        <Toast t={t} type="info" title={title} message={message} />
    ));
};

export const showWarningToast = (message: string, title: string = 'Warning') => {
    return toast.custom((t) => (
        <Toast t={t} type="warning" title={title} message={message} />
    ));
};

export default {
    success: showSuccessToast,
    error: showErrorToast,
    info: showInfoToast,
    warning: showWarningToast
};
*/


    return (
        <div
            className={`${getBgColor()} rounded-md shadow-md max-w-md w-full pointer-events-auto overflow-hidden`}
            style={{
                animation: t.visible ? 'toast-enter 0.3s ease-out' : 'toast-exit 0.3s ease-in forwards',
            }}
        >
            <div className="flex p-4">
                <div className="flex-shrink-0 mr-3">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">{title}</p>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                if (onDismiss) onDismiss();
                            }}
                            className="bg-transparent hover:bg-gray-100 rounded-full p-1 -mr-1 -mt-1 transition-colors"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{message}</p>
                </div>
            </div>
        </div>
    );
};

// Enhanced toast functions with additional options
export const showSuccessToast = (message: string, title: string = 'Success') => {
    return toast.custom((t) => (
        <Toast t={t} type="success" title={title} message={message} />
    ), {
        duration: 3000,
        position: 'top-right'
    });
};

export const showErrorToast = (message: string, title: string = 'Error') => {
    return toast.custom((t) => (
        <Toast t={t} type="error" title={title} message={message} />
    ), {
        duration: 4000,
        position: 'top-right'
    });
};

export const showInfoToast = (message: string, title: string = 'Information') => {
    return toast.custom((t) => (
        <Toast t={t} type="info" title={title} message={message} />
    ), {
        duration: 3000,
        position: 'top-right'
    });
};

export const showWarningToast = (message: string, title: string = 'Warning') => {
    return toast.custom((t) => (
        <Toast t={t} type="warning" title={title} message={message}/>
    ), {
        duration: 3500,
        position: 'top-right'
    });
}