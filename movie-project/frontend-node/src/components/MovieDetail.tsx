import React, { useState } from "react";
import {
  Play,
  Plus,
  Check,
  Star,
  Eye,
  Calendar,
  Clock,
  Film,
  MessageCircle,
  Heart,
  Send,
} from "lucide-react";
import { Movie, Comment } from "../types";
import {
  graphqlGetMovieComments,
  graphqlCreateComment,
  graphqlLikeComment,
} from "../services/graphql";
import MovieRow from "./MovieRow";
import styles from "../styles.module.css";
import { getOptimizedImageUrl } from "../utils/image";
import userIcon from "../../images/user.svg";

interface MovieDetailProps {
  movie: Movie;
  allMovies: Movie[];
  watchlistIds: string[];
  onPlayClick: (movieId: string) => void;
  onToggleWatchlist: (movieId: string) => void;
  onMovieClick: (movieId: string) => void;
  onShowNotification: (message: string) => void;
}

export default function MovieDetail({
  movie,
  allMovies,
  watchlistIds,
  onPlayClick,
  onToggleWatchlist,
  onMovieClick,
  onShowNotification,
}: MovieDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const isInWatchlist = watchlistIds.includes(movie.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsListRef = React.useRef<HTMLDivElement | null>(null);
  const suppressCommentsRef = React.useRef(false);
  const pendingLikesRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let mounted = true;

    async function loadComments() {
      try {
        const dbComments = await graphqlGetMovieComments(movie.id, signal);
        if (!mounted) return;

        // Chuyển đổi dữ liệu từ Backend thành kiểu Comment của Frontend
        const formattedComments = dbComments.map((c: any) => ({
          id: c.id,
          author: c.user?.username || "Người Xem Ẩn Danh",
          avatar: c.user?.avatar || userIcon,
          content: c.content,
          timestamp: new Date(Number(c.createdAt)).toLocaleDateString("vi-VN"),
          likes: c.likeCount || 0,
        }));

        // Avoid unnecessary state updates if comments are unchanged
        setComments((prev) => {
          try {
            if (!prev || prev.length !== formattedComments.length)
              return formattedComments;
            for (let i = 0; i < formattedComments.length; i++) {
              const a = prev[i];
              const b = formattedComments[i];
              if (
                a.id !== b.id ||
                (a.likes || 0) !== (b.likes || 0) ||
                a.content !== b.content
              ) {
                return formattedComments;
              }
            }
            return prev; // no changes
          } catch (err) {
            return formattedComments;
          }
        });
      } catch (err: any) {
        if (err?.name === "AbortError") return; // expected when aborting
        if (mounted) console.error("Failed loading comments:", err);
      }
    }

    // If suppression flag is set (recent local update), skip this fetch
    if (!suppressCommentsRef.current) {
      loadComments();
    }
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [movie.id]);

  // Filter out the current movie and select movies with matching category for related list
  const relatedMovies = allMovies.filter(
    (m) => m.id !== movie.id && m.category === movie.category,
  );

  // If no exact category matches, fallback to generic movies list
  const finalRelated =
    relatedMovies.length > 0
      ? relatedMovies
      : allMovies.filter((m) => m.id !== movie.id).slice(0, 4);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) {
      onShowNotification("Nội dung bình luận không được bỏ trống!");
      return;
    }

    const token = localStorage.getItem("cinemax_auth_token");
    if (!token) {
      onShowNotification("Vui lòng đăng nhập để có thể bình luận!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gửi Comment mới lên Backend
      const createdComment = await graphqlCreateComment(
        movie.id,
        newCommentContent,
      );

      // Chuyển đổi format để hiển thị ngay lập tức lên UI (Optimistic UI update)
      const newComment: Comment = {
        id: createdComment.id || `c-${Date.now()}`,
        author:
          createdComment.user?.username ||
          newCommentName.trim() ||
          "Thành viên",
        avatar: createdComment.user?.avatar || userIcon,
        content: createdComment.content,
        timestamp: "Vừa xong",
        likes: 0,
      };

      setComments((prev) => [newComment, ...prev]);
      setNewCommentName("");
      setNewCommentContent("");
      onShowNotification("Bình luận của bạn đã được đăng thành công!");

      // Smooth-scroll to the newly added comment so the UI doesn't jump to page top
      setTimeout(() => {
        const el = document.getElementById(`comment-${newComment.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    } catch (error: any) {
      onShowNotification(error.message || "Có lỗi xảy ra khi đăng bình luận.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = (e: React.MouseEvent, commentId: string) => {
    // prevent any form submission or parent handlers
    e.preventDefault();
    e.stopPropagation();

    // Preserve scroll position to avoid visual jump when re-rendering
    const scrollContainer = commentsListRef.current;
    const prevScroll = scrollContainer ? scrollContainer.scrollTop : 0;

    // Prevent immediate refetches triggered elsewhere
    suppressCommentsRef.current = true;
    const suppressTimer = window.setTimeout(() => {
      suppressCommentsRef.current = false;
    }, 1500);

    // Prevent duplicate like requests for same comment
    if (pendingLikesRef.current.has(commentId)) return;
    pendingLikesRef.current.add(commentId);

    // Optimistic UI: update immediately (preserve order)
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c)),
    );

    // Send like to backend; update UI with authoritative likeCount when response arrives
    (async () => {
      try {
        const updated = await graphqlLikeComment(commentId);
        // update the corresponding comment's likes with backend's likeCount
        setComments((prev) =>
          prev.map((c) =>
            c.id === updated.id
              ? { ...c, likes: updated.likeCount ?? (c.likes || 0) }
              : c,
          ),
        );

        // restore scroll position after DOM updates
        setTimeout(() => {
          if (scrollContainer) scrollContainer.scrollTop = prevScroll;
        }, 30);

        onShowNotification("Đã thích bình luận!");
      } catch (err: any) {
        console.error("Like failed:", err);
        // revert optimistic update on failure
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likes: Math.max((c.likes || 1) - 1, 0) }
              : c,
          ),
        );
        onShowNotification(err?.message || "Không thể thích bình luận");
      } finally {
        pendingLikesRef.current.delete(commentId);
        clearTimeout(suppressTimer);
        suppressCommentsRef.current = false;
      }
    })();
  };

  return (
    <div id="movie-detail-view" className="relative space-y-12 pb-16">
      {/* Cinematic Blur Backdrop Banner overlay */}
      <div className="absolute top-0 left-0 right-0 h-[26rem] md:h-[35rem] overflow-hidden -mt-8 md:-mt-12 select-none -z-10">
        <img
          src={getOptimizedImageUrl(movie.backdrop || "", 600)}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter blur-md opacity-25 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      {/* Main details segment grids */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-11 pt-12 md:pt-20">
        {/* Poster side */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative w-64 sm:w-72 md:w-full aspect-[2/3] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">
            <img
              src={getOptimizedImageUrl(movie.poster || "", 400)}
              alt={movie.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Top info badge tags on poster overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 font-bold">
              <span className="inline-flex items-center rounded-lg bg-slate-950/95 text-xs text-amber-400 px-3 py-1 border border-slate-700/80 shadow-lg">
                ⭐ {movie.imdb} IMDb
              </span>
              <span className="inline-flex items-center rounded-lg bg-[#ef4444] text-[10px] tracking-wider text-white px-2.5 py-1 uppercase shadow-md">
                {movie.quality}
              </span>
            </div>
          </div>
        </div>

        {/* Text descriptions side */}
        <div className="md:col-span-8 space-y-6 text-left">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-red-950 text-red-400 border border-red-900 px-2.5 py-0.5 text-xs font-black uppercase">
                {movie.genres && movie.genres.length > 0
                  ? movie.genres
                      .map((g) => (typeof g === "string" ? g : g.name))
                      .join(", ")
                  : movie.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {movie.title}
            </h1>
            <p className="text-sm md:text-xl font-bold text-slate-400 italic">
              {movie.originalTitle}
            </p>
          </div>

          {/* Quick tags specs lists */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-900 bg-slate-950/70 font-mono text-zinc-350">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Năm Phát Hành
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
                {movie.year}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Thời Lượng
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
                {movie.duration} Phút
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Lượt Xem Web
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
                {((movie.views || 0) + 1250).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Core Buttons controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id={`detail-act-play-${movie.id}`}
              onClick={() => onPlayClick(movie.id)}
              className={`flex items-center space-x-2 bg-[#ef4444] hover:bg-red-605 text-white rounded-full px-8 py-4 text-sm font-extrabold tracking-widest uppercase transition-all scale-100 active:scale-95 ${styles.glowingButton}`}
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
              <span>XEM PHIM NGAY</span>
            </button>

            <button
              id={`detail-act-save-${movie.id}`}
              onClick={() => onToggleWatchlist(movie.id)}
              className={`flex items-center space-x-1.5 rounded-full px-5 py-4 text-sm font-semibold border transition-all ${
                isInWatchlist
                  ? "bg-slate-900 border-red-500 text-red-500"
                  : "bg-slate-900/60 border-slate-700 hover:border-slate-500 text-slate-200"
              }`}
            >
              {isInWatchlist ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                {isInWatchlist ? "ĐÃ THÊM VÀO LIST" : "LƯU VÀO DANH SÁCH"}
              </span>
            </button>
          </div>

          {/* Synopsis & staff list details */}
          <div className="space-y-4 pt-3">
            <div className="space-y-2 border-l-2 border-[#ef4444] pl-4">
              <h3 className="text-xs uppercase font-black tracking-widest text-zinc-500">
                Tóm tắt nội dung
              </h3>
              <p className="text-sm dark:text-zinc-300 leading-relaxed font-normal">
                {movie.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <p className="text-slate-400">
                <strong className="text-slate-200">Đạo diễn:</strong>{" "}
                {movie.director}
              </p>
              <p className="text-slate-400">
                <strong className="text-slate-200">Diễn viên chính:</strong>{" "}
                {(movie.actors || []).join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Comments zone */}
      <section
        id="comments-section"
        className="border-t border-slate-900 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
      >
        {/* Comment input form (col span 5) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-100 flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-red-500" />
              <span>Gửi Bình Luận</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Nhập phản hồi hoặc đánh giá của bạn về phim
            </p>
          </div>

          <form
            onSubmit={handleCommentSubmit}
            className="space-y-3.5 bg-slate-900/40 p-4 rounded-xl border border-slate-800"
          >
            <div>
              <input
                type="text"
                placeholder="Tên của bạn (Tùy chọn)..."
                value={newCommentName}
                onChange={(e) => setNewCommentName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder:text-zinc-650 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>
            <div>
              <textarea
                required
                rows={3}
                placeholder="Bình luận cảm nhận về phim, chất lượng..."
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder:text-zinc-650 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center space-x-2 rounded-lg bg-[#ef4444] hover:bg-red-600 text-white font-bold py-2.5 text-xs transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Gửi Bình Luận</span>
            </button>
          </form>
        </div>

        {/* List of comments (col span 8) */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            ({comments.length}) Đánh giá thảo luận
          </h3>

          <div
            ref={commentsListRef}
            className="space-y-3 max-h-[30rem] overflow-y-auto pr-2 customScrollbar"
          >
            {comments.map((comment) => (
              <div
                key={comment.id}
                id={`comment-${comment.id}`}
                className="p-4 rounded-xl border border-slate-905 bg-slate-950/45 flex gap-3.5 transition-all hover:bg-slate-950/80"
              >
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 rounded-full border border-slate-800 object-cover"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-200">
                      {comment.author}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {comment.timestamp}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {comment.content}
                  </p>

                  <div className="flex items-center justify-start pt-2">
                    <button
                      type="button"
                      onClick={(e) => handleLikeComment(e, comment.id)}
                      className="inline-flex items-center space-x-1.5 text-[10px] text-zinc-500 hover:text-red-400 font-semibold transition-colors"
                    >
                      <Heart className="h-3 w-3 fill-rose-500/10 text-rose-500" />
                      <span>Thích ({comment.likes})</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Movies row lists */}
      <div className="border-t border-slate-900 pt-10">
        <MovieRow
          title="Phim Tương Tự Điểm Cao"
          subtitle="Gợi ý phim lẻ cùng thể loại không nên bỏ lỡ"
          movies={finalRelated}
          watchlistIds={watchlistIds}
          onMovieClick={onMovieClick}
          onPlayClick={onPlayClick}
          onToggleWatchlist={onToggleWatchlist}
        />
      </div>
    </div>
  );
}
