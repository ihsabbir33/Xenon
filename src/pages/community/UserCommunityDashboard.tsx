import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, ThumbsUp, MessageCircle, Eye, Clock, User, Trash2, Edit, Share2,
    Heart, Stethoscope, TrendingUp, Users, ChevronRight } from 'lucide-react';
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

interface BlogResponse {
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
    content: BlogResponse[];
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
}

interface Post {
    id: number;
    title: string;
    content: string;
    category: string;
    media: string | null;
    createdAt: string;
    updatedAt: string;
    user: User;
    commentCount: number;
    likeCount: number;
    viewCount: number;
    liked: boolean;
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

export function UserCommunityDashboard() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
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

    // New styled categories
    const categories: CategoryOption[] = [
        { value: 'MEDICAL_TIPS', label: 'Health Tips', color: 'bg-emerald-100 text-emerald-700', icon: Heart },
        { value: 'BLOOD_REQUEST', label: 'Blood Request', color: 'bg-red-100 text-red-700', icon: Stethoscope },
        { value: 'QUESTION', label: 'Question', color: 'bg-purple-100 text-purple-700', icon: MessageCircle },
        { value: 'NEWS', label: 'News', color: 'bg-blue-100 text-blue-700', icon: TrendingUp },
        { value: 'NEED_HELP', label: 'Need Help', color: 'bg-amber-100 text-amber-700', icon: Users }
    ];

    const stats = [
        { icon: Users, value: '12.5k', label: 'Active Members', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
        { icon: MessageCircle, value: '3.2k', label: 'Discussions', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
        { icon: Heart, value: '8.9k', label: 'Lives Touched', bgColor: 'bg-red-50', textColor: 'text-red-600' }
    ];

    // Check user profile
    useEffect(() => {
        const checkUserProfile = async () => {
            try {
                const { data } = await api.get('/api/v1/user');

                if (data?.code === 'XS0001') {
                    const userData = data.data;
                    setUserProfile(userData);

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

    // Fetch posts based on active tab
    useEffect(() => {
        if (activeTab === 'all') {
            if (searchQuery) {
                fetchSearchPosts();
            } else if (selectedCategory) {
                fetchCategoryPosts();
            } else {
                fetchAllPosts();
            }
        } else {
            fetchUserPosts();
        }
    }, [activeTab, pageNumber, selectedCategory, searchQuery]);

    const transformBlogData = (blog: BlogResponse): Post => {
        const names = blog.userName ? blog.userName.split(' ') : ['User', ''];

        return {
            id: blog.blogId,
            title: blog.title || '',
            content: blog.content || '',
            category: blog.category || '',
            media: blog.media,
            createdAt: blog.createdAt || new Date().toISOString(),
            updatedAt: blog.updatedAt || new Date().toISOString(),
            user: {
                id: blog.userId || 0,
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                profileImage: null
            },
            commentCount: blog.commentCount || 0,
            likeCount: blog.likeCount || 0,
            viewCount: blog.viewCount || 0,
            liked: blog.liked === true
        };
    };

    // UserCommunityDashboard.tsx - Update the fetch functions with nested response handling

    const fetchAllPosts = async () => {
        try {
            setLoading(true);
            const url = `/api/v1/blog?page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`;

            console.log("Fetching all posts with URL:", url);
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
                    setPosts([]);
                    setTotalPages(0);
                    return;
                }

                const transformedPosts = paginatedData.content.map(transformBlogData);
                console.log("Transformed posts:", transformedPosts);
                setPosts(transformedPosts);
                setTotalPages(paginatedData.totalPages || 1);
            } else {
                toast.error(response.data?.message || 'Failed to load posts');
                setPosts([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching all posts:', error);
            toast.error('Failed to load posts');
            setPosts([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryPosts = async () => {
        if (!selectedCategory) return;

        try {
            setLoading(true);
            const url = `/api/v1/blog/category/${selectedCategory}?page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`;

            console.log("Fetching category posts with URL:", url);
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
                    setPosts([]);
                    setTotalPages(0);
                    return;
                }

                const transformedPosts = paginatedData.content.map(transformBlogData);
                setPosts(transformedPosts);
                setTotalPages(paginatedData.totalPages || 1);
            } else {
                toast.error(response.data?.message || 'Failed to load category posts');
                setPosts([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching category posts:', error);
            toast.error('Failed to load category posts');
            setPosts([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchPosts = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const url = `/api/v1/blog/search?query=${encodeURIComponent(searchQuery)}&page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`;

            console.log("Searching posts with URL:", url);
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
                    setPosts([]);
                    setTotalPages(0);
                    return;
                }

                const transformedPosts = paginatedData.content.map(transformBlogData);
                setPosts(transformedPosts);
                setTotalPages(paginatedData.totalPages || 1);
            } else {
                toast.error(response.data?.message || 'Failed to search posts');
                setPosts([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error searching posts:', error);
            toast.error('Failed to search posts');
            setPosts([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        try {
            setUserLoading(true);
            const url = `/api/v1/blog/user?page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`;

            console.log("Fetching user posts with URL:", url);
            const response = await api.get<ApiResponse>(url);

            if (response.data?.code === 'XS0001') {
                // Check if data is nested in body
                let paginatedData = response.data.data;

                // Handle nested response structure
                if (paginatedData.body) {
                    paginatedData = paginatedData.body.data || paginatedData.body;
                }

                if (!paginatedData || !paginatedData.content) {
                    console.error("Invalid response structure for user posts:", paginatedData);
                    setUserPosts([]);
                    setTotalPages(0);
                    return;
                }

                const transformedPosts = paginatedData.content.map(transformBlogData);
                setUserPosts(transformedPosts);
                setTotalPages(paginatedData.totalPages || 1);
            } else {
                toast.error(response.data?.message || 'Failed to load your posts');
                setUserPosts([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching user posts:', error);
            toast.error('Failed to load your posts');
            setUserPosts([]);
            setTotalPages(0);
        } finally {
            setUserLoading(false);
        }
    };

    const handlePostClick = (postId: number) => {
        console.log(`Navigating to post with ID: ${postId}`);
        navigate(`/community/users/post/${postId}`);
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

    const handleLike = async (postId: number, event: React.MouseEvent) => {
        event.stopPropagation();

        if (!profileComplete) {
            toast.error('Please complete your profile to like posts');
            return;
        }

        try {
            console.log(`Liking post with ID: ${postId}`);
            await api.post(`/api/v1/like/create/blogs/${postId}/like`);
            console.log("Like API call successful");

            // Update state optimistically
            if (activeTab === 'all') {
                setPosts(prevPosts =>
                    prevPosts.map(post =>
                        post.id === postId
                            ? {
                                ...post,
                                liked: !post.liked,
                                likeCount: post.liked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1
                            }
                            : post
                    )
                );
            } else {
                setUserPosts(prevPosts =>
                    prevPosts.map(post =>
                        post.id === postId
                            ? {
                                ...post,
                                liked: !post.liked,
                                likeCount: post.liked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1
                            }
                            : post
                    )
                );
            }

            console.log("Post like state updated");
        } catch (error) {
            console.error('Error toggling like:', error);
            toast.error('Failed to like post');
        }
    };

    const handleDeletePost = async (postId: number, event: React.MouseEvent) => {
        event.stopPropagation();

        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            console.log(`Deleting post with ID: ${postId}`);
            const response = await api.delete(`/api/v1/blog/${postId}`);

            if (response.data?.code === 'XS0001') {
                toast.success('Post deleted successfully');

                // Update state by removing the deleted post
                if (activeTab === 'all') {
                    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                } else {
                    setUserPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                }

                console.log("Post removed from state");
            } else {
                toast.error(response.data?.message || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
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

    const getCategoryDetails = (categoryValue: string) => {
        return categories.find(cat => cat.value === categoryValue) || categories[0];
    };

    const currentPosts = activeTab === 'all' ? posts : userPosts;
    const isCurrentLoading = activeTab === 'all' ? loading : userLoading;

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
            {/* Hero Section with Animation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-red-500 to-purple-600 text-white"
            >
                <div className="absolute inset-0 bg-black opacity-20"></div>

                {/* Animated Background Shapes */}
                <FloatingAnimation delay={0}>
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"></div>
                </FloatingAnimation>
                <FloatingAnimation delay={1}>
                    <div className="absolute top-40 right-20 w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm"></div>
                </FloatingAnimation>
                <FloatingAnimation delay={2}>
                    <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"></div>
                </FloatingAnimation>

                <div className="relative container mx-auto px-4 py-16">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
                            <Users className="w-10 h-10" />
                            Community Health Forum
                        </h1>
                        <p className="text-lg mb-8 text-pink-100">
                            Connect, share experiences, and support each other in your health journey
                        </p>

                        {profileComplete ? (
                            <Link
                                to="/community/users/create"
                                className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-pink-50 transition-all transform hover:scale-105"
                            >
                                <Plus size={18} />
                                Start a Discussion
                            </Link>
                        ) : (
                            <button
                                onClick={() => toast.error('Please complete your profile to create posts')}
                                className="inline-flex items-center gap-2 bg-white/80 text-purple-600 px-6 py-3 rounded-full font-semibold cursor-not-allowed opacity-75"
                            >
                                <Plus size={18} />
                                Start a Discussion
                            </button>
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

                {/* Wave Decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" className="w-full h-20">
                        <path fill="#ffffff" d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,85.3C672,75,768,53,864,48C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
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
                                    ? 'text-purple-600 border-b-2 border-purple-600'
                                    : 'text-gray-600 hover:text-purple-600'
                            }`}
                        >
                            All Posts
                        </button>
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
                                    ? 'text-purple-600 border-b-2 border-purple-600'
                                    : 'text-gray-600 hover:text-purple-600'
                            }`}
                        >
                            My Posts
                        </button>
                    </div>

                    {/* Search and Filters (only show in All Posts tab) */}
                    {activeTab === 'all' && (
                        <div className="p-4">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search community posts..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-purple-500 focus:border-purple-500"
                                        value={searchInputValue}
                                        onChange={(e) => setSearchInputValue(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
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
                                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    All Topics
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

                {/* Posts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar - Featured */}
                    <div className="lg:col-span-1 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 sticky top-24"
                        >
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                Trending Topics
                            </h3>
                            <div className="space-y-3">
                                {categories.map((category) => (
                                    <button
                                        key={category.value}
                                        onClick={() => {
                                            setSelectedCategory(category.value);
                                            setSearchQuery('');
                                            setSearchInputValue('');
                                            setPageNumber(0);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                            selectedCategory === category.value
                                                ? 'bg-purple-50 text-purple-700'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <category.icon className="w-4 h-4" />
                                        {category.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Posts */}
                    <div className="lg:col-span-2 order-1 lg:order-2">
                        {isCurrentLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                            </div>
                        ) : currentPosts.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title={
                                    searchQuery
                                        ? `No results matching "${searchQuery}"`
                                        : selectedCategory
                                            ? `No posts in the ${categories.find(c => c.value === selectedCategory)?.label} category`
                                            : activeTab === 'mine'
                                                ? "You haven't created any posts yet"
                                                : 'No posts found'
                                }
                                message={
                                    activeTab === 'mine'
                                        ? 'Start sharing with the community by creating your first post'
                                        : 'Be the first to create a post in our community!'
                                }
                                actionText={profileComplete ? 'Create Post' : undefined}
                                actionLink={profileComplete ? '/community/users/create' : undefined}
                                disabled={!profileComplete}
                            />
                        ) : (
                            <div className="space-y-6">
                                {currentPosts.map((post, index) => {
                                    const categoryDetails = getCategoryDetails(post.category);
                                    const CategoryIcon = categoryDetails.icon;

                                    return (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                                            onClick={() => handlePostClick(post.id)}
                                        >
                                            {post.media && (
                                                <div className="h-48 overflow-hidden">
                                                    <img
                                                        src={post.media}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.onerror = null;
                                                            target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold">
                                                            {post.user?.firstName?.[0]}{post.user?.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{post.user?.firstName} {post.user?.lastName}</h4>
                                                            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                                                        </div>
                                                    </div>

                                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${categoryDetails.color}`}>
                                                        <CategoryIcon className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{categoryDetails.label}</span>
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                                                    {post.title}
                                                </h3>
                                                <p className="text-gray-600 mb-4 line-clamp-2">
                                                    {post.content}
                                                </p>

                                                <div className="flex items-center justify-between pt-4 border-t">
                                                    <div className="flex items-center gap-6">
                                                        <button
                                                            className={`flex items-center gap-1 transition-colors ${
                                                                post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                                                            }`}
                                                            onClick={(e) => handleLike(post.id, e)}
                                                            disabled={!profileComplete}
                                                        >
                                                            {post.liked ? (
                                                                <ThumbsUp size={18} fill="currentColor" />
                                                            ) : (
                                                                <ThumbsUp size={18} />
                                                            )}
                                                            <span>{post.likeCount || 0}</span>
                                                        </button>
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <MessageCircle size={18} />
                                                            <span>{post.commentCount || 0}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <Eye size={18} />
                                                            <span>{post.viewCount || 0}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {activeTab === 'mine' && (
                                                            <>
                                                                <Link
                                                                    to={`/community/users/edit/${post.id}`}
                                                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Edit className="w-4 h-4 text-gray-500" />
                                                                </Link>
                                                                <button
                                                                    className="p-2 hover:bg-red-50 rounded-full transition-colors"
                                                                    onClick={(e) => handleDeletePost(post.id, e)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                            <Share2 className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                </div>
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
                                    className="px-4 py-2 rounded-lg bg-white shadow-sm text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                                    className="px-4 py-2 rounded-lg bg-white shadow-sm text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
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