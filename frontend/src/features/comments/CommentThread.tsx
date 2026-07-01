import React, { useState, useEffect } from 'react';
import { request } from '../../services/api';
import { useAuth } from '../auth/AuthContext';
import { MessageSquare, CornerDownRight, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface Comment {
  id: string;
  content: string;
  isDeleted: boolean;
  authorId: string;
  postId: string;
  parentId: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
  replies: Comment[];
}

interface CommentThreadProps {
  postId: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ postId }) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const res = await request(`/posts/${postId}/comments`);
    if (res.success && res.data) {
      setComments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmitting(true);
    const res = await request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: newCommentText }),
    });
    setSubmitting(false);

    if (res.success && res.data) {
      setNewCommentText('');
      toast('Comment posted successfully', 'success');
      fetchComments();
    } else {
      toast(res.error?.message || 'Failed to post comment', 'error');
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-dark-border space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-brand-400" />
        <h3 className="text-xl font-bold text-white">Discussions</h3>
      </div>

      {/* Post Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleAddRootComment} className="space-y-3">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-dark-bg border border-dark-border text-white text-sm focus:border-brand-500 focus:outline-none transition-all placeholder:text-gray-500"
            placeholder="Share your thoughts on this post..."
            disabled={submitting}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl border border-dark-border bg-dark-card/30 text-center text-sm text-gray-400">
          Please <a href="/login" className="text-brand-400 underline font-semibold">sign in</a> to participate in the discussion.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-dark-card rounded-lg w-full" />
          <div className="h-16 bg-dark-card rounded-lg w-5/6 ml-auto" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              onCommentChanged={fetchComments}
              currentUser={user}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 py-8">No comments yet. Be the first to start the conversation!</p>
      )}
    </div>
  );
};

/* Recursive Comment Node Component */
const CommentNode: React.FC<{
  comment: Comment;
  onCommentChanged: () => void;
  currentUser: any;
}> = ({ comment, onCommentChanged, currentUser }) => {
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const formattedDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const canEditOrDelete = currentUser && (currentUser.id === comment.authorId || currentUser.role === 'ADMIN') && !comment.isDeleted;

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    const res = await request(`/posts/${comment.postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: replyText, parentId: comment.id }),
    });
    setSubmitting(false);

    if (res.success) {
      setReplyText('');
      setIsReplying(false);
      toast('Reply added successfully', 'success');
      onCommentChanged();
    } else {
      toast(res.error?.message || 'Failed to post reply', 'error');
    }
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;

    setSubmitting(true);
    const res = await request(`/comments/${comment.id}`, {
      method: 'PUT',
      body: JSON.stringify({ content: editText }),
    });
    setSubmitting(false);

    if (res.success) {
      setIsEditing(false);
      toast('Comment updated successfully', 'success');
      onCommentChanged();
    } else {
      toast(res.error?.message || 'Failed to edit comment', 'error');
    }
  };

  const handleDeleteComment = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    const res = await request(`/comments/${comment.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      toast('Comment deleted successfully', 'success');
      onCommentChanged();
    } else {
      toast(res.error?.message || 'Failed to delete comment', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border ${comment.isDeleted ? 'bg-dark-card/20 border-dark-border/40 text-gray-500' : 'bg-dark-card border-dark-border text-gray-200'}`}>
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${comment.isDeleted ? 'text-gray-500' : 'text-brand-400'}`}>
              {comment.author.username}
            </span>
            <span className="text-[10px] text-gray-500">{formattedDate}</span>
          </div>

          {canEditOrDelete && (
            <div className="flex items-center gap-2 text-gray-500">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="hover:text-white transition-colors"
                title="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDeleteComment}
                className="hover:text-rose-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Comment Body */}
        {isEditing ? (
          <form onSubmit={handleEditComment} className="space-y-2 mt-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded bg-dark-bg border border-dark-border text-white text-xs focus:border-brand-500 focus:outline-none"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 rounded bg-dark-bg text-gray-400 text-xs hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {comment.isDeleted ? (
              <span className="flex items-center gap-1 italic text-xs text-gray-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                This comment has been deleted.
              </span>
            ) : (
              comment.content
            )}
          </div>
        )}

        {/* Reply trigger button */}
        {currentUser && !comment.isDeleted && !isEditing && (
          <div className="flex justify-end mt-2 pt-2 border-t border-dark-border/20">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-400 font-semibold transition-colors"
            >
              <CornerDownRight className="h-3 w-3" />
              Reply
            </button>
          </div>
        )}
      </div>

      {/* Reply input field (indented) */}
      {isReplying && (
        <form onSubmit={handleAddReply} className="pl-6 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded bg-dark-bg border border-dark-border text-white text-xs focus:border-brand-500 focus:outline-none placeholder:text-gray-600"
            placeholder={`Reply to ${comment.author.username}...`}
            required
            disabled={submitting}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="px-3 py-1 rounded bg-dark-card border border-dark-border text-gray-400 text-xs hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              {submitting ? 'Replying...' : 'Submit'}
            </button>
          </div>
        </form>
      )}

      {/* Child replies mapping (indented) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 border-l border-dark-border/60 space-y-4">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              onCommentChanged={onCommentChanged}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};
