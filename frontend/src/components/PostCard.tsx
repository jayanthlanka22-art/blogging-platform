import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, MessageSquare, Tag } from 'lucide-react';

interface TagData {
  id: string;
  name: string;
}

interface AuthorData {
  id: string;
  username: string;
}

interface PostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | null;
  status: string;
  createdAt: string;
  author: AuthorData;
  tags: TagData[];
  _count?: {
    comments: number;
  };
}

export const PostCard: React.FC<{ post: PostData }> = ({ post }) => {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const fallbackImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=600&auto=format&fit=crop';
  const imageUrl = post.coverImage || fallbackImage;

  return (
    <article className="flex flex-col h-full rounded-2xl overflow-hidden glass-panel glass-panel-hover group">
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden bg-dark-bg shrink-0">
        <img
          src={imageUrl}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {post.status === 'DRAFT' && (
          <span className="absolute top-4 left-4 text-[10px] font-bold tracking-wider text-yellow-300 bg-yellow-950/80 border border-yellow-500/20 px-2 py-0.5 rounded uppercase">
            Draft
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="flex flex-col flex-grow p-6">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-400 mb-3 shrink-0">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-brand-400" />
            <span>{post.author.username}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <span>{formattedDate}</span>
          </div>
          {post._count && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
              <span>{post._count.comments}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 hover:text-brand-400 transition-colors shrink-0">
          <Link to={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-400 line-clamp-3 mb-6 leading-relaxed flex-grow">
          {post.excerpt}
        </p>

        {/* Tags & Action Link */}
        <div className="flex items-center justify-between border-t border-dark-border/40 pt-4 mt-auto shrink-0">
          <div className="flex gap-1.5 overflow-x-auto max-w-[70%] no-scrollbar">
            {post.tags.slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-brand-950/40 text-brand-300 border border-brand-500/10 shrink-0"
              >
                <Tag className="h-2.5 w-2.5" />
                {t.name}
              </span>
            ))}
          </div>
          
          <Link
            to={`/posts/${post.slug}`}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline transition-colors shrink-0"
          >
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
};
