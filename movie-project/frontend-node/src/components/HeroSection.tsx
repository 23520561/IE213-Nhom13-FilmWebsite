import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Check, Star, Eye, Calendar, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { Movie } from '../types';
import styles from '../styles.module.css';
import { getOptimizedImageUrl } from '../utils/image';

interface HeroSectionProps {
  movies: Movie[];
  watchlistIds: string[];
  onMovieClick: (movieId: string) => void;
  onPlayClick: (movieId: string) => void;
  onToggleWatchlist: (movieId: string) => void;
}

export default function HeroSection({
  movies,
  watchlistIds,
  onMovieClick,
  onPlayClick,
  onToggleWatchlist
}: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spotlightMovies = movies.filter(m => m.isTrending).slice(0, 4);

  // Auto slide effect
  useEffect(() => {
    if (spotlightMovies.length <= 1) return;

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % spotlightMovies.length);
      }, 7000);
    };

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [spotlightMovies.length]);

  if (spotlightMovies.length === 0) {
    return null;
  }

  const currentMovie = spotlightMovies[currentIndex];
  const isInWatchlist = watchlistIds.includes(currentMovie.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + spotlightMovies.length) % spotlightMovies.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % spotlightMovies.length);
  };

  return (
    <section 
      id="hero-banner-slider" 
      className="relative w-full h-[36rem] md:h-[42rem] lg:h-[46rem] bg-slate-950 overflow-hidden select-none group/hero"
    >
      {/* Background slide */}
      <div className="absolute inset-0 w-full h-full">
        <img
          id={`hero-backdrop-${currentMovie.id}`}
          src={getOptimizedImageUrl(currentMovie.backdrop, 1200)}
          alt={currentMovie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transform scale-100 transition-all duration-1000 ease-out"
        />
        {/* Dark overlays to ensure text readability */}
        <div className={`absolute inset-0 ${styles.backdropGradient}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
      </div>

      {/* Hero Movie Details Panel */}
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 md:mt-20">
          <div className="max-w-2xl space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-600">
            {/* Status indicators */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-[#ef4444] px-3 py-1 text-xs font-black tracking-wider text-white uppercase animate-pulse">
                BẢN HOT TRENDING
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-400">
                ⭐ {currentMovie.imdb} IMDb
              </span>
              <span className="inline-flex items-center rounded-md bg-slate-900/80 border border-slate-800 px-2 py-0.5 text-xs text-slate-300 font-medium">
                {currentMovie.quality}
              </span>
              <span className="inline-flex items-center rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs text-slate-300">
                {currentMovie.language}
              </span>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 
                onClick={() => onMovieClick(currentMovie.id)}
                className="cursor-pointer text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-none hover:text-red-500 transition-colors"
              >
                {currentMovie.title}
              </h1>
              <p className="text-sm md:text-lg font-medium text-slate-400 font-mono italic">
                {currentMovie.originalTitle}
              </p>
            </div>

            {/* Quick stats tags */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs md:text-sm text-slate-300">
              <span className="flex items-center space-x-1 font-semibold">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Năm: {currentMovie.year}</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Thời lượng: {currentMovie.duration} phút</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold">
                <Eye className="h-4 w-4 text-slate-400" />
                <span>Lượt xem: {currentMovie.views.toLocaleString('vi-VN')}</span>
              </span>
            </div>

            {/* Synopsis info */}
            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-xl line-clamp-3 md:line-clamp-4">
              {currentMovie.synopsis}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id={`hero-play-btn-${currentMovie.id}`}
                onClick={() => onPlayClick(currentMovie.id)}
                className={`flex items-center space-x-2 bg-[#ef4444] hover:bg-red-600 text-white rounded-full px-6 py-3.5 text-sm font-bold tracking-wide transition-all scale-100 active:scale-95 ${styles.glowingButton}`}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>XEM PHIM NGAY</span>
              </button>

              <button
                id={`hero-details-btn-${currentMovie.id}`}
                onClick={() => onMovieClick(currentMovie.id)}
                className="flex items-center space-x-1 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-800 rounded-full px-5 py-3.5 text-sm font-semibold transition-all"
              >
                <span>Chi tiết phim</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                id={`hero-watchlist-btn-${currentMovie.id}`}
                onClick={() => onToggleWatchlist(currentMovie.id)}
                className={`flex items-center justify-center p-3.5 rounded-full border transition-all ${
                  isInWatchlist
                    ? 'bg-slate-900 border-red-500 text-red-500'
                    : 'bg-slate-900/60 border-slate-700 hover:border-slate-500 text-slate-200'
                }`}
                title={isInWatchlist ? "Bỏ khỏi danh sách của tôi" : "Thêm vào danh sách của tôi"}
              >
                {isInWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Left/Right Arrow triggers */}
      <button
        id="hero-slider-prev-arrow"
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900/90 transition-all opacity-0 group-hover/hero:opacity-100 z-10"
        title="Phim trước"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        id="hero-slider-next-arrow"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900/90 transition-all opacity-0 group-hover/hero:opacity-100 z-10"
        title="Phim sau"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Navigation circles (Dots) */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center space-x-2.5">
        {spotlightMovies.map((m, idx) => (
          <button
            key={m.id}
            id={`hero-slide-dot-${idx}`}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-[#ef4444]' : 'w-2.5 bg-slate-600/60 hover:bg-slate-400'
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
