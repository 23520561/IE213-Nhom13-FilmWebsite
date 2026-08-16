import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import { graphqlGetMovieById } from "../services/graphql";
import { Movie } from "../types";
import { normalizeMovie } from "./normalizeMovie";
const VideoPlayerWrapper = () => {
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
  }, [id]);

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
