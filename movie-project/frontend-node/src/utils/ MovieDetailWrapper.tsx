import { useParams } from "react-router-dom";
import { Movie } from "../types";
import { useEffect, useState } from "react";
import { graphqlGetMovieById } from "../services/graphql";
import MovieDetail from "../components/MovieDetail";
const normalizeMovie = (movie: any): Movie =>
  ({
    ...movie,
    id: movie.id || movie._id,
    year:
      movie.releaseYear ||
      (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 1995),
    views: movie.views || movie.viewCount || 0,
    category:
      (Array.isArray(movie.genres) && movie.genres.length > 0
        ? movie.genres[0].name || movie.genres[0]
        : movie.category) || "Hành Động",
    director: movie.director || "Đang cập nhật",
    actors: Array.isArray(movie.actors) ? movie.actors : ["Đang cập nhật"],
    originalTitle: movie.originalTitle || movie.title || "",
    // Support both shapes: { average, count } or numeric average value
    rating:
      typeof movie.rating === "number"
        ? { average: Number(movie.rating), count: 100 }
        : movie.rating
          ? {
              average:
                movie.rating.average !== undefined
                  ? Number(movie.rating.average)
                  : 8.5,
              count: movie.rating.count || 100,
            }
          : { average: 8.5, count: 100 },
    imdb:
      typeof movie.rating === "number"
        ? Number(movie.rating)
        : movie.rating?.average !== undefined
          ? Number(movie.rating.average)
          : 8.5,
    poster:
      movie.poster ||
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400",
    backdrop:
      movie.backdrop ||
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
    videoUrl: movie.videoUrl || movie.trailer || "",
    // Derive trending flag client-side; isNew will be computed per-list
    isNew: false,
    // Trending: simple heuristic based on view count
    isTrending: (() => {
      const views = movie.views || movie.viewCount || 0;
      return Number(views) > 150000;
    })(),
    duration: movie.duration || 120,
  }) as Movie;
const MovieDetailWrapper = ({
  movies,
  watchlistIds,
  handlePlayClick,
  handleToggleWatchlist,
  handleMovieClick,
  showNotification,
}: {
  movies: Movie[];
  watchlistIds: string[];
  handlePlayClick: (movieId: Movie) => void;
  handleToggleWatchlist: (id: Movie) => void;
  handleMovieClick: (movieId: string) => void;
  showNotification: (message: string) => void;
}) => {
  const { id } = useParams<{ id: string }>();
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  useEffect(() => {
    if (movies.length > 0) {
      localStorage.setItem("movies", JSON.stringify(movies));
    }
  }, [movies]);
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!id || activeMovie) return;
      setLoadingDetail(true);
      try {
        // 1. Try current movies state
        let localMovie = (movies || []).find((m) => m.id === id) ?? null;

        // 2. Try localStorage cache
        if (!localMovie) {
          const cachedMovies = JSON.parse(
            localStorage.getItem("movies") || "[]",
          ) as Movie[];

          localMovie = cachedMovies.find((m) => m.id === id) ?? null;
        }

        // 3. Use cached movie if found
        if (localMovie) {
          if (mounted) {
            setActiveMovie(localMovie);
            setLoadingDetail(false);
          }
          return;
        }
        const m = await graphqlGetMovieById(id);
        if (!mounted) return;
        if (!m) {
          setActiveMovie(null);
          return;
        }
        // Normalize same as list
        const normalized = normalizeMovie(m);
        setActiveMovie(normalized);
      } catch (err) {
        console.error("Failed to load movie by id:", err);
        setActiveMovie(null);
      } finally {
        setLoadingDetail(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id, movies, activeMovie]);

  if (loadingDetail) {
    return <div className="p-20 text-white text-center">Đang nạp phim...</div>;
  } else if (!activeMovie)
    return (
      <div className="p-20 text-white text-center">Không tìm thấy phim!</div>
    );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <MovieDetail
        movie={activeMovie}
        allMovies={movies}
        watchlistIds={watchlistIds}
        onPlayClick={handlePlayClick}
        onToggleWatchlist={handleToggleWatchlist}
        onMovieClick={handleMovieClick}
        onShowNotification={showNotification}
      />
    </div>
  );
};
export default MovieDetailWrapper;

