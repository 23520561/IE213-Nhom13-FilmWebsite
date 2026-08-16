import { useEffect, useState } from "react";
import { Movie, User } from "../types";
import { graphqlGetUserRecommendations } from "../services/graphql";
import { normalizeMovie } from "../utils/normalizeMovie";

const useRecommendations = function (currentUser: User) {
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  // Khi currentUser thay đổi (login/logout), gọi API gợi ý ngay lập tức
  useEffect(() => {
    let mounted = true;
    async function loadRecommendations() {
      if (!currentUser) {
        if (mounted) setRecommendedMovies([]);
        return;
      }
      try {
        const uid =
          (currentUser as any)?.id || (currentUser as any)?._id || null;
        if (!uid) {
          if (mounted) setRecommendedMovies([]);
          return;
        }
        const recs = (await graphqlGetUserRecommendations(uid, 8)) as any[];
        const recMovies: Movie[] = (recs || [])
          .map((r) => r && r.movie)
          .filter(Boolean)
          .map((m: any) => normalizeMovie(m));

        if (mounted) {
          setRecommendedMovies(recMovies);
        }
      } catch (err) {
        console.error("Failed to load recommendations on auth change:", err);
        if (mounted) setRecommendedMovies([]);
      }
    }

    loadRecommendations();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  return { recommendedMovies };
};
export default useRecommendations;
