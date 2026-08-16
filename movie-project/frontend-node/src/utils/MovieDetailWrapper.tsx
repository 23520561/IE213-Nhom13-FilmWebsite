import { useParams } from "react-router-dom";
import { Movie } from "../types";
import { useEffect, useState } from "react";
import { graphqlGetMovieById } from "../services/graphql";
import MovieDetail from "../components/MovieDetail";
import { normalizeMovie } from "./normalizeMovie";
const MovieDetailWrapper = ({
  watchlistIds,
  handlePlayClick,
  handleToggleWatchlist,
  handleMovieClick,
  showNotification,
}: {
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
    let mounted = true;

    async function load() {
      if (!id) return;
      setLoadingDetail(true);
      try {
        // 2. Try localStorage cache
        const cachedMovies = JSON.parse(
          localStorage.getItem("movies") || "[]",
        ) as Movie[];

        let localMovie = cachedMovies.find((m) => m.id === id) ?? null;

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
  }, [id]);

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

