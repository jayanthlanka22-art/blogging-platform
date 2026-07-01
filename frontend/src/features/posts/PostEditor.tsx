import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { request } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { CreatePostSchema } from '../../../../backend/src/utils/validation';
import { ArrowLeft, Save, Eye, Edit3 } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // if editing
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [tagsInput, setTagsInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (id) {
      // Load post info for edit
      const fetchPostToEdit = async () => {
        setLoading(true);
        // We need to fetch by ID or Slug. Our backend lists getBySlug.
        // Wait, does the backend support fetching a single post by ID, or should we query all posts and filter,
        // or does the slug get passed? Let's check how the edit page gets invoked.
        // If the URL is /edit/:id, can we fetch the post?
        // Wait, on the backend, does GET /posts/:slug allow slugs or IDs?
        // Let's check `post.controller.ts` `getBySlug`:
        // It reads `const { slug } = req.params` and queries `prisma.post.findFirst({ where: { slug, isDeleted: false } })`.
        // Wait! In `post.routes.ts`, we did:
        // `router.get('/:slug', optionalAuth, catchAsync(PostController.getBySlug));`
        // Since we query by slug, we can modify the route or controller so that if `slug` is a UUID, it queries by `id` instead!
        // That is a highly robust solution! It allows the `/posts/:slug` endpoint to accept BOTH a slug or a direct UUID ID!
        // Let's review `PostService.getBySlug` in `post.service.ts`:
        // ```typescript
        // const post = await prisma.post.findFirst({
        //   where: { slug, isDeleted: false },
        // ...
        // ```
        // If we change it to:
        // ```typescript
        // const post = await prisma.post.findFirst({
        //   where: {
        //     OR: [
        //       { slug },
        //       { id: slug } // If slug is actually an ID
        //     ],
        //     isDeleted: false
        //   },
        // ...
        // ```
        // This is a beautiful piece of polymorphic API routing that lets us retrieve a post using either its friendly slug OR its database ID!
        // Let's update `PostService.getBySlug` to allow this!
        
        const res = await request(`/posts/${id}`);
        if (res.success && res.data) {
          const post = res.data;
          setTitle(post.title);
          setContent(post.content);
          setCoverImage(post.coverImage || '');
          setStatus(post.status);
          setTagsInput(post.tags.map((t: any) => t.name).join(', '));
        } else {
          toast(res.error?.message || 'Failed to fetch post details', 'error');
          navigate('/');
        }
        setLoading(false);
      };

      fetchPostToEdit();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const postPayload = {
      title,
      content,
      coverImage: coverImage.trim() || undefined,
      status,
      tags: parsedTags,
    };

    // Client-side schema validation using Zod
    const validationResult = CreatePostSchema.safeParse(postPayload);
    if (!validationResult.success) {
      const formattedErrors: any = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path[0];
        formattedErrors[path] = err.message;
      });
      setErrors(formattedErrors);
      toast('Validation failed. Please correct details.', 'error');
      return;
    }

    setSubmitting(true);
    
    const endpoint = id ? `/posts/${id}` : '/posts';
    const method = id ? 'PUT' : 'POST';

    const res = await request(endpoint, {
      method,
      body: JSON.stringify(postPayload),
    });
    setSubmitting(false);

    if (res.success && res.data) {
      toast(id ? 'Post updated successfully!' : 'Post published successfully!', 'success');
      navigate(`/posts/${res.data.slug}`);
    } else {
      toast(res.error?.message || 'Action failed', 'error');
    }
  };

  const getPreviewHtml = () => {
    try {
      const raw = marked.parse(content || '*No content written yet.*') as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 animate-pulse">
        <div className="h-6 w-20 bg-dark-card rounded" />
        <div className="h-10 bg-dark-card rounded w-3/4" />
        <div className="h-4 bg-dark-card rounded w-full" />
        <div className="h-96 bg-dark-card rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </Link>

      <div className="flex items-center justify-between border-b border-dark-border pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          {id ? 'Edit Article' : 'Write New Article'}
        </h1>
        
        {/* Toggle Editor Tabs */}
        <div className="flex items-center rounded-lg bg-dark-card border border-dark-border p-1">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'edit' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'preview' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'edit' ? (
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Article Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-dark-card border text-white text-sm focus:border-brand-500 focus:outline-none transition-all ${
                  errors.title ? 'border-rose-500' : 'border-dark-border'
                }`}
                placeholder="e.g. Architecting Distributed Cache Systems"
              />
              {errors.title && <span className="text-xs text-rose-400 mt-1 block">{errors.title}</span>}
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Cover Image URL (Optional)
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-dark-card border text-white text-sm focus:border-brand-500 focus:outline-none transition-all ${
                  errors.coverImage ? 'border-rose-500' : 'border-dark-border'
                }`}
                placeholder="https://images.unsplash.com/..."
              />
              {errors.coverImage && <span className="text-xs text-rose-400 mt-1 block">{errors.coverImage}</span>}
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Content (Supports Markdown)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className={`w-full px-4 py-3 rounded-lg bg-dark-card border text-white text-sm font-mono focus:border-brand-500 focus:outline-none transition-all ${
                  errors.content ? 'border-rose-500' : 'border-dark-border'
                }`}
                placeholder="Write your article markdown..."
              />
              {errors.content && <span className="text-xs text-rose-400 mt-1 block">{errors.content}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
                  placeholder="react, typescript, performance"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Publish Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-white text-sm focus:border-brand-500 focus:outline-none transition-all"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl glass-panel border border-dark-border min-h-[400px]">
            {/* Realtime HTML Preview */}
            <div
              className="prose max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 border-t border-dark-border pt-6">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg border border-dark-border text-gray-400 hover:text-white text-sm font-semibold hover:bg-dark-card transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-950/20 disabled:opacity-50 transition-all duration-200"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Saving...' : id ? 'Save Changes' : 'Publish Article'}
          </button>
        </div>
      </form>
    </div>
  );
};
