import { ReactNode, useState, useRef, useEffect } from 'react';
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
    Menu,
    X,
    Store
} from 'lucide-react';
import { api } from '../../lib/api';
import { logout } from '../../pages/auth/auth';

interface PharmacyLayoutProps {
    children: ReactNode;
}

export function PharmacyLayout({ children }: PharmacyLayoutProps) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const unreadCount = 0;
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

    // Define navigation items
    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Find Pharmacies', path: '/medicine/pharmacies' },
        { name: 'Medicine', path: '/medicine' },
    ];

    // Add pharmacy-specific nav items for pharmacy users
    const pharmacyNavItems = isPharmacyUser
        ? [{ name: 'Dashboard', path: '/pharmacy/dashboard' }]
        : [];

    const allNavItems = [...navItems, ...pharmacyNavItems];

    // Check if a nav item is active
    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
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
                            {allNavItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive(item.path)
                                            ? 'text-red-600 bg-red-50'
                                            : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                                    }`}
                                >
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
                                                    <Link to="/pharmacy/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                                                        <div className="flex items-center gap-2">
                                                            <Store size={18} />
                                                            <span>Pharmacy Dashboard</span>
                                                        </div>
                                                    </Link>
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
                            {allNavItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                                        isActive(item.path)
                                            ? 'text-red-600 bg-red-50'
                                            : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="w-6 h-6 text-red-500" />
                                <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-sky-500 bg-clip-text text-transparent">
                  XENON
                </span>
                            </div>
                            <p className="text-gray-600 mb-4">
                                Your trusted healthcare partner for medications and pharmacy services.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800 mb-4">Services</h3>
                            <ul className="space-y-2">
                                <li><Link to="/medicine/pharmacies" className="text-gray-600 hover:text-red-500">Find Pharmacies</Link></li>
                                <li><Link to="/medicine" className="text-gray-600 hover:text-red-500">Order Medicine</Link></li>
                                <li><Link to="/blood-donation" className="text-gray-600 hover:text-red-500">Blood Donation</Link></li>
                                <li><Link to="/doctor" className="text-gray-600 hover:text-red-500">Find Doctors</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800 mb-4">About Us</h3>
                            <ul className="space-y-2">
                                <li><Link to="/about" className="text-gray-600 hover:text-red-500">About XENON</Link></li>
                                <li><Link to="/contact" className="text-gray-600 hover:text-red-500">Contact Us</Link></li>
                                <li><Link to="/careers" className="text-gray-600 hover:text-red-500">Careers</Link></li>
                                <li><Link to="/terms" className="text-gray-600 hover:text-red-500">Terms of Service</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800 mb-4">Connect With Us</h3>
                            <div className="flex space-x-4 mb-4">
                                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white">
                                    <span className="sr-only">Facebook</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path></svg>
                                </a>
                                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                                </a>
                                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white">
                                    <span className="sr-only">Instagram</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path></svg>
                                </a>
                            </div>
                            <p className="text-gray-600">Download our mobile app</p>
                            <div className="flex gap-2 mt-2">
                                <a href="#" className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.3428571,0 C4.64285714,0 0,4.64285714 0,10.3428571 C0,16.0428571 4.64285714,20.6857143 10.3428571,20.6857143 C16.0428571,20.6857143 20.6857143,16.0428571 20.6857143,10.3428571 C20.6857143,4.64285714 16.0428571,0 10.3428571,0 Z M8.36428571,15.1428571 L6.29285714,13.0714286 L10.5142857,8.84285714 L6.29285714,4.61428571 L8.36428571,2.54285714 L14.6571429,8.84285714 L8.36428571,15.1428571 Z"></path></svg>
                                    App Store
                                </a>
                                <a href="#" className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M3,16 L3,4 C3,2.9 3.9,2 5,2 L15,2 C16.1,2 17,2.9 17,4 L17,16 C17,17.1 16.1,18 15,18 L5,18 C3.9,18 3,17.1 3,16 Z M5,4 L5,16 L15,16 L15,4 L5,4 Z M10,14 C8.9,14 8,13.1 8,12 C8,10.9 8.9,10 10,10 C11.1,10 12,10.9 12,12 C12,13.1 11.1,14 10,14 Z"></path></svg>
                                    Play Store
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                        <p>© {new Date().getFullYear()} XENON Healthcare. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}