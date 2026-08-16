import { useEffect, useState } from "react";
import { Movie, User } from "../types";
import {
  graphqlCreateWatchHistory,
  graphqlToggleWatchlist,
  graphqlUpdateWatchHistory,
} from "../services/graphql";

const useWatchlist = function (
  currentUser: User,
  movies: Movie[],
  showNotification: (s: string) => () => void,
) {
  // Watchlist movies matching filtered list
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cinemax_watchlist");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  // Persistence for user bookmarking list
  useEffect(() => {
    localStorage.setItem("cinemax_watchlist", JSON.stringify(watchlistIds));
  }, [watchlistIds]);
  // Sanitize stored watchlist ids against currently loaded movies
  useEffect(() => {
    if (!movies || movies.length === 0) return;
    setWatchlistIds((prev) => {
      const filtered = prev.filter((id) => movies.some((m) => m.id === id));
      if (filtered.length !== prev.length) {
        // persist cleaned list
        localStorage.setItem("cinemax_watchlist", JSON.stringify(filtered));
        // Inform user only if notification system is available
        showNotification(
          "Đã loại bỏ mục không hợp lệ trong Danh sách yêu thích.",
        );
      }
      return filtered;
    });
  }, [movies]);
  const handleToggleWatchlist = (movieObj: Movie) => {
    // Find the movie across known lists (main list, recommended, or section lists)
    // last-resort: minimal object so notifications still show
    ({ id: movieObj.id, title: "(Phim)" }) as Movie;

    // If user is logged in, attempt server-side toggle; otherwise fall back to localStorage
    if (currentUser) {
      // currentUser may come from different shapes depending on auth flow; normalize to string id
      const uid =
        (currentUser as any)?.id ||
        (currentUser as any)?._id ||
        String((currentUser as any)?.numerical_id || "");
      if (!uid) {
        // fallback to local-only
        if (watchlistIds.includes(movieObj.id)) {
          setWatchlistIds((prev) => prev.filter((id) => id !== movieObj.id));
          showNotification(
            `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
          );
        } else {
          setWatchlistIds((prev) => [...prev, movieObj.id]);
          showNotification(
            `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
          );
        }
        return;
      }
      const currentlyIn = watchlistIds.includes(movieObj.id);
      graphqlToggleWatchlist(uid, movieObj.id)
        .then((res) => {
          if (res && res.success) {
            setWatchlistIds(res.watchlistIds || []);
            const action = (res.watchlistIds || []).includes(movieObj.id)
              ? "Thêm"
              : "Loại bỏ";
            showNotification(
              `${action} "${movieObj.title}" vào Danh sách yêu thích.`,
            );
          } else {
            // fallback to local
            if (currentlyIn) {
              setWatchlistIds((prev) =>
                prev.filter((id) => id !== movieObj.id),
              );
              showNotification(
                `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
              );
            } else {
              setWatchlistIds((prev) => [...prev, movieObj.id]);
              showNotification(
                `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
              );
            }
          }
        })
        .catch(() => {
          // network or server error -> fallback to local behavior
          if (currentlyIn) {
            setWatchlistIds((prev) => prev.filter((id) => id !== movieObj.id));
            showNotification(
              `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
            );
          } else {
            setWatchlistIds((prev) => [...prev, movieObj.id]);
            showNotification(
              `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
            );
          }
        });
      return;
    }

    // Local-only behavior
    const currentlyInLocal = watchlistIds.includes(movieObj.id);
    if (currentlyInLocal) {
      setWatchlistIds((prev) => prev.filter((id) => id !== movieObj.id));
      showNotification(
        `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
      );
    } else {
      setWatchlistIds((prev) => [...prev, movieObj.id]);
      showNotification(
        `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
      );
    }
  };
  useEffect(() => {
    // After login, attempt to sync any locally saved watch history entries
    async function syncLocalWatchHistory() {
      if (!currentUser) return;
      try {
        const raw = localStorage.getItem("cinemax_local_watchhistory");
        if (!raw) return;
        const entries: Array<any> = JSON.parse(raw || "[]");
        if (!Array.isArray(entries) || entries.length === 0) return;

        const mapRaw = localStorage.getItem("cinemax_watchhistory_map") || "{}";
        const idMap = JSON.parse(mapRaw || "{}");

        for (const e of entries) {
          try {
            // If already mapped, try update, else create
            if (idMap[e.movieId]) {
              // update via API if possible
              await graphqlUpdateWatchHistory(
                idMap[e.movieId],
                e.watchedTime,
                e.duration,
                e.isFinished,
              );
            } else {
              const res = await graphqlCreateWatchHistory(
                e.movieId,
                e.watchedTime || 0,
                e.duration || 0,
                !!e.isFinished,
              );
              if (res && res.id) {
                idMap[e.movieId] = res.id;
              }
            }
          } catch (err) {
            // ignore single entry errors
            console.warn("Failed to sync watch history entry", e.movieId, err);
          }
        }

        // Persist mapping and clear local pending entries
        localStorage.setItem("cinemax_watchhistory_map", JSON.stringify(idMap));
        localStorage.removeItem("cinemax_local_watchhistory");
      } catch (err) {
        console.error("Failed to sync local watch history:", err);
      }
    }

    syncLocalWatchHistory();
  }, [currentUser]);
  return { watchlistIds, setWatchlistIds, handleToggleWatchlist };
};
export default useWatchlist;
