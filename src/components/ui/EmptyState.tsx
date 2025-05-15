import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    message: string;
    actionText?: string;
    actionLink?: string;
    onAction?: () => void;
    disabled?: boolean;
}

export function EmptyState({
                               icon: Icon,
                               title,
                               message,
                               actionText,
                               actionLink,
                               onAction,
                               disabled = false
                           }: EmptyStateProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            {Icon && <Icon size={48} className="mx-auto mb-4 text-gray-400" />}
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>

            {actionText && actionLink && (
                <Link
                    to={actionLink}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        disabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    onClick={(e) => {
                        if (disabled) e.preventDefault();
                        if (onAction && !disabled) onAction();
                    }}
                >
                    <Plus size={18} />
                    {actionText}
                </Link>
            )}

            {actionText && onAction && !actionLink && (
                <button
                    onClick={onAction}
                    disabled={disabled}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        disabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                    <Plus size={18} />
                    {actionText}
                </button>
            )}
        </div>
    );
}