
type CategoryType = 'MEDICAL_TIPS' | 'BLOOD_REQUEST' | 'QUESTION' | 'NEWS' | 'NEED_HELP' | 'DOCTOR_ARTICLE';
type SizeType = 'sm' | 'md' | 'lg';

interface CategoryStyles {
    [key: string]: string;
}

interface CategoryLabels {
    [key: string]: string;
}

interface SizeClasses {
    [key: string]: string;
}

interface CategoryBadgeProps {
    category: CategoryType | string;
    size?: SizeType;
}

const categoryStyles: CategoryStyles = {
    'MEDICAL_TIPS': 'bg-green-100 text-green-700',
    'BLOOD_REQUEST': 'bg-red-100 text-red-700',
    'QUESTION': 'bg-purple-100 text-purple-700',
    'NEWS': 'bg-blue-100 text-blue-700',
    'NEED_HELP': 'bg-amber-100 text-amber-700',
    'DOCTOR_ARTICLE': 'bg-cyan-100 text-cyan-700'
};

const categoryLabels: CategoryLabels = {
    'MEDICAL_TIPS': 'Medical Tips',
    'BLOOD_REQUEST': 'Blood Request',
    'QUESTION': 'Question',
    'NEWS': 'News',
    'NEED_HELP': 'Need Help',
    'DOCTOR_ARTICLE': 'Doctor Article'
};

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
    const style = categoryStyles[category] || 'bg-gray-100 text-gray-700';
    const label = categoryLabels[category] || category;

    const sizeClasses: SizeClasses = {
        'sm': 'px-2 py-0.5 text-xs',
        'md': 'px-3 py-1 text-sm',
        'lg': 'px-4 py-1.5 text-base'
    };

    return (
        <span className={`${style} ${sizeClasses[size]} rounded-full font-medium inline-block`}>
            {label}
        </span>
    );
}