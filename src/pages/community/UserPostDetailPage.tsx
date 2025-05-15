/*
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageSquare, Eye, Clock, Edit, Trash2, Share2, Flag, MoreVertical, Send, User, Loader2 } from 'lucide-react';
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

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
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
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  comments: Comment[];
  likeCount: number;
  liked: boolean;
  isOwner: boolean;
}

export function UserPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchPost();
    fetchCurrentUser();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get('/api/v1/user');
      if (data?.data?.id) {
        setCurrentUserId(data.data.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/v1/blog/${id}`);
      if (data?.data) {
        setPost(data.data);

        // Check if user is post owner
        const { data: userData } = await api.get('/api/v1/user');
        if (userData?.data?.id === data.data.user.id) {
          setPost(prev => prev ? { ...prev, isOwner: true } : prev);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/community/users');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      await api.post(`/api/v1/like/create/blogs/${post.id}/like`);

      // Update local state
      setPost(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          liked: !prev.liked,
          likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1
        };
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like post');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !post) {
      return;
    }

    try {
      setSubmittingComment(true);

      const response = await api.post(`/api/v1/comment/create/${post.id}/comments`, {
        content: commentText.trim()
      });

      if (response.data?.code === 'XS0001') {
        const newComment: Comment = response.data.data;

        // Update post with new comment
        setPost(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...prev.comments, newComment]
          };
        });

        setCommentText('');
        toast.success('Comment added successfully');
      } else {
        toast.error(response.data?.message || 'Failed to add comment');
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!post) return;

    try {
      const response = await api.delete(`/api/v1/comment/comments/${commentId}`);

      if (response.data?.code === 'XS0001') {
        // Update post with comment removed
        setPost(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.filter(comment => comment.id !== commentId)
          };
        });

        toast.success('Comment deleted successfully');
      } else {
        toast.error(response.data?.message || 'Failed to delete comment');
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    try {
      setIsDeleting(true);

      const response = await api.delete(`/api/v1/blog/${post.id}`);

      if (response.data?.code === 'XS0001') {
        toast.success('Post deleted successfully');
        navigate('/community/users');
      } else {
        toast.error(response.data?.message || 'Failed to delete post');
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.message || 'Failed to delete post');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'Community Post',
        text: `Check out this post: ${post?.title}`,
        url: window.location.href
      })
          .then(() => console.log('Successfully shared'))
          .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Share API
      navigator.clipboard.writeText(window.location.href)
          .then(() => toast.success('Link copied to clipboard!'))
          .catch(() => toast.error('Failed to copy link'));
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <Loader2 size={36} className="animate-spin text-blue-500" />
        </div>
    );
  }

  if (!post) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <Link to="/community/users" className="flex items-center text-blue-500 mb-6">
              <ArrowLeft size={20} className="mr-2" />
              Back to Community
            </Link>

            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
              <p className="text-gray-600 mb-6">The post you're looking for may have been removed or doesn't exist.</p>
              <Link
                  to="/community/users"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Return to Community
              </Link>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Link to="/community/users" className="flex items-center text-blue-500 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to Community
          </Link>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {post.user.profileImage ? (
                          <img
                              src={post.user.profileImage}
                              alt={`${post.user.firstName} ${post.user.lastName}`}
                              className="w-full h-full object-cover"
                          />
                      ) : (
                          <span className="text-blue-500 font-semibold text-xl">
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

                  <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs ${getCategoryColor(post.category)}`}>
                    {getCategoryLabel(post.category)}
                  </span>

                    {post.isOwner && (
                        <div className="relative">
                          <button
                              onClick={() => setShowOptions(!showOptions)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreVertical size={20} />
                          </button>

                          {showOptions && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-10">
                                <div className="py-1">
                                  <Link
                                      to={`/community/users/edit/${post.id}`}
                                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Edit size={16} />
                                    <span>Edit Post</span>
                                  </Link>
                                  <button
                                      onClick={() => {
                                        setShowOptions(false);
                                        setShowDeleteConfirm(true);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete Post</span>
                                  </button>
                                </div>
                              </div>
                          )}
                        </div>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

                <div className="prose max-w-none mb-6">
                  {post.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>

                {post.media && (
                    <div className="mb-6">
                      <img
                          src={post.media}
                          alt={post.title}
                          className="w-full rounded-lg"
                      />
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-6 pb-4 border-b text-gray-500">
                  <button
                      className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${post.liked ? 'text-blue-500' : ''}`}
                      onClick={handleLike}
                  >
                    <ThumbsUp size={20} fill={post.liked ? 'currentColor' : 'none'} />
                    <span>{post.likeCount || 0} Likes</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={20} />
                    <span>{post.comments.length || 0} Comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={20} />
                    <span>{post.viewCount || 0} Views</span>
                  </div>
                  <button
                      className="flex items-center gap-1 hover:text-blue-500 transition-colors ml-auto"
                      onClick={handleShare}
                  >
                    <Share2 size={20} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/!* Comments section *!/}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Comments ({post.comments.length})</h2>

                <form onSubmit={handleSubmitComment} className="flex gap-3 mb-8">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <User size={20} className="text-blue-500" />
                  </div>
                  <div className="flex-grow relative">
                  <textarea
                      placeholder="Add a comment..."
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 border border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                  />
                    <button
                        type="submit"
                        disabled={!commentText.trim() || submittingComment}
                        className="absolute right-3 bottom-3 text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? (
                          <Loader2 size={20} className="animate-spin" />
                      ) : (
                          <Send size={20} />
                      )}
                    </button>
                  </div>
                </form>

                {post.comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare size={36} className="mx-auto mb-4 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                      {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {comment.user.profileImage ? (
                                  <img
                                      src={comment.user.profileImage}
                                      alt={`${comment.user.firstName} ${comment.user.lastName}`}
                                      className="w-full h-full object-cover"
                                  />
                              ) : (
                                  <span className="text-blue-500 font-semibold">
                            {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                          </span>
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">{comment.user.firstName} {comment.user.lastName}</h4>
                                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="text-gray-700">{comment.content}</p>
                              </div>

                              {(comment.user.id === currentUserId || post.isOwner) && (
                                  <div className="mt-2 flex justify-end">
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/!* Delete confirmation modal *!/}
        {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Delete Post</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this post? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                        onClick={handleDeletePost}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        disabled={isDeleting}
                    >
                      {isDeleting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Deleting...
                          </>
                      ) : (
                          <>
                            <Trash2 size={18} />
                            Delete
                          </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}*/
