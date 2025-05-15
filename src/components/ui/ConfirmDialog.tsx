import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmIcon?: React.ElementType;
    isLoading?: boolean;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
}

export function ConfirmDialog({
                                  title,
                                  message,
                                  confirmText = 'Confirm',
                                  cancelText = 'Cancel',
                                  confirmIcon: ConfirmIcon,
                                  isLoading = false,
                                  isDangerous = false,
                                  onConfirm,
                                  onCancel,
                                  isOpen
                              }: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">{title}</h3>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 ${
                                isDangerous ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                            } text-white rounded-lg transition-colors flex items-center gap-2`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    {ConfirmIcon && <ConfirmIcon size={18} />}
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}