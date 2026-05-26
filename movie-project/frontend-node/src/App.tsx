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
  graphqlCreateMovie,
  graphqlUpdateMovie,
  graphqlDeleteMovie,
  graphqlGetAllUsers,
  graphqlGetUserRecommendations,
  graphqlGetFeaturedMovies,
  graphqlGetTopRatedMovies,
  graphqlGetTopNewMovies,
  graphqlCreateWatchHistory,
  graphqlUpdateWatchHistory,
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

// Admin modules lazy loaded for premium production performance setup
const AdminSidebar = React.lazy(
  () => import("./components/admin/AdminSidebar"),
);
const AdminTopbar = React.lazy(() => import("./components/admin/AdminTopbar"));
const AdminMovies = React.lazy(() => import("./components/admin/AdminMovies"));
const AdminUsers = React.lazy(() => import("./components/admin/AdminUsers"));

interface AdminDashboardProps {
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  showNotification: (msg: string) => void;
  currentUser: any;
}

function AdminDashboard({
  movies,
  setMovies,
  showNotification,
  currentUser,
}: AdminDashboardProps) {
  // Thay đổi tab mặc định ban đầu là quản lý phim 'movies' thay vì 'overview'
  const [adminTab, setAdminTab] = useState<"movies" | "users">("movies");
  const [users, setUsers] = useState<any[]>([]); // Khởi tạo state lưu danh sách users từ DB
  const navigate = useNavigate();

  // Khóa bảo mật điều hướng
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      showNotification("Truy cập bị từ chối!");
      navigate("/");
      return;
    }

    // Gọi API lấy danh sách user từ DB ngay khi vào trang Admin
    const fetchUsers = async () => {
      const dbUsers = await graphqlGetAllUsers();
      setUsers(dbUsers);
    };
    fetchUsers();
  }, [currentUser, navigate, showNotification]);

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  // --- Các hàm API giữ nguyên logic cũ ---
  const handleAddMovie = async (newDoc: any) => {
    try {
      showNotification("Đang thêm phim mới...");
      const createdMovie = await graphqlCreateMovie(newDoc);
      setMovies((prev) => [{ ...newDoc, id: createdMovie.id }, ...prev]);
      showNotification(`Đã thêm thành công: "${newDoc.title}"`);
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi thêm phim.");
    }
  };

  const handleEditMovie = async (id: string, updatedData: any) => {
    try {
      showNotification("Đang lưu thay đổi...");
      await graphqlUpdateMovie(id, updatedData);
      setMovies((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m)),
      );
      showNotification("Đã cập nhật phim!");
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi cập nhật.");
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phim này?")) return;
    try {
      showNotification("Đang thực hiện xóa...");
      await graphqlDeleteMovie(id);
      setMovies((prev) => prev.filter((m) => m.id !== id));
      showNotification("Đã xóa phim thành công.");
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi xóa phim.");
    }
  };

  return (
    <div className="flex bg-[#0f172a] text-slate-100 min-h-screen font-sans overflow-hidden text-left fixed inset-0 z-50">
      <AdminSidebar
        activeTab={adminTab}
        setActiveTab={setAdminTab}
        onExitAdmin={() => {
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#f8fafc]">
        <AdminTopbar
          currentTabName={
            adminTab === "movies"
              ? "Quản lý kho phim"
              : "Danh sách người dùng đăng ký"
          }
          currentUser={currentUser}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 font-sans">
          {adminTab === "movies" ? (
            <AdminMovies
              movies={movies}
              onAddMovie={handleAddMovie}
              onEditMovie={handleEditMovie}
              onDeleteMovie={handleDeleteMovie}
            />
          ) : (
            <AdminUsers users={users} /> // Truyền danh sách user thật xuống
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  // 1. Khởi tạo danh sách phim là mảng rỗng [] thay vì dùng MOCK_MOVIES
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Khởi tạo State lưu thông tin User hiện tại từ LocalStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("cinemax_user_info");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

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
              await graphqlUpdateWatchHistory(idMap[e.movieId], e.watchedTime, e.duration, e.isFinished);
            } else {
              const res = await graphqlCreateWatchHistory(e.movieId, e.watchedTime || 0, e.duration || 0, !!e.isFinished);
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

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<"overview" | "movies" | "users">(
    "overview",
  );
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  // Section-specific lists (server-backed where possible)
  const [sectionNewMovies, setSectionNewMovies] = useState<Movie[]>([]);
  const [sectionActionMovies, setSectionActionMovies] = useState<Movie[]>([]);
  const [sectionTheaterHotMovies, setSectionTheaterHotMovies] = useState<
    Movie[]
  >([]);

  // Normalize movie shape for use across multiple effects/components
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

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    category: "Tất Cả",
    year: "Tất Cả",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const prevFiltersRef = React.useRef(filters); // Dùng để theo dõi khi bộ lọc thay đổi

  // 2. Tự động gọi API khi chạy ứng dụng
  // 2. Tự động gọi API khi chạy ứng dụng và khi bộ lọc/trang thay đổi
  useEffect(() => {
    async function fetchBackendMovies() {
      try {
        // Kiểm tra xem người dùng vừa đổi bộ lọc hay vừa bấm Tải thêm
        const isFilterChanged =
          prevFiltersRef.current.category !== filters.category ||
          prevFiltersRef.current.year !== filters.year ||
          prevFiltersRef.current.searchQuery !== filters.searchQuery;

        let fetchPage = currentPage;

        if (isFilterChanged) {
          fetchPage = 1;
          setCurrentPage(1); // Đưa số trang về 1
          prevFiltersRef.current = filters; // Cập nhật bộ theo dõi lọc
          setLoading(true); // Hiển thị trạng thái tải dữ liệu lớn
        } else {
          if (fetchPage > 1) setIsFetchingMore(true);
        }

        const queryParams: any = {
          limit: 50,
          page: fetchPage,
        };

        if (filters.category !== "Tất Cả")
          queryParams.category = filters.category;
        if (filters.year !== "Tất Cả") queryParams.year = filters.year;
        if (filters.searchQuery.trim() !== "")
          queryParams.searchQuery = filters.searchQuery;

        console.log("Gửi yêu cầu lọc tới Backend với tham số:", queryParams);
        const data = (await graphqlGetMovies(queryParams)) as any;
        const rawMovies = data?.movies || (Array.isArray(data) ? data : []);

        // Nếu dữ liệu trả về ít hơn 50 phim nghĩa là database đã hết phim để tải tiếp
        if (rawMovies.length < 50) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        const formattedMovies: Movie[] = rawMovies.map((movie: any) =>
          normalizeMovie(movie),
        );

        // Compute most recent release year across fetched movies and mark `isNew`
        const maxYear =
          formattedMovies.reduce(
            (acc, m) => Math.max(acc, Number(m.year || 0)),
            0,
          ) || undefined;
        const finalMovies: Movie[] = formattedMovies.map((m) => ({
          ...m,
          isNew: maxYear ? Number(m.year) === Number(maxYear) : false,
        }));

        // Quyết định làm sạch danh sách hay nối tiếp mảng phim
        if (fetchPage === 1) {
          setMovies(finalMovies);
        } else {
          setMovies((prev) => {
            const existingIds = new Set(prev.map((m: any) => m.id));
            const uniqueNewMovies = finalMovies.filter(
              (m: any) => !existingIds.has(m.id),
            );
            return [...prev, ...uniqueNewMovies];
          });
        }

        // Populate section-level lists from server where possible
        try {
          const [featuredSrv, topRatedSrv, topNewSrv, actionSrv] =
            await Promise.all([
              graphqlGetFeaturedMovies(12),
              graphqlGetTopRatedMovies(12),
              graphqlGetTopNewMovies(12),
              // action uses GetMovies as server may not provide dedicated endpoint
              graphqlGetMovies({ limit: 12, page: 1, category: "Hành Động" }),
            ]);
          const normalizedFeatured = (featuredSrv || []).map((mm: any) =>
            normalizeMovie(mm),
          );
          const normalizedTopRated = (topRatedSrv || []).map((mm: any) =>
            normalizeMovie(mm),
          );
          const normalizedAction = (actionSrv || []).map((mm: any) =>
            normalizeMovie(mm),
          );

          const normalizedTopNew = (topNewSrv || []).map((mm: any) =>
            normalizeMovie(mm),
          );

          try {
            // debug: log first ids to help diagnose identical lists
            // eslint-disable-next-line no-console
            console.log(
              "[SECTION DEBUG] featured ids:",
              normalizedFeatured.map((m) => m.id).slice(0, 5),
            );
            // eslint-disable-next-line no-console
            console.log(
              "[SECTION DEBUG] topNew ids:",
              normalizedTopNew.map((m) => m.id).slice(0, 5),
            );
            // eslint-disable-next-line no-console
            console.log(
              "[SECTION DEBUG] topRated ids:",
              normalizedTopRated.map((m) => m.id).slice(0, 5),
            );
            // eslint-disable-next-line no-console
            console.log(
              "[SECTION DEBUG] action ids:",
              normalizedAction.map((m) => m.id).slice(0, 5),
            );
          } catch (e) {
            /* ignore */
          }

          setSectionNewMovies(
            // prefer server-provided topNew, otherwise most-recent releaseYear
            (normalizedTopNew.length > 0
              ? normalizedTopNew
              : finalMovies.filter((m) => m.isNew)
            ).slice(0, 12),
          );
          // Theater hot should use server topRated when available
          const theaterSource =
            normalizedTopRated.length > 0 ? normalizedTopRated : finalMovies;
          setSectionTheaterHotMovies(theaterSource.slice(0, 12));
          setSectionActionMovies(
            (normalizedAction.length > 0
              ? normalizedAction
              : formattedMovies.filter(
                  (m) => m.category === "Hành Động" || m.category === "Action",
                )
            ).slice(0, 12),
          );
        } catch (err) {
          // fallback to client-side slicing
          // compute isNew based on most recent releaseYear if not computed
          const fallbackMaxYear =
            formattedMovies.reduce(
              (acc, m) => Math.max(acc, Number(m.year || 0)),
              0,
            ) || undefined;
          const fallbackMovies = formattedMovies.map((m) => ({
            ...m,
            isNew: fallbackMaxYear
              ? Number(m.year) === Number(fallbackMaxYear)
              : false,
          }));

          setSectionNewMovies(
            fallbackMovies.filter((m) => m.isNew).slice(0, 12),
          );
          setSectionTheaterHotMovies(
            fallbackMovies.filter((m) => (m.views ?? 0) > 180000).slice(0, 12),
          );
          setSectionActionMovies(
            fallbackMovies
              .filter(
                (m) => m.category === "Hành Động" || m.category === "Action",
              )
              .slice(0, 12),
          );
        }
        // If user is logged in, fetch personalized recommendations
        try {
          if (currentUser && (currentUser as any).id) {
            const recs = (await graphqlGetUserRecommendations(
              (currentUser as any).id,
              8,
            )) as any[];
            // convert recommendations into Movie[] (take rec.movie)
            const recMovies: Movie[] = recs
              .map((r) => r.movie)
              .filter(Boolean)
              .map((m: any) => normalizeMovie(m));
            setRecommendedMovies(recMovies);
            try {
              // debug: inspect recommended payload structure in browser console
              // eslint-disable-next-line no-console
              console.log(
                "[DEBUG] recommendedMovies (fetch):",
                recMovies.slice(0, 8),
              );
            } catch (e) {
              /* ignore */
            }
          } else {
            setRecommendedMovies([]);
          }
        } catch (err) {
          console.error("Failed to load recommendations", err);
          setRecommendedMovies([]);
        }
      } catch (error) {
        console.error("Không thể kết nối với Backend hoặc lỗi GraphQL:", error);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    }

    fetchBackendMovies();
  }, [filters, currentPage]);
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

  // Persistence for movies list
  useEffect(() => {
    localStorage.setItem("cinemax_movies_persist", JSON.stringify(movies));
  }, [movies]);

  const showNotification = (message: string) => {
    setNotification(message);
    const soundTimeout = setTimeout(() => {
      setNotification(null);
    }, 3500);
    return () => clearTimeout(soundTimeout);
  };

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
      const duration = (m && (m.duration || m.duration === 0) ? Number(m.duration) : 0) || 0;
      // fire-and-forget
      graphqlCreateWatchHistory(movieId, 0, duration, false)
        .then((res) => {
          try {
            if (res && res.id) {
              const mapRaw = localStorage.getItem("cinemax_watchhistory_map") || "{}";
              const idMap = JSON.parse(mapRaw || "{}");
              idMap[movieId] = res.id;
              localStorage.setItem("cinemax_watchhistory_map", JSON.stringify(idMap));
            }
          } catch (e) {
            /* ignore */
          }
        })
        .catch(() => {
          // Save pending local entry to be synced on login
          try {
            const raw = localStorage.getItem("cinemax_local_watchhistory") || "[]";
            const arr = JSON.parse(raw || "[]");
            arr.push({ movieId, watchedTime: 0, duration, isFinished: false });
            localStorage.setItem("cinemax_local_watchhistory", JSON.stringify(arr));
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

  // Watchlist movies matching filtered list
  const watchlistMovies = movies.filter((m) => watchlistIds.includes(m.id));

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
  const newMovies = [...movies].sort((a, b) => {
    const ay = Number(a.year || a.releaseYear || 0);
    const by = Number(b.year || b.releaseYear || 0);
    return by - ay;
  });
  const actionMovies = movies.filter(
    (m) => m.category === "Hành Động" || m.category === "Action",
  );
  const theaterHotMovies = movies.filter((m) => (m.views ?? 0) > 180000);

  // Active movie entity
  // const activeMovie = movies.find((m) => m.id === selectedMovieId) || movies[0];

  const hasActiveFilters =
    filters.searchQuery.trim().length > 0 ||
    filters.category !== "Tất Cả" ||
    filters.year !== "Tất Cả";

  // Tự động quay về trang chủ CHỈ KHI người dùng tương tác thay đổi bộ lọc
  useEffect(() => {
    // Nếu có bộ lọc và hiện tại không ở trang chủ thì mới đưa về
    if (hasActiveFilters && window.location.pathname !== "/") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [filters]);

  // Global safeguard: prevent native form submissions from causing full-page reloads
  // This ensures any accidental submit (e.g., button without type inside a form)
  // won't trigger a navigation; React onSubmit handlers still run.
  useEffect(() => {
    const onSubmit = (e: Event) => {
      try {
        e.preventDefault();
      } catch (err) {
        /* ignore */
      }
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  // ================= COMPONENT ĐỆM (WRAPPERS) =================
  const MovieDetailWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const [activeMovie, setActiveMovie] = React.useState<Movie | null>(null);
    const [loadingDetail, setLoadingDetail] = React.useState(false);

    useEffect(() => {
      let mounted = true;
      const local = movies.find((m) => m.id === id);
      if (local) {
        setActiveMovie(local);
        return;
      }

      async function load() {
        if (!id) return;
        setLoadingDetail(true);
        try {
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
    }, [id, movies]);

    if (loadingDetail)
      return (
        <div className="p-20 text-white text-center">Đang nạp phim...</div>
      );
    if (!activeMovie)
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

  const VideoPlayerWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const [activeMovie, setActiveMovie] = React.useState<Movie | null>(null);
    const [loadingPlayer, setLoadingPlayer] = React.useState(false);

    useEffect(() => {
      let mounted = true;
      const local = movies.find((m) => m.id === id);
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
      return (
        <div className="p-20 text-white text-center">Đang nạp phim...</div>
      );
    if (!activeMovie)
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
        setFilters={setFilters}
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
              <HomeView
                movies={movies}
                recommendedMovies={recommendedMovies}
                watchlistMovies={watchlistMovies}
                watchlistIds={watchlistIds}
                newMovies={sectionNewMovies}
                theaterHotMovies={sectionTheaterHotMovies}
                actionMovies={sectionActionMovies}
                hasActiveFilters={hasActiveFilters}
                filters={filters}
                setFilters={setFilters}
                filteredMovies={filteredMovies}
                handleMovieClick={handleMovieClick}
                handlePlayClick={handlePlayClick}
                handleToggleWatchlist={handleToggleWatchlist}
                showNotification={showNotification}
                hasMore={hasMore}
                isFetchingMore={isFetchingMore}
                onLoadMore={() => setCurrentPage((prev) => prev + 1)}
              />
            }
          />

          {/* 2. ĐƯỜNG DẪN CHI TIẾT PHIM */}
          <Route path="/phim/:id" element={<MovieDetailWrapper />} />

          {/* 3. ĐƯỜNG DẪN TRÌNH PHÁT VIDEO */}
          <Route path="/xem-phim/:id" element={<VideoPlayerWrapper />} />
          <Route
            path="/admin/*"
            element={
              <AdminDashboard
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
