// src/components/layout/PharmacyHeader.tsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    User,
    Bell,
    Heart,
    LogOut,
    ChevronDown,
    Package,
    Settings,
    Pills,
    Activity,
    Home,
    Menu,
    X,
    Droplets,
    Ambulance
} from 'lucide-react';
import { api } from '../../lib/api';
import { logout } from '../../pages/auth/auth';

export function PharmacyHeader() {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const unreadCount = 0; // Replace with actual notification count when implemented
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<{
        role?: string;
        firstName?: string;
        lastName?: string;
        pharmacyId?: number;
    } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/v1/user');
                setUser(res.data?.data || null);
            } catch (err) {
                setUser(null);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.lastName || 'User';

    const isPharmacyUser = user?.role === 'PHARMACY' || user?.pharmacyId;

    // Define navigation items for pharmacy users
    const pharmacyNavItems = [
        { name: 'Dashboard', path: '/pharmacy/dashboard', icon: <Home size={20} /> },
        { name: 'Inventory', path: '/pharmacy/inventory', icon: <Package size={20} /> },
        { name: 'Orders', path: '/pharmacy/orders', icon: <Activity size={20} /> },
    ];

    // Define navigation items for all users
    const navItems = [
        { name: 'Find Pharmacies', path: '/medicine/pharmacies', icon: <Pills size={20} /> },
        { name: 'Blood Donation', path: '/blood-donation', icon: <Droplets size={20} /> },
        { name: 'Ambulance', path: '/ambulance', icon: <Ambulance size={20} /> },
    ];

    // Determine which set of nav items to display
    const displayNavItems = isPharmacyUser ? [...pharmacyNavItems, ...navItems] : navItems;

    // Check if a nav item is active
    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <Heart className="w-8 h-8 text-red-500" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-sky-500 bg-clip-text text-transparent">
              XENON
            </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {displayNavItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                                    isActive(item.path)
                                        ? 'text-red-600 bg-red-50'
                                        : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                                }`}
                            >
                                <span className="mr-1">{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-gray-50"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* User Actions */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/notifications"
                            className="relative p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-full transition-colors"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                >
                                    <User size={20} />
                                    <span className="hidden sm:block">{userName}</span>
                                    <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                                        <div className="p-3 border-b border-gray-100">
                                            <p className="font-medium text-gray-800">{userName}</p>
                                            <p className="text-sm text-gray-500">{user.role || 'User'}</p>
                                        </div>
                                        <div className="p-2">
                                            {isPharmacyUser && (
                                                <>
                                                    <Link to="/pharmacy/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                        <div className="flex items-center gap-2">
                                                            <User size={18} />
                                                            <span>Pharmacy Dashboard</span>
                                                        </div>
                                                    </Link>
                                                    <Link to="/pharmacy/inventory" className="block px-4 py-2 text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                        <div className="flex items-center gap-2">
                                                            <Package size={18} />
                                                            <span>Inventory</span>
                                                        </div>
                                                    </Link>
                                                </>
                                            )}
                                            <Link to="/settings" className="block px-4 py-2 text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                <div className="flex items-center gap-2">
                                                    <Settings size={18} />
                                                    <span>Settings</span>
                                                </div>
                                            </Link>
                                            <hr className="my-2" />
                                            <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2" onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}>
                                                <LogOut size={18} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="px-4 py-2 bg-gradient-to-r from-red-500 to-sky-500 text-white rounded-lg hover:from-red-600 hover:to-sky-600 transition-colors">
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-sm" ref={mobileMenuRef}>
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {displayNavItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center ${
                                    isActive(item.path)
                                        ? 'text-red-600 bg-red-50'
                                        : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}