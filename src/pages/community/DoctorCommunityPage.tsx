import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Bookmark, Heart, MessageCircle, MoreVertical, Share2, Trash2, Edit, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Article {
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
  createdAt: string;
  updatedAt: string;
  commentResponseLists?: {
    id: number;
    userId: number;
    userName: string;
    content: string;
    createdAt: string;
  }[];
}

interface PaginatedResponse {
  content: Article[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export function DoctorCommunityPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserRole();
    fetchArticles();
  }, [currentPage]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await api.get('/api/v1/user');
      if (data?.code === 'XS0001') {
        setUserRole(data.data.role);
        setUserId(data.data.id);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching articles page ${currentPage}`);
      const { data } = await api.get(
          `/api/v1/doctor/articles?page=${currentPage}&size=10&sortBy=createdAt&direction=desc`
      );

      console.log('API Response:', data);

      if (data?.code === 'XS0001') {
        // Extract paginated data, handling both possible response structures
        let responseData;
        if (data.data.body && data.data.body.data) {
          // Nested structure
          responseData = data.data.body.data;
        } else {
          // Direct structure
          responseData = data.data;
        }

        console.log('Extracted data:', responseData);

        // Set articles and pagination info
        setArticles(responseData.content || []);
        setTotalPages(responseData.totalPages || 0);
        setCurrentPage(responseData.pageNumber || 0);
      } else {
        setError('Failed to fetch articles');
        console.error('API returned error:', data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to fetch articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchArticles();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Searching for: ${searchQuery}`);
      const { data } = await api.get(
          `/api/v1/doctor/articles/search?query=${encodeURIComponent(searchQuery)}&page=0&size=10&sortBy=createdAt&direction=desc`
      );

      if (data?.code === 'XS0001') {
        console.log('Search results:', data.data);
        setArticles(data.data.content || []);
        setTotalPages(data.data.totalPages || 0);
        setCurrentPage(0);
      } else {
        setError('Failed to search articles');
        console.error('Search API returned error:', data);
      }
    } catch (error) {
      console.error('Error searching articles:', error);
      setError('Failed to search articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (blogId: number) => {
    try {
      const { data } = await api.post(`/api/v1/like/create/blogs/${blogId}/like`);

      if (data?.code === 'XS0001') {
        // Update like count in the UI
        setArticles(prevArticles =>
            prevArticles.map(article =>
                article.blogId === blogId
                    ? { ...article, likeCount: data.data.likeCount }
                    : article
            )
        );
        toast.success('Article liked!');
      } else {
        toast.error(data?.message || 'Failed to like the article');
      }
    } catch (error) {
      console.error('Error liking article:', error);
      toast.error('Failed to like the article. Please try again.');
    }
  };

  const handleDelete = async (blogId: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { data } = await api.delete(`/api/v1/doctor/articles/${blogId}`);

      if (data?.code === 'XS0001') {
        // Remove article from the UI
        setArticles(prevArticles => prevArticles.filter(article => article.blogId !== blogId));
        toast.success('Article deleted successfully!');
      } else {
        toast.error(data?.message || 'Failed to delete the article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete the article. Please try again.');
    }
  };

  const handleShare = (blogId: number) => {
    const url = `${window.location.origin}/community/doctors/article/${blogId}`;
    navigator.clipboard.writeText(url);
    toast.success('Article link copied to clipboard!');
  };

  return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Medical Articles</h1>

              {userRole === 'DOCTOR' && (
                  <Link
                      to="/community/doctors/create"
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Write Article
                  </Link>
              )}
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                    onClick={handleSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                  {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : articles.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery ? 'No articles match your search criteria.' : 'There are no articles published yet.'}
                  </p>
                  {userRole === 'DOCTOR' && (
                      <Link
                          to="/community/doctors/create"
                          className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors"
                      >
                        Write the first article
                      </Link>
                  )}
                </div>
            ) : (
                <>
                  {/* Debug Info - Remove in production */}
                  <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                    <p>Articles found: {articles.length}</p>
                    <p>Current page: {currentPage + 1}</p>
                    <p>Total pages: {totalPages}</p>
                  </div>

                  {/* Articles List */}
                  <div className="space-y-8">
                    {articles.map((article) => (
                        <div key={article.blogId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                          {article.media && (
                              <img
                                  src={article.media}
                                  alt={article.title}
                                  className="w-full h-64 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1350&q=80';
                                  }}
                              />
                          )}

                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold flex items-center">
                                  {article.userName}
                                  {article.userRole === 'DOCTOR' && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Doctor</span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-500">{new Date(article.createdAt).toLocaleDateString()}</p>
                              </div>
                              {userId === article.userId && (
                                  <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate(`/community/doctors/edit/${article.blogId}`)}
                                        className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(article.blogId)}
                                        className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                              )}
                            </div>

                            <Link to={`/community/doctors/article/${article.blogId}`}>
                              <h2 className="text-2xl font-bold mb-3 hover:text-blue-600 transition-colors">
                                {article.title}
                              </h2>
                            </Link>

                            <p className="text-gray-700 mb-4 line-clamp-3">{article.content}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                          {article.category.replace('_', ' ')}
                        </span>
                              {article.doctorCategory && (
                                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
                            {article.doctorCategory}
                          </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-gray-500 border-t pt-4">
                              <div className="flex items-center gap-6">
                                <button
                                    onClick={() => handleLike(article.blogId)}
                                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                                >
                                  <Heart size={20} />
                                  <span>{article.likeCount}</span>
                                </button>
                                <Link
                                    to={`/community/doctors/article/${article.blogId}`}
                                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                >
                                  <MessageCircle size={20} />
                                  <span>{article.commentCount}</span>
                                </Link>
                                <button
                                    onClick={() => handleShare(article.blogId)}
                                    className="flex items-center gap-1 hover:text-green-500 transition-colors"
                                >
                                  <Share2 size={20} />
                                  <span>Share</span>
                                </button>
                              </div>
                              <Link
                                  to={`/community/doctors/article/${article.blogId}`}
                                  className="text-blue-600 hover:text-blue-700"
                              >
                                Read more →
                              </Link>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                      <div className="flex justify-center mt-10">
                        <div className="flex space-x-2">
                          <button
                              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                              disabled={currentPage === 0}
                              className="px-4 py-2 rounded-md bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {Array.from({ length: totalPages }).map((_, index) => (
                              <button
                                  key={index}
                                  onClick={() => setCurrentPage(index)}
                                  className={`px-4 py-2 rounded-md ${
                                      currentPage === index
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-white border border-gray-300'
                                  }`}
                              >
                                {index + 1}
                              </button>
                          ))}
                          <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                              disabled={currentPage === totalPages - 1}
                              className="px-4 py-2 rounded-md bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                  )}
                </>
            )}
          </div>
        </div>
      </div>
  );
}