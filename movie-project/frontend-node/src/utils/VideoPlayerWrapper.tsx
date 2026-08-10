import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import { graphqlGetMovieById } from "../services/graphql";
import { Movie } from "../types";
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

const VideoPlayerWrapper = ({ movies }: { movies: Movie[] }) => {
  const { id } = useParams<{ id: string }>();
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const navigate = useNavigate();
  const [notification, setNotification] = useState<string | null>(null);
  const showNotification = (message: string) => {
    setNotification(message);
    const soundTimeout = setTimeout(() => {
      setNotification(null);
    }, 3500);
    return () => clearTimeout(soundTimeout);
  };
  useEffect(() => {
    let mounted = true;
    const local = (movies || []).find((m) => m.id === id);
    if (local) {
      setActiveMovie(local);
      return;
    }

    async function load() {
      if (!id) return;
      setLoadingPlayer(true);
      try {
        const m = await graphqlGetMovieById(id);
        if (!mounted) return;
        if (!m) {
          setActiveMovie(null);
          return;
        }
        const normalized = normalizeMovie(m);
        setActiveMovie(normalized);
      } catch (err) {
        console.error("Failed to load movie for player:", err);
        setActiveMovie(null);
      } finally {
        setLoadingPlayer(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id, movies]);

  if (loadingPlayer)
    return <div className="p-20 text-white text-center">Đang nạp phim...</div>;
  else if (!activeMovie)
    return (
      <div className="p-20 text-white text-center">Không tìm thấy phim!</div>
    );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <VideoPlayer
        movie={activeMovie}
        onGoBack={() => {
          navigate(`/phim/${id}`);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onShowNotification={showNotification}
      />
    </div>
  );
};
export default VideoPlayerWrapper;
