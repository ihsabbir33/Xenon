/*
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Clock, Eye, MessageSquare, ThumbsUp, Bookmark, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';

enum PostCategory {
  MEDICAL_TIPS = 'MEDICAL_TIPS',
  BLOOD_REQUEST = 'BLOOD_REQUEST',
  QUESTION = 'QUESTION',
  NEWS = 'NEWS',
  NEED_HELP = 'NEED_HELP',
  DOCTOR_ARTICLE = 'DOCTOR_ARTICLE'
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  category: PostCategory;
  media?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  commentCount: number;
  likeCount: number;
  liked: boolean;
}

interface PaginatedResponse {
  content: BlogPost[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export function UserCommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    checkUserProfile();
  }, []);

  useEffect(() => {
    if (profileComplete) {
      if (selectedCategory) {
        fetchPostsByCategory();
      } else if (searchTerm) {
        fetchPostsBySearch();
      } else {
        fetchPosts();
      }
    }
  }, [pageNumber, selectedCategory, searchTerm, profileComplete]);

  const checkUserProfile = async () => {
    try {
      const { data } = await api.get('/api/v1/user');
      setUserProfile(data?.data);
      // Check if profile is complete - verify required fields are present
      const isComplete = data?.data &&
          data.data.fname &&
          data.data.lname &&
          data.data.upazila;

      setProfileComplete(!!isComplete);

      if (!isComplete) {
        toast.error('Please complete your profile to access the community features');
      }
    } catch (err) {
      console.error('Failed to fetch user profile', err);
      toast.error('Unable to verify your profile. Please try again later.');
      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/v1/blog?page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`);
      if (data?.data) {
        const paginatedData: PaginatedResponse = data.data;
        setPosts(paginatedData.content);
        setTotalPages(paginatedData.totalPages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsByCategory = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/v1/blog/category/${selectedCategory}?page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`);
      if (data?.data) {
        const paginatedData: PaginatedResponse = data.data;
        setPosts(paginatedData.content);
        setTotalPages(paginatedData.totalPages);
      }
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      toast.error('Failed to load posts for this category');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsBySearch = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/v1/blog/search?query=${searchTerm}&page=${pageNumber}&size=10&sortBy=createdAt&direction=desc`);
      if (data?.data) {
        const paginatedData: PaginatedResponse = data.data;
        setPosts(paginatedData.content);
        setTotalPages(paginatedData.totalPages);
      }
    } catch (error) {
      console.error('Error searching posts:', error);
      toast.error('Failed to search posts');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (postId: number) => {
    try {
      await api.post(`/api/v1/blog/view/${postId}`);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handlePostClick = (postId: number) => {
    incrementViewCount(postId);
    navigate(`/community/users/post/${postId}`);
  };

  const toggleLike = async (postId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigating to post detail
    try {
      await api.post(`/api/v1/like/create/blogs/${postId}/like`);
      // Update local state to reflect the like
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked: !post.liked,
            likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like post');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPageNumber(0);
    if (searchTerm.trim()) {
      fetchPostsBySearch();
    } else {
      fetchPosts();
    }
  };

  const selectCategory = (category: string | null) => {
    setSelectedCategory(category);
    setPageNumber(0);
    setShowCategoryFilter(false);
  };

  const getCategoryLabel = (category: PostCategory): string => {
    const labels: Record<PostCategory, string> = {
      [PostCategory.MEDICAL_TIPS]: 'Medical Tips',
      [PostCategory.BLOOD_REQUEST]: 'Blood Request',
      [PostCategory.QUESTION]: 'Question',
      [PostCategory.NEWS]: 'News',
      [PostCategory.NEED_HELP]: 'Need Help',
      [PostCategory.DOCTOR_ARTICLE]: 'Doctor Article'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: PostCategory): string => {
    const colors: Record<PostCategory, string> = {
      [PostCategory.MEDICAL_TIPS]: 'bg-green-100 text-green-700',
      [PostCategory.BLOOD_REQUEST]: 'bg-red-100 text-red-700',
      [PostCategory.QUESTION]: 'bg-purple-100 text-purple-700',
      [PostCategory.NEWS]: 'bg-blue-100 text-blue-700',
      [PostCategory.NEED_HELP]: 'bg-amber-100 text-amber-700',
      [PostCategory.DOCTOR_ARTICLE]: 'bg-cyan-100 text-cyan-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
              <p className="text-gray-600 mt-1">Connect with others, share experiences, and find support</p>
            </div>

            {profileComplete ? (
                <Link
                    to="/community/users/create"
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors"
                >
                  <Plus size={18} />
                  Create Post
                </Link>
            ) : (
                <button
                    onClick={() => toast.error('Please complete your profile to create posts')}
                    className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-full cursor-not-allowed"
                >
                  <Plus size={18} />
                  Create Post
                </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/!* Left sidebar - categories *!/}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24">
                <div className="p-4 bg-blue-500 text-white">
                  <h2 className="font-semibold">Categories</h2>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    <li>
                      <button
                          onClick={() => selectCategory(null)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                      >
                        All Posts
                      </button>
                    </li>
                    {Object.values(PostCategory).map(category => (
                        <li key={category}>
                          <button
                              onClick={() => selectCategory(category)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === category ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                          >
                            {getCategoryLabel(category)}
                          </button>
                        </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/!* Main content - posts *!/}
            <div className="lg:col-span-9 order-1 lg:order-2">
              {/!* Search and filters *!/}
              <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search community posts..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Search
                  </button>
                </form>

                {/!* Mobile category filter *!/}
                <div className="relative mt-4 lg:hidden">
                  <button
                      onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg"
                  >
                    <span>{selectedCategory ? getCategoryLabel(selectedCategory as PostCategory) : 'All Categories'}</span>
                    <ChevronDown size={18} className={`transform transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`} />
                  </button>

                  {showCategoryFilter && (
                      <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="max-h-60 overflow-y-auto p-2">
                          <button
                              onClick={() => selectCategory(null)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                          >
                            All Posts
                          </button>
                          {Object.values(PostCategory).map(category => (
                              <button
                                  key={category}
                                  onClick={() => selectCategory(category)}
                                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === category ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                              >
                                {getCategoryLabel(category)}
                              </button>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
              </div>

              {/!* Posts list *!/}
              {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
              ) : posts.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <Search size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm
                          ? `No results matching "${searchTerm}"`
                          : selectedCategory
                              ? `No posts in the ${getCategoryLabel(selectedCategory as PostCategory)} category`
                              : 'Be the first to create a post in our community!'}
                    </p>
                    {profileComplete && (
                        <Link
                            to="/community/users/create"
                            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors"
                        >
                          <Plus size={18} />
                          Create Post
                        </Link>
                    )}
                  </div>
              ) : (
                  <div className="space-y-6">
                    {posts.map(post => (
                        <div
                            key={post.id}
                            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handlePostClick(post.id)}
                        >
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {post.user.profileImage ? (
                                      <img
                                          src={post.user.profileImage}
                                          alt={`${post.user.firstName} ${post.user.lastName}`}
                                          className="w-full h-full object-cover"
                                      />
                                  ) : (
                                      <span className="text-blue-500 font-semibold">
                                {post.user.firstName?.[0]}{post.user.lastName?.[0]}
                              </span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold">{post.user.firstName} {post.user.lastName}</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock size={14} />
                                    <span>{formatDate(post.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </span>
                            </div>

                            <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
                            <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>

                            {post.media && (
                                <div className="mb-4">
                                  <img
                                      src={post.media}
                                      alt={post.title}
                                      className="w-full h-64 object-cover rounded-lg"
                                  />
                                </div>
                            )}

                            <div className="flex items-center gap-6 text-gray-500">
                              <button
                                  className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${post.liked ? 'text-blue-500' : ''}`}
                                  onClick={(e) => toggleLike(post.id, e)}
                              >
                                <ThumbsUp size={18} fill={post.liked ? 'currentColor' : 'none'} />
                                <span>{post.likeCount || 0}</span>
                              </button>
                              <div className="flex items-center gap-1">
                                <MessageSquare size={18} />
                                <span>{post.commentCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye size={18} />
                                <span>{post.viewCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
              )}

              {/!* Pagination *!/}
              {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-8 gap-2">
                    <button
                        disabled={pageNumber === 0}
                        onClick={() => setPageNumber(prev => Math.max(0, prev - 1))}
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
                        onClick={() => setPageNumber(prev => Math.min(totalPages - 1, prev + 1))}
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
}*/
