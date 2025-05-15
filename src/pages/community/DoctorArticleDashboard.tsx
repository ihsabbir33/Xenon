import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, ThumbsUp, MessageCircle, Eye, Clock, User, Trash2, Edit, Share2,
    Heart, Stethoscope, BookOpen, TrendingUp, Shield, GraduationCap, Award,
    Lightbulb, ChevronRight, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/ui/EmptyState';

// API Response Types
interface CommentResponse {
    id: number;
    userId: number;
    userName: string;
    content: string;
    createdAt: string;
    blogId: number | null;
    blogTitle: string | null;
}

interface ArticleResponse {
    blogId: number;
    userId: number;
    userName: string;
    userRole: string;
    title: string;
    content: string;
    category: string;
    doctorCategory: string | null;
    media: string | null;
    commentCount: number;
    likeCount: number;
    viewCount: number;
    commentResponseLists: CommentResponse[];
    createdAt: string;
    updatedAt: string;
    doctorCredentials: any | null;
    liked?: boolean;
}

interface PaginatedResponse {
    content: ArticleResponse[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

interface ApiResponse {
    code: string;
    message: string;
    data: PaginatedResponse;
}

// Frontend Model Types
interface User {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    specialty?: string;
    verified?: boolean;
}

interface Article {
    id: number;
    title: string;
    content: string;
    category: string;
    doctorCategory: string;
    media: string | null;
    createdAt: string;
    updatedAt: string;
    user: User;
    commentCount: number;
    likeCount: number;
    viewCount: number;
    liked: boolean;
    isOwner: boolean;
    readTime?: string;
}

interface CategoryOption {
    value: string;
    label: string;
    color: string;
    icon: any;
}

// Animation Components
const StatCard = ({ icon: Icon, value, label, bgColor, textColor }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgColor} p-4 rounded-xl`}
    >
        <div className="flex items-center gap-3">
            <Icon className={`${textColor} w-8 h-8`} />
            <div>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                <p className="text-sm text-gray-600">{label}</p>
            </div>
        </div>
    </motion.div>
);

const FloatingAnimation = ({ children, delay = 0 }) => (
    <motion.div
        animate={{
            y: [0, -10, 0],
        }}
        transition={{
            duration: 4,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
    >
        {children}
    </motion.div>
);

export function DoctorArticleDashboard() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [userArticles, setUserArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [userLoading, setUserLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchInputValue, setSearchInputValue] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [profileComplete, setProfileComplete] = useState<boolean>(false);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [isDoctor, setIsDoctor] = useState<boolean>(false);

    // Medical article categories
    const categories: CategoryOption[] = [
        { value: 'MENTAL_HEALTH', label: 'Mental Health', color: 'bg-indigo-100 text-indigo-700', icon: Lightbulb },
        { value: 'PHYSICAL_HEALTH', label: 'Physical Health', color: 'bg-green-100 text-green-700', icon: Heart },
        { value: 'PREVENTIVE_CARE', label: 'Preventive Care', color: 'bg-blue-100 text-blue-700', icon: Shield },
        { value: 'NUTRITION', label: 'Nutrition', color: 'bg-amber-100 text-amber-700', icon: Award },
        { value: 'ALTERNATIVE_MEDICINE', label: 'Alternative Medicine', color: 'bg-purple-100 text-purple-700', icon: Stethoscope },
        { value: 'MEDICAL_RESEARCH', label: 'Medical Research', color: 'bg-red-100 text-red-700', icon: TrendingUp },
        { value: 'FITNESS', label: 'Fitness', color: 'bg-cyan-100 text-cyan-700', icon: Heart }
    ];

    const stats = [
        { icon: GraduationCap, value: '250+', label: 'Expert Doctors', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
        { icon: BookOpen, value: '1.5k', label: 'Medical Articles', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
        { icon: Award, value: '98%', label: 'Accuracy Rate', bgColor: 'bg-green-50', textColor: 'text-green-600' }
    ];

    // Check user profile
    useEffect(() => {
        const checkUserProfile = async () => {
            try {
                const { data } = await api.get('/api/v1/user');
                console.log("User profile response:", data);

                if (data?.code === 'XS0001') {
                    const userData = data.data;
                    setUserProfile(userData);
                    setIsDoctor(userData.role === 'DOCTOR');

                    // Profile is complete if email exists
                    const isComplete = userData && userData.email;
                    setProfileComplete(!!isComplete);

                    if (!isComplete) {
                        toast.error('Please complete your profile to access all community features');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch user profile', err);
                toast.error('Unable to verify your profile. Please try again later.');
                setProfileComplete(false);
            }
        };

        checkUserProfile();
    }, []);

    // Fetch articles based on active tab
    useEffect(() => {
        if (activeTab === 'all') {
            if (searchQuery) {
                fetchSearchArticles();
            } else if (selectedCategory) {
                fetchCategoryArticles();
            } else {
                fetchAllArticles();
            }
        } else {
            fetchUserArticles();
        }
    }, [activeTab, pageNumber, selectedCategory, searchQuery, userProfile]);

    const getCategoryDetails = (categoryValue: string) => {
        return categories.find(cat => cat.value === categoryValue) || categories[0];
    };

    const transformArticleData = (article: ArticleResponse): Article => {
        console.log("Transforming article:", {
            blogId: article.blogId,
            title: article.title,
            category: article.category,
            doctorCategory: article.doctorCategory
        });

        // Extract names from userName with better error handling
        const names = article.userName ? article.userName.split(' ') : ['Doctor', ''];
        const firstName = names[0] || 'Doctor';
        const lastName = names.slice(1).join(' ') || '';

        // Calculate read time with error handling
        const wordCount = article.content?.split(' ').length || 0;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        return {
            id: article.blogId,
            title: article.title || 'Untitled Article',
            content: article.content || '',
            category: article.category || 'DOCTOR_ARTICLE',
            doctorCategory: article.doctorCategory || 'GENERAL',
            media: article.media,
            createdAt: article.createdAt || new Date().toISOString(),
            updatedAt: article.updatedAt || new Date().toISOString(),
            user: {
                id: article.userId || 0,
                firstName: firstName,
                lastName: lastName,
                profileImage: null,
                specialty: getCategoryDetails(article.doctorCategory)?.label || 'General Practice',
                verified: article.userRole === 'DOCTOR'
            },
            commentCount: article.commentCount || 0,
            likeCount: article.likeCount || 0,
            viewCount: article.viewCount || 0,
            liked: article.liked === true,
            isOwner: userProfile ? userProfile.id === article.userId : false,
            readTime: `${readTime} min read`
        };
    };

    // Update fetchSearchArticles to handle the nested response structure
    const fetchSearchArticles = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const url = `/api/v1/blog/search?query=${encodeURIComponent(searchQuery)}&page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`;

            console.log("Searching articles with URL:", url);
            const response = await api.get<ApiResponse>(url);
            console.log("Search API response:", response.data);

            if (response.data?.code === 'XS0001') {
                // Check if data is nested in body
                let paginatedData = response.data.data;

                // Handle nested response structure
                if (paginatedData.body) {
                    paginatedData = paginatedData.body.data || paginatedData.body;
                }

                if (!paginatedData || !paginatedData.content) {
                    console.error("Invalid response structure for search:", paginatedData);
                    setArticles([]);
                    setTotalPages(0);
                    return;
                }

                // Filter to only include doctor articles
                const doctorArticles = paginatedData.content.filter(
                    article => article.category === 'DOCTOR_ARTICLE' && article.doctorCategory
                );

                const transformedArticles = doctorArticles.map(transformArticleData);
                console.log("Filtered search results for doctor articles:", transformedArticles);

                setArticles(transformedArticles);
                setTotalPages(paginatedData.totalPages || 1);
            } else {
                console.error("API returned error for search:", response.data);
                toast.error(response.data?.message || 'Failed to search articles');
                setArticles([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error searching articles:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            toast.error('Failed to search articles');
            setArticles([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

// Update fetchAllArticles to handle the same nested structure
    const fetchAllArticles = async () => {
        try {
            setLoading(true);
            const url = `/api/v1/blog?page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`;

            console.log("Fetching all articles with URL:", url);
            const response = await api.get<ApiResponse>(url);
            console.log("API Response:", response.data);

            if (response.data?.code === 'XS0001') {
                // Check if data is nested in body
                let paginatedData = response.data.data;

                // Handle nested response structure
                if (paginatedData.body) {
                    paginatedData = paginatedData.body.data || paginatedData.body;
                }

                if (!paginatedData || !paginatedData.content) {
                    console.error("Invalid response structure:", paginatedData);
                    setArticles([]);
                    setTotalPages(0);
                    return;
                }

                // Filter for doctor articles (those with doctorCategory)
                const doctorArticles = paginatedData.content.filter(
                    article => article.category === 'DOCTOR_ARTICLE' && article.doctorCategory
                );

                const transformedArticles = doctorArticles.map(transformArticleData);
                console.log("Transformed doctor articles:", transformedArticles);

                setArticles(transformedArticles);
                setTotalPages(paginatedData.totalPages || 1);
            } else {
                console.error("API returned error:", response.data);
                toast.error(response.data?.message || 'Failed to load articles');
                setArticles([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching all articles:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            toast.error('Failed to load articles');
            setArticles([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

// Update fetchCategoryArticles with the same fix
    const fetchCategoryArticles = async () => {
        if (!selectedCategory) return;

        try {
            setLoading(true);
            const url = `/api/v1/blog?page=0&size=100&sortBy=createdAt&direction=desc`;

            console.log("Fetching articles for category filtering:", url);
            const response = await api.get<ApiResponse>(url);

            if (response.data?.code === 'XS0001') {
                // Check if data is nested in body
                let paginatedData = response.data.data;

                // Handle nested response structure
                if (paginatedData.body) {
                    paginatedData = paginatedData.body.data || paginatedData.body;
                }

                if (!paginatedData || !paginatedData.content) {
                    console.error("Invalid response structure for category:", paginatedData);
                    setArticles([]);
                    setTotalPages(0);
                    return;
                }

                // Filter for doctor articles with the selected doctorCategory
                const filteredArticles = paginatedData.content.filter(
                    article => article.category === 'DOCTOR_ARTICLE' &&
                        article.doctorCategory === selectedCategory
                );

                // Implement manual pagination
                const startIndex = pageNumber * 10;
                const endIndex = startIndex + 10;
                const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

                const transformedArticles = paginatedArticles.map(transformArticleData);
                console.log(`Found ${filteredArticles.length} articles in ${selectedCategory} category`);

                setArticles(transformedArticles);
                setTotalPages(Math.ceil(filteredArticles.length / 10));
            } else {
                console.error("API returned error for category:", response.data);
                toast.error(response.data?.message || 'Failed to load category articles');
                setArticles([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching category articles:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            toast.error('Failed to load category articles');
            setArticles([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

// Update fetchUserArticles with the same fix
    const fetchUserArticles = async () => {
        try {
            setUserLoading(true);
            const url = `/api/v1/blog/user?page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`;

            console.log("Fetching user articles with URL:", url);
            const response = await api.get<ApiResponse>(url);

            if (response.data?.code === 'XS0001') {
                // Check if data is nested in body
                let paginatedData = response.data.data;

                // Handle nested response structure
                if (paginatedData.body) {
                    paginatedData = paginatedData.body.data || paginatedData.body;
                }

                if (!paginatedData || !paginatedData.content) {
                    console.error("Invalid response structure for user articles:", paginatedData);
                    setUserArticles([]);
                    setTotalPages(0);
                    return;
                }

                // Filter to only include the user's doctor articles
                const doctorArticles = paginatedData.content.filter(
                    article => article.category === 'DOCTOR_ARTICLE' && article.doctorCategory
                );

                const transformedArticles = doctorArticles.map(transformArticleData);
                console.log("User's doctor articles:", transformedArticles);

                setUserArticles(transformedArticles);
                setTotalPages(paginatedData.totalPages || 1);
            } else {
                console.error("API returned error for user articles:", response.data);
                toast.error(response.data?.message || 'Failed to load your articles');
                setUserArticles([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching user articles:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            toast.error('Failed to load your articles');
            setUserArticles([]);
            setTotalPages(0);
        } finally {
            setUserLoading(false);
        }
    };

    const handleArticleClick = (articleId: number) => {
        console.log(`Navigating to article with ID: ${articleId}`);
        navigate(`/community/doctors/article/${articleId}`);
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSearchQuery(searchInputValue);
        setSelectedCategory(null);
        setPageNumber(0);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchInputValue('');
        setPageNumber(0);
    };

    const handleLike = async (articleId: number, event: React.MouseEvent) => {
        event.stopPropagation();

        if (!profileComplete) {
            toast.error('Please complete your profile to like articles');
            return;
        }

        try {
            console.log(`Liking article with ID: ${articleId}`);
            const response = await api.post(`/api/v1/like/create/blogs/${articleId}/like`);
            console.log("Like API response:", response.data);

            // Update state optimistically
            if (activeTab === 'all') {
                setArticles(prevArticles =>
                    prevArticles.map(article =>
                        article.id === articleId
                            ? {
                                ...article,
                                liked: !article.liked,
                                likeCount: article.liked ? Math.max(0, article.likeCount - 1) : article.likeCount + 1
                            }
                            : article
                    )
                );
            } else {
                setUserArticles(prevArticles =>
                    prevArticles.map(article =>
                        article.id === articleId
                            ? {
                                ...article,
                                liked: !article.liked,
                                likeCount: article.liked ? Math.max(0, article.likeCount - 1) : article.likeCount + 1
                            }
                            : article
                    )
                );
            }

            console.log("Article like state updated");
        } catch (error) {
            console.error('Error toggling like:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            toast.error('Failed to like article');
        }
    };

    const handleDeleteArticle = async (articleId: number, event: React.MouseEvent) => {
        event.stopPropagation();

        if (!confirm('Are you sure you want to delete this article?')) return;

        try {
            console.log(`Deleting article with ID: ${articleId}`);
            const response = await api.delete(`/api/v1/blog/${articleId}`);
            console.log("Delete API response:", response.data);

            if (response.data?.code === 'XS0001') {
                toast.success('Article deleted successfully');

                // Update state by removing the deleted article
                if (activeTab === 'all') {
                    setArticles(prevArticles => prevArticles.filter(article => article.id !== articleId));
                } else {
                    setUserArticles(prevArticles => prevArticles.filter(article => article.id !== articleId));
                }

                console.log("Article removed from state");
            } else {
                console.error("API returned error for delete:", response.data);
                toast.error(response.data?.message || 'Failed to delete article');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            toast.error('Failed to delete article');
        }
    };

    const handleShare = (articleId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        const shareUrl = `${window.location.origin}/community/doctors/article/${articleId}`;

        if (navigator.share) {
            navigator.share({
                title: 'Check out this article',
                url: shareUrl
            })
                .then(() => console.log('Successfully shared'))
                .catch((error) => console.log('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support Share API
            navigator.clipboard.writeText(shareUrl)
                .then(() => toast.success('Link copied to clipboard!'))
                .catch(() => toast.error('Failed to copy link'));
        }
    };

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const getExcerpt = (content: string, maxLength: number = 150): string => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    const currentArticles = activeTab === 'all' ? articles : userArticles;
    const isCurrentLoading = activeTab === 'all' ? loading : userLoading;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Hero Section with Animation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white"
            >
                <div className="absolute inset-0 bg-black opacity-10"></div>

                {/* Professional Animated Background Pattern */}
                <div className="absolute inset-0">
                    {[...Array(5)].map((_, i) => (
                        <FloatingAnimation key={i} delay={i * 0.5}>
                            <div
                                className="absolute w-96 h-96 opacity-10"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)`,
                                }}
                            />
                        </FloatingAnimation>
                    ))}
                </div>

                <div className="relative container mx-auto px-4 py-16">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
                            <Stethoscope className="w-10 h-10" />
                            Medical Knowledge Hub
                        </h1>
                        <p className="text-lg mb-8 text-blue-100">
                            Professional medical insights and research articles from verified healthcare experts
                        </p>

                        {isDoctor && profileComplete && (
                            <Link
                                to="/community/doctors/create"
                                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105"
                            >
                                <Type className="w-5 h-5" />
                                Write Medical Article
                            </Link>
                        )}
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                            >
                                <StatCard {...stat} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Professional Wave SVG */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" className="w-full h-20">
                        <path fill="#ffffff" d="M0,96L48,85.3C96,75,192,53,288,64C384,75,480,117,576,117.3C672,117,768,75,864,58.7C960,43,1056,53,1152,69.3C1248,85,1344,107,1392,117.3L1440,128L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                    </svg>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => {
                                setActiveTab('all');
                                setPageNumber(0);
                            }}
                            className={`flex-1 py-4 px-6 text-center font-medium ${
                                activeTab === 'all'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            All Articles
                        </button>
                        {isDoctor && (
                            <button
                                onClick={() => {
                                    setActiveTab('mine');
                                    setSelectedCategory(null);
                                    setSearchQuery('');
                                    setSearchInputValue('');
                                    setPageNumber(0);
                                }}
                                className={`flex-1 py-4 px-6 text-center font-medium ${
                                    activeTab === 'mine'
                                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                                        : 'text-gray-600 hover:text-indigo-600'
                                }`}
                            >
                                My Articles
                            </button>
                        )}
                    </div>

                    {/* Search and Filters (only show in All Articles tab) */}
                    {activeTab === 'all' && (
                        <div className="p-4">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search medical articles..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={searchInputValue}
                                        onChange={(e) => setSearchInputValue(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Search
                                </button>
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>

                            {/* Category Filter */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        setSearchQuery('');
                                        setSearchInputValue('');
                                        setPageNumber(0);
                                    }}
                                    className={`px-4 py-2 rounded-full transition-all ${
                                        !selectedCategory
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    All Specialties
                                </button>
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    return (
                                        <motion.button
                                            key={category.value}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setSelectedCategory(category.value);
                                                setSearchQuery('');
                                                setSearchInputValue('');
                                                setPageNumber(0);
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                                selectedCategory === category.value
                                                    ? category.color
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {category.label}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Articles Grid - Professional Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Expert Contributors */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 sticky top-24"
                        >
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-indigo-600" />
                                Top Contributors
                            </h3>
                            <div className="space-y-4">
                                {['Dr. Emily Roberts', 'Dr. Michael Chen', 'Dr. Sarah Kim', 'Dr. James Wilson'].map((doctor, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                            {doctor.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{doctor}</p>
                                            <p className="text-xs text-gray-500">15 articles</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Articles - 3 Column Grid */}
                    <div className="lg:col-span-3">
                        {isCurrentLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : currentArticles.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title={
                                    searchQuery
                                        ? `No results matching "${searchQuery}"`
                                        : selectedCategory
                                            ? `No articles in the ${categories.find(c => c.value === selectedCategory)?.label} category`
                                            : activeTab === 'mine'
                                                ? "You haven't created any articles yet"
                                                : 'No articles found'
                                }
                                message={
                                    activeTab === 'mine'
                                        ? 'Start sharing your medical knowledge with the community'
                                        : 'Check back later for new medical articles'
                                }
                                actionText={isDoctor && profileComplete && activeTab === 'mine' ? 'Write Article' : undefined}
                                actionLink={isDoctor && profileComplete && activeTab === 'mine' ? '/community/doctors/create' : undefined}
                                disabled={!profileComplete || !isDoctor}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {currentArticles.map((article, index) => {
                                    const categoryDetails = getCategoryDetails(article.doctorCategory);
                                    const CategoryIcon = categoryDetails.icon;

                                    return (
                                        <motion.div
                                            key={article.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                                            onClick={() => handleArticleClick(article.id)}
                                        >
                                            {article.media && (
                                                <div className="h-40 overflow-hidden">
                                                    <img
                                                        src={article.media}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.onerror = null;
                                                            target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${categoryDetails.color} text-xs`}>
                                                        <CategoryIcon className="w-3 h-3" />
                                                        <span className="font-medium">{categoryDetails.label}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">{article.readTime}</span>
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                    {article.title}
                                                </h3>

                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                                                        {article.user?.firstName?.[0]}{article.user?.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            <h4 className="font-medium text-gray-900 text-sm">{article.user?.firstName} {article.user?.lastName}</h4>
                                                            {article.user?.verified && (
                                                                <Shield className="w-3 h-3 text-blue-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">{article.user?.specialty}</p>
                                                    </div>
                                                </div>

                                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                    {getExcerpt(article.content)}
                                                </p>

                                                <div className="flex items-center justify-between pt-3 border-t">
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <button
                                                            className={`flex items-center gap-1 ${
                                                                article.liked ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
                                                            } transition-colors`}
                                                            onClick={(e) => handleLike(article.id, e)}
                                                            disabled={!profileComplete}
                                                        >
                                                            {article.liked ? (
                                                                <ThumbsUp size={16} fill="currentColor" />
                                                            ) : (
                                                                <ThumbsUp size={16} />
                                                            )}
                                                            <span>{article.likeCount}</span>
                                                        </button>
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                           <Eye className="w-4 h-4" />
                                                            {article.viewCount}
                                                       </span>
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                           <MessageCircle className="w-4 h-4" />
                                                            {article.commentCount}
                                                       </span>
                                                    </div>

                                                    <button
                                                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Read More
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {article.isOwner && (
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                                        <Link
                                                            to={`/community/doctors/edit/${article.id}`}
                                                            className="flex-1 text-center py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Edit className="w-4 h-4 inline mr-1" />
                                                            Edit
                                                        </Link>
                                                        <button
                                                            className="flex-1 text-center py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            onClick={(e) => handleDeleteArticle(article.id, e)}
                                                        >
                                                            <Trash2 className="w-4 h-4 inline mr-1" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}

                                                {activeTab === 'all' && (
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                                        <button
                                                            className="flex-1 text-center py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                                            onClick={(e) => handleShare(article.id, e)}
                                                        >
                                                            <Share2 className="w-4 h-4 inline mr-1" />
                                                            Share
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-8 gap-2">
                                <button
                                    disabled={pageNumber === 0}
                                    onClick={() => setPageNumber(Math.max(0, pageNumber - 1))}
                                    className="px-4 py-2 rounded-lg bg-white shadow-sm text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center px-4">
                                   <span className="font-medium">
                                       Page {pageNumber + 1} of {totalPages}
                                   </span>
                                </div>
                                <button
                                    disabled={pageNumber >= totalPages - 1}
                                    onClick={() => setPageNumber(Math.min(totalPages - 1, pageNumber + 1))}
                                    className="px-4 py-2 rounded-lg bg-white shadow-sm text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}