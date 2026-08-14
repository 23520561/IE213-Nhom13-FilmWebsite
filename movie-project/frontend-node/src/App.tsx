import React, { useState, useEffect } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom"; // Import các công cụ quản lý URL
import { Movie, FilterState, User } from "./types";
import Header from "./components/Header";
import MovieDetail from "./components/MovieDetail";
import VideoPlayer from "./components/VideoPlayer";
import HomeView from "./components/HomeView";
import {
  graphqlGetMovies,
  graphqlGetMovieById,
  graphqlToggleWatchlist,
  graphqlGetUserRecommendations,
  graphqlGetFeaturedMovies,
  graphqlGetTopRatedMovies,
  graphqlGetTopNewMovies,
  graphqlCreateWatchHistory,
  graphqlUpdateWatchHistory,
  graphqlGetAllComments,
  graphqlDeleteComment,
  graphqlUpdateUserStatus,
} from "./services/graphql";
import {
  Bookmark,
  Star,
  Play,
  PlayCircle,
  Eye,
  Calendar,
  Grid2X2,
  ArrowRightLeft,
  RefreshCw,
  Layers,
  Sparkles,
  Film,
  Shield,
} from "lucide-react";
import styles from "./styles.module.css";
import MovieDetailWrapper from "./utils/ MovieDetailWrapper";
import VideoPlayerWrapper from "./utils/VideoPlayerWrapper";
import { AdminPage } from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import { normalizeMovie } from "./utils/normalizeMovie";

export default function App() {
  // 1. Khởi tạo danh sách phim là mảng rỗng [] thay vì dùng MOCK_MOVIES
  const [movies, setMovies] = useState<Movie[]>([]);

  // Khởi tạo State lưu thông tin User hiện tại từ LocalStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("cinemax_user_info");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);

    // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    category: "Tất Cả",
    year: "Tất Cả",
  });

  const [currentPage, setCurrentPage] = useState(1);
  function updateFilters(query: FilterState) {
    setFilters(query);
    setCurrentPage(1);
  }
  function updatePage(n: number) {
    setCurrentPage(n);
  }

  // Lưu tự động mỗi khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("cinemax_user_info", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("cinemax_user_info");
    }
  }, [currentUser]);

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
          try {
            // debug: inspect recommended payload structure in browser console
            // eslint-disable-next-line no-console
            console.log(
              "[DEBUG] recommendedMovies (auth-change):",
              recMovies.slice(0, 8),
            );
          } catch (e) {
            /* ignore */
          }
        }
      } catch (err) {
        console.error("Failed to load recommendations on auth change:", err);
        if (mounted) setRecommendedMovies([]);
      }
    }

    loadRecommendations();
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
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  // Watch list state loaded from localStorage
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

  const navigate = useNavigate();

  // Notification message alerts state
  const [notification, setNotification] = useState<string | null>(null);

  // Persistence for user bookmarking list
  useEffect(() => {
    localStorage.setItem("cinemax_watchlist", JSON.stringify(watchlistIds));
  }, [watchlistIds]);

  const showNotification = (message: string) => {
    setNotification(message);
    const soundTimeout = setTimeout(() => {
      setNotification(null);
    }, 3500);
    return () => clearTimeout(soundTimeout);
  };
  // Watchlist movies matching filtered list
  const watchlistMovies = movies.filter((m) => watchlistIds.includes(m.id));

  const handleToggleWatchlist = (movieId: string) => {
    // Find the movie across known lists (main list, recommended, or section lists)
    const movieObj =
      movies.find((m) => m.id === movieId) ||
      recommendedMovies.find((m) => m.id === movieId) ||
      sectionNewMovies.find((m) => m.id === movieId) ||
      sectionActionMovies.find((m) => m.id === movieId) ||
      sectionTheaterHotMovies.find((m) => m.id === movieId) ||
      watchlistMovies.find((m) => m.id === movieId) ||
      // last-resort: minimal object so notifications still show
      ({ id: movieId, title: "(Phim)" } as Movie);

    // helper: ensure movie object exists in main `movies` state so watchlist UI can render it
    const ensureMovieInState = (m: Movie | undefined) => {
      if (!m) return;
      if (!movies.some((x) => x.id === m.id)) {
        setMovies((prev) => [...prev, m]);
      }
    };

    // If user is logged in, attempt server-side toggle; otherwise fall back to localStorage
    if (currentUser) {
      // currentUser may come from different shapes depending on auth flow; normalize to string id
      const uid =
        (currentUser as any)?.id ||
        (currentUser as any)?._id ||
        String((currentUser as any)?.numerical_id || "");
      if (!uid) {
        // fallback to local-only
        if (watchlistIds.includes(movieId)) {
          setWatchlistIds((prev) => prev.filter((id) => id !== movieId));
          showNotification(
            `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
          );
        } else {
          setWatchlistIds((prev) => [...prev, movieId]);
          showNotification(
            `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
          );
        }
        return;
      }
      const currentlyIn = watchlistIds.includes(movieId);
      graphqlToggleWatchlist(uid, movieId)
        .then((res) => {
          if (res && res.success) {
            setWatchlistIds(res.watchlistIds || []);
            const added =
              (res.watchlistIds || []).includes(movieId) && !currentlyIn;
            if (added) ensureMovieInState(movieObj as Movie);
            const action = (res.watchlistIds || []).includes(movieId)
              ? "Thêm"
              : "Loại bỏ";
            showNotification(
              `${action} "${movieObj.title}" vào Danh sách yêu thích.`,
            );
          } else {
            // fallback to local
            if (currentlyIn) {
              setWatchlistIds((prev) => prev.filter((id) => id !== movieId));
              showNotification(
                `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
              );
            } else {
              setWatchlistIds((prev) => [...prev, movieId]);
              ensureMovieInState(movieObj as Movie);
              showNotification(
                `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
              );
            }
          }
        })
        .catch(() => {
          // network or server error -> fallback to local behavior
          if (currentlyIn) {
            setWatchlistIds((prev) => prev.filter((id) => id !== movieId));
            showNotification(
              `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
            );
          } else {
            setWatchlistIds((prev) => [...prev, movieId]);
            ensureMovieInState(movieObj as Movie);
            showNotification(
              `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
            );
          }
        });
      return;
    }

    // Local-only behavior
    const currentlyInLocal = watchlistIds.includes(movieId);
    if (currentlyInLocal) {
      setWatchlistIds((prev) => prev.filter((id) => id !== movieId));
      showNotification(
        `Đã loại bỏ "${movieObj.title}" khỏi Danh sách yêu thích.`,
      );
    } else {
      setWatchlistIds((prev) => [...prev, movieId]);
      ensureMovieInState(movieObj as Movie);
      showNotification(
        `Đã thêm "${movieObj.title}" vào Danh sách yêu thích thành công!`,
      );
    }
  };

  const handleMovieClick = (movieId: string) => {
    navigate(`/phim/${movieId}`); // Thay đổi URL thành /phim/id-cua-phim
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlayClick = (movieId: string) => {
    // Record watch start (fire-and-forget). Prefer movie duration from known lists.
    try {
      const m =
        movies.find((m) => m.id === movieId) ||
        recommendedMovies.find((m) => m.id === movieId) ||
        sectionNewMovies.find((m) => m.id === movieId) ||
        sectionActionMovies.find((m) => m.id === movieId) ||
        sectionTheaterHotMovies.find((m) => m.id === movieId);
      const duration =
        (m && (m.duration || m.duration === 0) ? Number(m.duration) : 0) || 0;
      // fire-and-forget
      graphqlCreateWatchHistory(movieId, 0, duration, false)
        .then((res) => {
          try {
            if (res && res.id) {
              const mapRaw =
                localStorage.getItem("cinemax_watchhistory_map") || "{}";
              const idMap = JSON.parse(mapRaw || "{}");
              idMap[movieId] = res.id;
              localStorage.setItem(
                "cinemax_watchhistory_map",
                JSON.stringify(idMap),
              );
            }
          } catch (e) {
            /* ignore */
          }
        })
        .catch(() => {
          // Save pending local entry to be synced on login
          try {
            const raw =
              localStorage.getItem("cinemax_local_watchhistory") || "[]";
            const arr = JSON.parse(raw || "[]");
            arr.push({ movieId, watchedTime: 0, duration, isFinished: false });
            localStorage.setItem(
              "cinemax_local_watchhistory",
              JSON.stringify(arr),
            );
          } catch (e) {
            /* ignore */
          }
        });
    } catch (e) {
      /* ignore */
    }
    navigate(`/xem-phim/${movieId}`); // Thay đổi URL thành /xem-phim/id-cua-phim
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoHome = () => {
    navigate("/"); // Trở về URL trang chủ
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Determine active dynamic film list depending on multi-dimensional filters
  const filteredMovies = movies;

  // Sanitize stored watchlist ids against currently loaded movies
  useEffect(() => {
    if (!movies || movies.length === 0) return;
    setWatchlistIds((prev) => {
      const filtered = prev.filter((id) => movies.some((m) => m.id === id));
      if (filtered.length !== prev.length) {
        // persist cleaned list
        localStorage.setItem("cinemax_watchlist", JSON.stringify(filtered));
        // Inform user only if notification system is available
        try {
          showNotification(
            "Đã loại bỏ mục không hợp lệ trong Danh sách yêu thích.",
          );
        } catch (e) {
          // ignore if not ready
        }
      }
      return filtered;
    });
  }, [movies]);

  // Categorizations lists for home layout view
  // const newMovies = [...movies].sort((a, b) => {
  //   const ay = Number(a.year || a.releaseYear || 0);
  //   const by = Number(b.year || b.releaseYear || 0);
  //   return by - ay;
  // });
  // const actionMovies = movies.filter(
  //   (m) => m.category === "Hành Động" || m.category === "Action",
  // );
  // const theaterHotMovies = movies.filter((m) => (m.views ?? 0) > 180000);

  // Active movie entity
  // const activeMovie = movies.find((m) => m.id === selectedMovieId) || movies[0];

  // const hasActiveFilters =
  //   filters.searchQuery.trim().length > 0 ||
  //   filters.category !== "Tất Cả" ||
  //   filters.year !== "Tất Cả";

  // Tự động quay về trang chủ CHỈ KHI người dùng tương tác thay đổi bộ lọc
  // useEffect(() => {
  //   // Nếu có bộ lọc và hiện tại không ở trang chủ thì mới đưa về
  //   if (hasActiveFilters && window.location.pathname !== "/") {
  //     navigate("/");
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // }, [filters]);

    return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Toast Alert pop notification */}
      {notification && (
        <div
          id="toast-notification-panel"
          className="fixed top-6 right-6 z-[120] flex items-center bg-slate-900 border-l-4 border-red-500 py-3.5 px-5 rounded-r-xl shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
            <p className="text-xs sm:text-sm font-bold text-slate-200">
              {notification}
            </p>
          </div>
        </div>
      )}
      {/* Shared Modular Header component */}
      <Header
        currentUser={currentUser}
        onAuthChange={setCurrentUser}
        filters={filters}
        updateFilters={updateFilters}
        bookmarkCount={watchlistMovies.length}
        onGoHome={handleGoHome}
        onGoWatchlist={() => {
          setFilters({
            searchQuery: "",
            category: "Tất Cả",
            year: "Tất Cả",
          });
          navigate("/");
          if (!watchlistIds || watchlistIds.length === 0) {
            showNotification("Danh sách yêu thích của bạn hiện đang trống.");
          } else {
            showNotification(
              `Đang hiển thị danh sách phim yêu thích của bạn (${watchlistIds.length})`,
            );
          }
          // Smooth scroll to watchlist category
          setTimeout(() => {
            const listNode = document.getElementById("my-watchlist-section");
            if (listNode)
              listNode.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 150);
        }}
        onShowNotification={showNotification}
        onOpenAdmin={() => {
          navigate("/admin");
          showNotification("Đã khởi chạy Giao Diện Quản Trị Hệ Thống!");
        }}
      />
      {/* Main content viewport */}
      <main className="flex-1 w-full flex flex-col">
        <Routes>
          {/* 1. ĐƯỜNG DẪN TRANG CHỦ */}
          <Route
            path="/"
            element={
              // <HomeView
              //   movies={movies}
              //   recommendedMovies={recommendedMovies}
              //   watchlistMovies={watchlistMovies}
              //   watchlistIds={watchlistIds}
              //   newMovies={sectionNewMovies}
              //   theaterHotMovies={sectionTheaterHotMovies}
              //   actionMovies={sectionActionMovies}
              //   hasActiveFilters={hasActiveFilters}
              //   filters={filters}
              //   setFilters={setFilters}
              //   filteredMovies={filteredMovies}
              //   handleMovieClick={handleMovieClick}
              //   handlePlayClick={handlePlayClick}
              //   handleToggleWatchlist={handleToggleWatchlist}
              //   showNotification={showNotification}
              //   hasMore={hasMore}
              //   isFetchingMore={isFetchingMore}
              //   onLoadMore={() => setCurrentPage((prev) => prev + 1)}
              // />
              <HomePage
                filters={filters}
                updateFilters={updateFilters}
                currentPage={currentPage}
                updatePage={updatePage}
                recommendedMovies={recommendedMovies}
                watchlistMovies={watchlistMovies}
                watchlistIds={watchlistIds}
                handleMovieClick={handleMovieClick}
                handlePlayClick={handlePlayClick}
                handleToggleWatchlist={handleToggleWatchlist}
                showNotification={showNotification}
                currentUser={currentUser}
              ></HomePage>
            }
          />

          {/* 2. ĐƯỜNG DẪN CHI TIẾT PHIM */}
          <Route
            path="/phim/:id"
            element={
              <MovieDetailWrapper
                movies={movies}
                watchlistIds={watchlistIds}
                handlePlayClick={handlePlayClick}
                handleToggleWatchlist={handleToggleWatchlist}
                handleMovieClick={handleMovieClick}
                showNotification={showNotification}
              />
            }
          />

          {/* 3. ĐƯỜNG DẪN TRÌNH PHÁT VIDEO */}
          <Route
            path="/xem-phim/:id"
            element={<VideoPlayerWrapper movies={movies} />}
          />
          <Route
            path="/admin/*"
            element={
              <AdminPage
                movies={movies}
                setMovies={setMovies}
                showNotification={showNotification}
                currentUser={currentUser}
              />
            }
          />
        </Routes>
      </main>
      {/* FOOTER */}
      <footer
        id="cinemax-footer"
        className="mt-20 border-t border-slate-800/50 bg-[#0b1222] py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Branding */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ef4444] font-bold text-white">
                  <Film className="h-4 w-4" />
                </div>
                <span className="text-[#ef4444] font-black text-xl tracking-tighter">
                  CINEMAX
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                CineMax là nền tảng xem phim lẻ trực tuyến với trải nghiệm Full
                HD, 4K chất lượng cao miễn phí hàng đầu Việt Nam. Website liên
                tục cập nhật phim chiếu rạp mới nhất.
              </p>
            </div>

            {/* Links A */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-black text-slate-350 tracking-wider">
                Thể Loại Lựa Chọn
              </h4>
              <ul className="space-y-2 text-xs text-zinc-550 font-medium">
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: "Action" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Phim Hành Động
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: "Adventure" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Phiêu Lưu / Viễn Tưởng
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: "History" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Phim Cổ Trang / Lịch Sử
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: "Animation" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Hoạt Hình
                  </button>
                </li>
              </ul>
            </div>
            {/* (Removed country links column) */}

            {/* Terms Content */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-black text-slate-350 tracking-wider">
                Chính Sách & Hỗ Trợ
              </h4>
              <ul className="space-y-2 text-xs text-zinc-500 leading-relaxed font-normal">
                <li>
                  <span className="cursor-pointer hover:text-white transition-colors">
                    Điều khoản dịch vụ sử dụng
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-white transition-colors">
                    Chính sách bảo mật thông tin
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-white transition-colors">
                    Bản quyền khiếu nại (DMCA)
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-white transition-colors">
                    Liên hệ hợp tác: admin@cinemax.com
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800/20 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <p className="uppercase tracking-widest text-[11px]">
              © 2026 CINEMAX MEDIA GROUP • TRẢI NGHIỆM ĐIỆN ẢNH ĐÍCH THỰC
            </p>

            <div className="flex items-center space-x-4">
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => {
                    navigate("/admin");
                    window.scrollTo({ top: 0 });
                    showNotification(
                      "Đã truy cập Hệ thống Quản Trị từ lối tắt chân trang!",
                    );
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors text-[10px] font-black border border-blue-500/25 shadow-md shadow-blue-500/5 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Bàn Điều Khiển Admin (Lối tắt)</span>
                </button>
              )}
              <p className="font-mono text-[10px]">
                Local Time: 2026-05-21 UTC
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
