import { useRef, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';
import MovieCard from './MovieCard';
import styles from '../styles.module.css';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  watchlistIds: string[];
  onMovieClick: (movieId: string) => void;
  onPlayClick: (movieId: Movie) => void;
  onToggleWatchlist: (movieId: Movie) => void;
}

function MovieRow({
  title,
  subtitle,
  movies,
  watchlistIds,
  onMovieClick,
  onPlayClick,
  onToggleWatchlist
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      const targetScroll = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      
      rowRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="relative space-y-3 py-4">
      {/* Row Header info */}
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-8">
        <div className="space-y-1 text-left">
          <h2 className="text-lg sm:text-xl font-bold border-l-4 border-[#ef4444] pl-3 uppercase tracking-wider text-slate-150">
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>

        {/* Desktop scroll arrows */}
        {movies.length > 4 && (
          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Cuộn sang phải"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Row Body cards container slider */}
      <div className="relative group/row">
        <div
          ref={rowRef}
          className={`flex overflow-x-auto gap-4 px-4 sm:px-6 lg:px-8 pb-4 scroll-smooth ${styles.customScrollbar}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              className="w-44 sm:w-52 md:w-56 flex-shrink-0"
            >
              <MovieCard
                movie={movie}
                isInWatchlist={watchlistIds.includes(movie.id)}
                onMovieClick={onMovieClick}
                onPlayClick={onPlayClick}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(MovieRow);
