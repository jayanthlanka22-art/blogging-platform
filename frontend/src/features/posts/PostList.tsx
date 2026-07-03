import React, { useState, useEffect } from 'react';
import { request } from '../../services/api';
import { PostCard } from '../../components/PostCard';
import { useAuth } from '../auth/AuthContext';
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight, Grid } from 'lucide-react';

export const PostList: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most-commented'>('newest');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const query = new URLSearchParams();
      query.append('page', page.toString());
      query.append('limit', '6');
      query.append('sortBy', sortBy);
      if (tag) query.append('tag', tag);
      if (status) query.append('status', status);

      const res = await request(`/posts?${query.toString()}`);
      if (res.success && res.data) {
        setPosts(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages);
        }
      }
      setLoading(false);
    };

    fetchPosts();
  }, [page, tag, status, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setTag('');
    setStatus('');
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Intro Banner */}
      <section className="text-center py-12 bg-gradient-to-b from-brand-950/20 via-transparent to-transparent rounded-3xl border border-dark-border/10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Insights, Stories & Systems
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Deep-dives into modern web architectures, security fundamentals, and system design, compiled by engineering leads.
        </p>
      </section>

      {/* Filters Toolbar */}
      <section className="p-4 rounded-xl glass-panel border border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Tag Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-brand-400" />
            <select
              value={tag}
              onChange={(e) => { setTag(e.target.value); setPage(1); }}
              className="bg-dark-bg border border-dark-border text-gray-300 text-sm rounded-lg p-2.5 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Tags</option>
              <option value="react">React</option>
              <option value="typescript">TypeScript</option>
              <option value="node">Node.js</option>
              <option value="database">Database</option>
              <option value="security">Security</option>
            </select>
          </div>

          {/* Status Filter (Only if Auth) */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="bg-dark-bg border border-dark-border text-gray-300 text-sm rounded-lg p-2.5 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Published Only</option>
                <option value="DRAFT">My Drafts</option>
              </select>
            </div>
          )}
        </div>

        {/* Sorting & Clear */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
              className="bg-dark-bg border border-dark-border text-gray-300 text-sm rounded-lg p-2.5 focus:border-brand-500 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-commented">Most Commented</option>
            </select>
          </div>

          {(tag || status || sortBy !== 'newest') && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-dark-card/50 border border-dark-border/40 animate-pulse flex flex-col justify-between p-6">
              <div className="h-44 bg-dark-bg/60 rounded-xl mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-dark-bg/60 rounded w-1/3" />
                <div className="h-6 bg-dark-bg/60 rounded w-3/4" />
                <div className="h-4 bg-dark-bg/60 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2.5 rounded-lg border border-dark-border text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 hover:bg-dark-card transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="text-sm font-semibold text-gray-300">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2.5 rounded-lg border border-dark-border text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 hover:bg-dark-card transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-dashed border-dark-border">
          <Grid className="h-10 w-10 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Posts Found</h3>
          <p className="text-sm text-gray-400 mb-6">No articles matched your selected criteria.</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
