import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ThumbsUp, MessageCircle, Eye, Clock, Edit,
  Trash2, Share2, Send, User, Loader2, MoreHorizontal, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// Define types
interface ArticleUser {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: ArticleUser;
  userId: number; // Added userId for proper permissions
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
  likeCount: number;
  viewCount: number;
  liked: boolean;
  isOwner: boolean;
  comments: Comment[];
  user: ArticleUser;
}

export function DoctorArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  console.log("ArticleDetailPage rendered with ID param:", id);
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editCommentId, setEditCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState<string>('');
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [viewIncremented, setViewIncremented] = useState<boolean>(false); // Track if view has been incremented
  const [isDoctor, setIsDoctor] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const lastCommentRef = useRef<HTMLDivElement>(null);

  // Category dictionary
  const categoryLabels: { [key: string]: string } = {
    'MENTAL_HEALTH': 'Mental Health',
    'PHYSICAL_HEALTH': 'Physical Health',
    'PREVENTIVE_CARE': 'Preventive Care',
    'NUTRITION': 'Nutrition',
    'ALTERNATIVE_MEDICINE': 'Alternative Medicine',
    'MEDICAL_RESEARCH': 'Medical Research',
    'FITNESS': 'Fitness'
  };

  useEffect(() => {
    console.log("==== DEBUGGING DOCTOR ARTICLE DETAIL PAGE ====");
    console.log("Component mounted with ID:", id);
    console.log("Current URL:", window.location.href);
  }, []);
  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to newly added comment
  useEffect(() => {
    if (lastCommentRef.current) {
      lastCommentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [article?.comments?.length]);

  // Main effect for loading article data
  useEffect(() => {
    console.log("ArticleDetailPage mounted with ID:", id);
    fetchCurrentUser();
    fetchArticle();
  }, [id]);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get('/api/v1/user');
      if (data?.code === 'XS0001') {
        setCurrentUserId(data.data.id);
        setIsDoctor(data.data.role === 'DOCTOR');

        // Check if profile has email
        const isComplete = data?.data && data.data.email;
        setProfileComplete(!!isComplete);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Complete fetchArticle implementation
  const fetchArticle = async () => {
    if (!id) return;

    try {
      setLoading(true);
      console.log("Fetching article with ID:", id);

      // Fetch article data
      const response = await api.get(`/api/v1/doctor/articles/${id}`);
      console.log("API Response for article detail:", response.data);

      if (response.data?.code === 'XS0001') {
        const articleData = response.data.data;
        console.log("Article data received:", articleData);

        // Transform API response to match the component's expected structure
        const names = articleData.userName ? articleData.userName.split(' ') : ['Doctor', ''];

        const transformedArticle: Article = {
          id: articleData.blogId,
          title: articleData.title || '',
          content: articleData.content || '',
          category: articleData.category || '',
          doctorCategory: articleData.doctorCategory || '',
          media: articleData.media,
          createdAt: articleData.createdAt || new Date().toISOString(),
          updatedAt: articleData.updatedAt || new Date().toISOString(),
          likeCount: articleData.likeCount || 0,
          viewCount: articleData.viewCount || 0,
          liked: articleData.liked === true, // Make sure this is a boolean
          isOwner: false,
          comments: [],
          user: {
            id: articleData.userId,
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            profileImage: null
          }
        };

        try {
          const { data: userData } = await api.get('/api/v1/user');
          if (userData?.code === 'XS0001' && userData?.data?.id === articleData.userId) {
            transformedArticle.isOwner = true;
          }

          // Store current user ID for comment permissions
          setCurrentUserId(userData?.data?.id || null);
        } catch (userError) {
          console.error('Error checking article ownership:', userError);
        }

        if (articleData.commentResponseLists && articleData.commentResponseLists.length > 0) {
          transformedArticle.comments = articleData.commentResponseLists.map((comment: any) => {
            // Extract first name and last name from comment.userName
            const commentNames = comment.userName ? comment.userName.split(' ') : ['User', ''];

            return {
              id: comment.id,
              content: comment.content || '',
              createdAt: comment.createdAt || new Date().toISOString(),
              userId: comment.userId || 0,
              user: {
                id: comment.userId || 0,
                firstName: commentNames[0] || '',
                lastName: commentNames.slice(1).join(' ') || '',
                profileImage: null
              }
            };
          });
        }

        console.log("Transformed article data:", transformedArticle);
        setArticle(transformedArticle);

        // Increment view count immediately after setting article data, but only once
        if (!viewIncremented) {
          incrementViewCount(transformedArticle.id);
        }
      } else {
        console.error("API returned error:", response.data);
        toast.error(response.data?.message || 'Failed to load article');
        navigate('/community/doctors');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      navigate('/community/doctors');
    } finally {
      setLoading(false);
    }
  };

  // Complete implementation of incrementViewCount
  const incrementViewCount = async (articleId: number) => {
    try {
      console.log(`Incrementing view count for article ${articleId}`);
      // Use the same endpoint as the user community with the article ID
      const response = await api.post(`/api/v1/blog/view/${articleId}`);
      console.log("View count increment response:", response.data);

      // Update local state to show the incremented view count immediately
      setArticle(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          viewCount: prev.viewCount + 1
        };
      });

      // Mark as incremented to prevent multiple increments in this session
      setViewIncremented(true);
    } catch (error) {
      console.error("Failed to increment view count:", error);
    }
  };

  // Complete handleLike implementation for DoctorArticleDetailPage.tsx
  const handleLike = async () => {
    if (!article) return;

    if (!profileComplete) {
      toast.error('Please complete your profile to like articles');
      return;
    }

    try {
      console.log(`Toggling like for article with ID: ${article.id}, current liked status: ${article.liked}`);

      // Make API call to toggle like - using the exact same endpoint that works in the user community
      await api.post(`/api/v1/like/create/blogs/${article.id}/like`);
      console.log("Like API call successful");

      // Update local state immediately for responsive UI
      setArticle(prev => {
        if (!prev) return prev;

        // Toggle the liked status and update count
        const newLikedStatus = !prev.liked;
        const newLikeCount = newLikedStatus
            ? prev.likeCount + 1
            : Math.max(0, prev.likeCount - 1); // Prevent negative counts

        console.log(`Updated like status: ${newLikedStatus}, count: ${newLikeCount}`);

        return {
          ...prev,
          liked: newLikedStatus,
          likeCount: newLikeCount
        };
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to like article');
    }
  };

  // Complete implementation of handleSubmitComment
  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!commentText.trim() || !article) {
      return;
    }

    if (!profileComplete) {
      toast.error('Please complete your profile to comment');
      return;
    }

    try {
      setSubmittingComment(true);
      console.log(`Submitting comment to article ID: ${article.id}`, { content: commentText.trim() });

      // Use the correct blog ID for the comment API - same endpoint as user community
      const commentEndpoint = `/api/v1/comment/create/${article.id}/comments`;
      console.log("Comment endpoint:", commentEndpoint);

      const response = await api.post(commentEndpoint, {
        content: commentText.trim()
      });

      console.log("Comment response:", response.data);

      if (response.data?.code === 'XS0001') {
        const newComment = response.data.data;
        console.log("New comment added:", newComment);

        // Format the user name correctly
        const userName = newComment.userName || '';
        const names = userName.split(' ');
        const formattedComment: Comment = {
          id: newComment.id,
          content: newComment.content,
          createdAt: newComment.createdAt,
          userId: newComment.userId, // Make sure to include userId
          user: {
            id: newComment.userId,
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            profileImage: null
          }
        };

        // Update article with new comment
        setArticle(prev => {
          if (!prev) return prev;
          const updatedComments = [...(prev.comments || []), formattedComment];
          return {
            ...prev,
            comments: updatedComments
          };
        });

        setCommentText('');
        toast.success('Comment added successfully');
      } else {
        toast.error(response.data?.message || 'Failed to add comment');
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Edit comment
  const handleEditComment = (comment: Comment) => {
    setEditCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  // Update comment
  const handleUpdateComment = async () => {
    if (!editCommentId || !editCommentContent.trim() || !article) return;

    try {
      const response = await api.put(`/api/v1/comment/comments/${editCommentId}`, {
        content: editCommentContent
      });

      if (response.data?.code === 'XS0001') {
        // Update article with updated comment
        setArticle(prev => {
          if (!prev) return prev;
          const updatedComments = prev.comments.map(comment =>
              comment.id === editCommentId
                  ? { ...comment, content: editCommentContent }
                  : comment
          );
          return {
            ...prev,
            comments: updatedComments
          };
        });

        setEditCommentId(null);
        setEditCommentContent('');
        toast.success('Comment updated successfully');
      } else {
        toast.error(response.data?.message || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!article) return;

    try {
      const response = await api.delete(`/api/v1/comment/comments/${commentId}`);

      if (response.data?.code === 'XS0001') {
        // Update article with comment removed
        setArticle(prev => {
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
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Delete article
  const handleDeleteArticle = async () => {
    if (!article) return;

    try {
      setIsDeleting(true);

      const response = await api.delete(`/api/v1/doctor/articles/${article.id}`);

      if (response.data?.code === 'XS0001') {
        toast.success('Article deleted successfully!');
        navigate('/community/doctors');
      } else {
        toast.error(response.data?.message || 'Failed to delete article');
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Share article
  const handleShare = () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: article?.title || 'Medical Article',
        text: `Check out this medical article: ${article?.title}`,
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

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format content with paragraphs - improved version with responsive text
  const formatContent = (content: string) => {
    if (!content || content.trim() === '') {
      return <p className="text-gray-500">No content available for this article.</p>;
    }

    // Split by double newlines to get paragraphs
    return content.split('\n\n').map((paragraph, index) => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return null;

      // Check if paragraph is a bullet list
      if (paragraph.includes('\n• ')) {
        const [listTitle, ...items] = paragraph.split('\n• ');
        return (
            <div key={index} className="mb-4">
              {listTitle && <p className="mb-2 whitespace-pre-wrap break-words">{listTitle}</p>}
              <ul className="list-disc pl-5 space-y-1">
                {items.map((item, i) => (
                    <li key={i} className="whitespace-pre-wrap break-words">{item}</li>
                ))}
              </ul>
            </div>
        );
      }

      // Check if paragraph is a numbered list
      if (/^\d\./.test(paragraph)) {
        return (
            <ol key={index} className="list-decimal pl-5 mb-4 space-y-1">
              {paragraph.split('\n').map((item, i) => (
                  <li key={i} className="whitespace-pre-wrap break-words">{item.replace(/^\d\./, '').trim()}</li>
              ))}
            </ol>
        );
      }

      // Regular paragraph with responsive text
      return <p key={index} className="mb-4 whitespace-pre-wrap break-words">{paragraph}</p>;
    }).filter(Boolean); // Remove null elements from the array
  };

  // Loading state
  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <Loader2 size={36} className="animate-spin text-blue-500" />
        </div>
    );
  }

  // Not found state
  if (!article) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <Link to="/community/doctors" className="flex items-center text-blue-500 mb-6">
              <ArrowLeft size={20} className="mr-2" />
              Back to Articles
            </Link>

            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
              <p className="text-gray-600 mb-6">The article you're looking for may have been removed or doesn't exist.</p>
              <Link
                  to="/community/doctors"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Return to Articles
              </Link>
            </div>
          </div>
        </div>
    );
  }

  // Main content
  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Link to="/community/doctors" className="flex items-center text-blue-500 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to Articles
          </Link>

          <div className="max-w-3xl mx-auto">
            {/* Article card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              {article.media && (
                  <div className="w-full h-64 overflow-hidden">
                    <img
                        src={article.media}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
                        }}
                    />
                  </div>
              )}

              <div className="p-6">
                {/* Article header with user info and options */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {article.user.profileImage ? (
                          <img
                              src={article.user.profileImage}
                              alt={`${article.user.firstName} ${article.user.lastName}`}
                              className="w-full h-full object-cover"
                          />
                      ) : (
                          <User size={20} className="text-blue-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{article.user.firstName} {article.user.lastName}</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Doctor</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {article.doctorCategory && (
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                          {categoryLabels[article.doctorCategory] || article.doctorCategory}
                        </span>
                    )}

                    {article.isOwner && (
                        <div className="relative" ref={menuRef}>
                          <button
                              onClick={() => setShowOptions(!showOptions)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              aria-label="Article options"
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {showOptions && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-10">
                                <div className="py-1">
                                  <Link
                                      to={`/community/doctors/edit/${article.id}`}
                                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Edit size={16} />
                                    <span>Edit Article</span>
                                  </Link>
                                  <button
                                      onClick={() => {
                                        setShowOptions(false);
                                        setShowDeleteConfirm(true);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete Article</span>
                                  </button>
                                </div>
                              </div>
                          )}
                        </div>
                    )}
                  </div>
                </div>

                {/* Article title in purple background */}
                <div className="bg-purple-100 p-4 rounded-lg mb-4">
                  <h1 className="text-2xl font-bold text-purple-800 break-words">{article.title}</h1>
                </div>

                {/* Article content with responsive formatting */}
                <div className="prose max-w-none mb-6">
                  {formatContent(article.content)}
                </div>

                {/* Article actions (like, comment, views, share) */}
                <div className="flex flex-wrap items-center gap-6 pb-4 border-b text-gray-500">
                  <button
                      className={`flex items-center gap-1 transition-colors ${
                          article.liked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                      }`}
                      onClick={handleLike}
                      disabled={!profileComplete}
                  >
                    {article.liked ? (
                        <ThumbsUp size={20} fill="currentColor" />
                    ) : (
                        <ThumbsUp size={20} />
                    )}
                    <span>{article.likeCount || 0} Likes</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={20} />
                    <span>{article.comments?.length || 0} Comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={20} />
                    <span>{article.viewCount || 0} Views</span>
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

            {/* Comments section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Comments ({article.comments?.length || 0})</h2>

                {/* Profile incomplete warning */}
                {!profileComplete && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 flex items-start gap-3">
                      <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800">Profile Incomplete</h3>
                        <p className="text-yellow-700 text-sm">
                          Please complete your profile to participate in discussions.
                        </p>
                        <Link to="/settings" className="text-blue-500 text-sm hover:underline mt-1 inline-block">
                          Complete Profile
                        </Link>
                      </div>
                    </div>
                )}

                {/* Comment form */}
                <form onSubmit={handleSubmitComment} className="flex gap-3 mb-8">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <User size={20} className="text-blue-500" />
                  </div>
                  <div className="flex-grow relative">
                    <textarea
                        placeholder={profileComplete ? "Add a comment..." : "Complete your profile to comment"}
                        className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 border border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={!profileComplete || submittingComment}
                    />
                    <button
                        type="submit"
                        disabled={!commentText.trim() || submittingComment || !profileComplete}
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

                {/* Comments list */}
                {article.comments?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle size={36} className="mx-auto mb-4 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                      {article.comments.map((comment, index) => {
                        const isLastComment = index === article.comments.length - 1;

                        // Use userId directly for permission checks
                        const isCommentOwner = comment.userId === currentUserId;
                        const canEditComment = isCommentOwner;
                        const canDeleteComment = isCommentOwner || article.isOwner;

                        return (
                            <div
                                key={comment.id}
                                className="flex gap-3"
                                ref={isLastComment ? lastCommentRef : null}
                            >
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {comment.user.profileImage ? (
                                    <img
                                        src={comment.user.profileImage}
                                        alt={`${comment.user.firstName} ${comment.user.lastName}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={20} className="text-blue-500" />
                                )}
                              </div>
                              <div className="flex-grow">
                                {editCommentId === comment.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                          value={editCommentContent}
                                          onChange={(e) => setEditCommentContent(e.target.value)}
                                          className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                          rows={3}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                              setEditCommentId(null);
                                              setEditCommentContent('');
                                            }}
                                            className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateComment}
                                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                        >
                                          Update
                                        </button>
                                      </div>
                                    </div>
                                ) : (
                                    <>
                                      <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="font-semibold">{comment.user.firstName} {comment.user.lastName}</h4>
                                          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
                                      </div>

                                      {(canEditComment || canDeleteComment) && (
                                          <div className="mt-2 flex justify-end gap-3">
                                            {canEditComment && (
                                                <button
                                                    onClick={() => handleEditComment(comment)}
                                                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                                                >
                                                  Edit
                                                </button>
                                            )}
                                            {canDeleteComment && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                  Delete
                                                </button>
                                            )}
                                          </div>
                                      )}
                                    </>
                                )}
                              </div>
                            </div>
                        );
                      })}
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        <ConfirmDialog
            isOpen={showDeleteConfirm}
            title="Delete Article"
            message="Are you sure you want to delete this article? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            confirmIcon={Trash2}
            isLoading={isDeleting}
            isDangerous={true}
            onConfirm={handleDeleteArticle}
            onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
  );
}