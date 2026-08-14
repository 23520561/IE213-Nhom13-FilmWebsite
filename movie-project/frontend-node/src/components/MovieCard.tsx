import React, { memo } from "react";
import { Play, Plus, Check } from "lucide-react";
import { Movie } from "../types";
import styles from "../styles.module.css";
import { getOptimizedImageUrl } from "../utils/image";

interface MovieCardProps {
  movie: Movie;
  isInWatchlist: boolean;
  onMovieClick: (movieId: string) => void;
  onPlayClick: (movieId: Movie) => void;
  onToggleWatchlist: (movieId: Movie) => void;
}

function MovieCard({
  movie,
  isInWatchlist,
  onMovieClick,
  onPlayClick,
  onToggleWatchlist,
}: MovieCardProps) {
  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatchlist(movie);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayClick(movie);
  };

  return (
    <div
      id={`movie-card-${movie.id}`}
      onClick={() => onMovieClick(movie.id)}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-slate-900 border border-slate-800/60 cursor-pointer transition-all hover:border-slate-700/80 hover:shadow-2xl hover:shadow-slate-950/50 select-none pb-3"
    >
      {/* Poster image container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
        <img
          id={`card-poster-${movie.id}`}
          src={getOptimizedImageUrl(movie.poster || "", 300)}
          alt={movie.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {/* Hover translucent darkness shade */}
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/50 transition-colors duration-300" />
        {/* Special Top tags */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <span className="inline-flex items-center rounded-md bg-slate-900/90 text-[10px] font-bold text-amber-400 px-2 py-0.5 border border-slate-800/80">
            ⭐ {(movie.imdb || 0).toFixed(1)}
          </span>
          {movie.isNew && (
            <span className="inline-flex items-center rounded-md bg-red-600 text-[9px] font-black tracking-wide text-white px-2 py-0.5 uppercase">
              NEW
            </span>
          )}
        </div>
        {/* Cinematic Quality label & language */}

        {/* Quick action overlay buttons shown on hover */}
        <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-15 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent">
          {/* Play Quick */}
          <button
            id={`card-quickplay-${movie.id}`}
            onClick={handlePlayClick}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ef4444] text-white hover:bg-red-600 hover:scale-110 active:scale-95 transition-transform duration-200 outline-none shadow-lg shadow-red-500/30"
            title="Xem ngay tức thì"
          >
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </button>

          {/* Add My List Quick */}
          <button
            id={`card-quicklist-${movie.id}`}
            onClick={handleToggleWatchlist}
            className={`flex h-10 w-10 items-center justify-center rounded-full border hover:scale-110 active:scale-95 transition-all duration-200 ${
              isInWatchlist
                ? "bg-slate-900 border-red-500 text-red-500"
                : "bg-slate-900/95 border-slate-700 hover:border-slate-500 text-slate-200"
            }`}
            title={
              isInWatchlist ? "Bỏ khỏi danh sách của tôi" : "Thêm vào danh sách"
            }
          >
            {isInWatchlist ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Movie Text Info section */}
      <div className="mt-2.5 px-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-200 text-left line-clamp-1 group-hover:text-red-400 transition-colors">
            {movie.title}
          </h4>
          <p className="text-[11px] text-slate-500 text-left font-mono line-clamp-1 italic mt-0.5">
            {movie.originalTitle}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-zinc-500">
          <span>
            {movie.genres && movie.genres.length > 0
              ? movie.genres
                  .map((g) => (typeof g === "string" ? g : g.name))
                  .join(", ")
              : movie.category}
          </span>
          <span className="font-semibold text-slate-400">{movie.year}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(MovieCard);
