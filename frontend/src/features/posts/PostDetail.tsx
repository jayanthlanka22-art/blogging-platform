import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { request } from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { CommentThread } from '../comments/CommentThread';
import { Calendar, User, Tag, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    setLoading(true);
    const res = await request(`/posts/${slug}`);
    if (res.success && res.data) {
      setPost(res.data);
    } else {
      toast(res.error?.message || 'Failed to fetch article', 'error');
      navigate('/');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const handleDelete = async () => {
    if (!post) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    const res = await request(`/posts/${post.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      toast('Post deleted successfully', 'success');
      navigate('/');
    } else {
      toast(res.error?.message || 'Failed to delete post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 animate-pulse">
        <div className="h-6 w-20 bg-dark-card rounded" />
        <div className="h-96 bg-dark-card rounded-2xl" />
        <div className="h-10 bg-dark-card rounded w-3/4" />
        <div className="h-4 bg-dark-card rounded w-1/4" />
        <div className="h-4 bg-dark-card rounded w-full" />
      </div>
    );
  }

  if (!post) return null;

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const canEditOrDelete = isAuthenticated && user && (user.id === post.authorId || user.role === 'ADMIN');

  // Convert markdown to clean, safe HTML
  const rawHtml = marked.parse(post.content) as string;
  const safeHtml = DOMPurify.sanitize(rawHtml);

  return (
    <article className="max-w-4xl mx-auto py-8">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </Link>

      {/* Hero Cover Image */}
      {post.coverImage && (
        <div className="relative h-[400px] w-full rounded-2xl overflow-hidden mb-8 border border-dark-border">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header Panel */}
      <header className="mb-8">
        {post.status === 'DRAFT' && (
          <span className="inline-block text-[10px] font-bold tracking-wider text-yellow-300 bg-yellow-950/80 border border-yellow-500/20 px-2 py-0.5 rounded uppercase mb-4">
            Draft Mode
          </span>
        )}
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between border-b border-dark-border pb-6 gap-4">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-brand-400" />
              <span className="font-semibold text-gray-200">{post.author.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {canEditOrDelete && (
            <div className="flex items-center gap-2">
              <Link
                to={`/edit/${post.id}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-card border border-dark-border text-gray-300 hover:text-white transition-all"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/20 border border-rose-500/20 text-rose-300 hover:bg-rose-950/40 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Safe Render Markdown Article Content */}
      <div
        className="prose max-w-none text-gray-300 border-b border-dark-border pb-8"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {/* Tag pills */}
      <div className="flex flex-wrap gap-2 mt-6">
        {post.tags.map((t: any) => (
          <span
            key={t.id}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-dark-card border border-dark-border text-gray-300"
          >
            <Tag className="h-3.5 w-3.5 text-brand-400" />
            {t.name}
          </span>
        ))}
      </div>

      {/* Comment section */}
      <CommentThread postId={post.id} />
    </article>
  );
};
