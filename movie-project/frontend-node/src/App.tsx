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

        // CHUẨN HÓA DỮ LIỆU ĐẦY ĐỦ ĐỂ CUNG CẤP CHO CÁC HÀNG PHIM TRANG CHỦ
        const normalize = (movie: any) => ({
          ...movie,
          id: movie.id || movie._id,
          year:
            movie.year ||
            movie.releaseYear ||
            (movie.releaseDate
              ? new Date(movie.releaseDate).getFullYear()
              : 1994),
          views: movie.views || movie.viewCount || 0,
          category:
            (Array.isArray(movie.genres) && movie.genres.length > 0
              ? movie.genres[0].name || movie.genres[0]
              : movie.category) || "Hành Động",
          director: movie.director || "Đang cập nhật",
          actors: Array.isArray(movie.actors)
            ? movie.actors
            : ["Đang cập nhật"],
          originalTitle: movie.originalTitle || movie.title || "",
          rating: movie.rating
            ? {
                average:
                  movie.rating.average !== undefined
                    ? Number(movie.rating.average)
                    : 8.5,
                count: movie.rating.count || 100,
              }
            : { average: 8.5, count: 100 },
          imdb:
            movie.rating?.average !== undefined
              ? Number(movie.rating.average)
              : 8.5,
          poster:
            movie.poster ||
            "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400",
          backdrop:
            movie.backdrop ||
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
          videoUrl: movie.videoUrl || movie.trailer || "",
          isNew: movie.isNew !== undefined ? movie.isNew : true, // Ép mặc định true nếu DB không có để hiển thị hàng phim mới
          isTrending: movie.isTrending !== undefined ? movie.isTrending : true, // Ép mặc định true để hiển thị hàng thịnh hành
          duration: movie.duration || 120,
        });

        const formattedMovies = rawMovies.map((movie: any) => normalize(movie));

        // Quyết định làm sạch danh sách hay nối tiếp mảng phim
        if (fetchPage === 1) {
          setMovies(formattedMovies);
        } else {
          setMovies((prev) => {
            const existingIds = new Set(prev.map((m: any) => m.id));
            const uniqueNewMovies = formattedMovies.filter(
              (m: any) => !existingIds.has(m.id),
            );
            return [...prev, ...uniqueNewMovies];
          });
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
    const movieObj = movies.find((m) => m.id === movieId);
    if (!movieObj) return;

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
      graphqlToggleWatchlist(uid, movieId)
        .then((res) => {
          if (res && res.success) {
            setWatchlistIds(res.watchlistIds || []);
            const action = res.watchlistIds.includes(movieId)
              ? "Thêm"
              : "Loại bỏ";
            showNotification(
              `${action} "${movieObj.title}" vào Danh sách yêu thích.`,
            );
          } else {
            // fallback to local
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
          }
        })
        .catch(() => {
          // network or server error -> fallback to local behavior
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
        });
      return;
    }

    // Local-only behavior
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
  };

  const handleMovieClick = (movieId: string) => {
    navigate(`/phim/${movieId}`); // Thay đổi URL thành /phim/id-cua-phim
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlayClick = (movieId: string) => {
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

  // Categorizations lists for home layout view
  const newMovies = movies.filter((m) => m.isNew);
  const actionMovies = movies.filter(
    (m) => m.category === "Hành Động" || m.category === "Action",
  );
  const theaterHotMovies = movies.filter((m) => (m.views ?? 0) > 180000);
  const topTrendingMovies = movies.filter((m) => m.isTrending);

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
          const normalized = {
            ...m,
            id: m.id || (m as any)._id,
            year:
              (m as any).year ||
              m.releaseYear ||
              (m.releaseDate ? new Date(m.releaseDate).getFullYear() : 1994),
            views: (m as any).views || (m as any).viewCount || 0,
            category:
              (Array.isArray((m as any).genres) && (m as any).genres.length > 0
                ? (m as any).genres[0].name || (m as any).genres[0]
                : (m as any).category) || "Hành Động",
            director: (m as any).director || "Đang cập nhật",
            actors: Array.isArray((m as any).actors)
              ? (m as any).actors
              : ["Đang cập nhật"],
            originalTitle: (m as any).originalTitle || m.title || "",
            rating: m.rating
              ? {
                  average: Number(m.rating.average || 8.5),
                  count: m.rating.count || 100,
                }
              : { average: 8.5, count: 100 },
            imdb:
              m.rating?.average !== undefined ? Number(m.rating.average) : 8.5,
            poster:
              m.poster ||
              "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400",
            backdrop:
              m.backdrop ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
            videoUrl: m.videoUrl || (m as any).trailer || "",
            isNew: (m as any).isNew !== undefined ? (m as any).isNew : true,
            isTrending:
              (m as any).isTrending !== undefined
                ? (m as any).isTrending
                : true,
            duration: m.duration || 120,
          } as Movie;

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
          const normalized = {
            ...m,
            id: m.id || (m as any)._id,
            year:
              (m as any).year ||
              m.releaseYear ||
              (m.releaseDate ? new Date(m.releaseDate).getFullYear() : 1994),
            views: (m as any).views || (m as any).viewCount || 0,
            category:
              (Array.isArray((m as any).genres) && (m as any).genres.length > 0
                ? (m as any).genres[0].name || (m as any).genres[0]
                : (m as any).category) || "Hành Động",
            director: (m as any).director || "Đang cập nhật",
            actors: Array.isArray((m as any).actors)
              ? (m as any).actors
              : ["Đang cập nhật"],
            originalTitle: (m as any).originalTitle || m.title || "",
            rating: m.rating
              ? {
                  average: Number(m.rating.average || 8.5),
                  count: m.rating.count || 100,
                }
              : { average: 8.5, count: 100 },
            imdb:
              m.rating?.average !== undefined ? Number(m.rating.average) : 8.5,
            poster:
              m.poster ||
              "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400",
            backdrop:
              m.backdrop ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
            videoUrl: m.videoUrl || (m as any).trailer || "",
            isNew: (m as any).isNew !== undefined ? (m as any).isNew : true,
            isTrending:
              (m as any).isTrending !== undefined
                ? (m as any).isTrending
                : true,
            duration: m.duration || 120,
          } as Movie;

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
        bookmarkCount={watchlistIds.length}
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
                watchlistMovies={watchlistMovies}
                watchlistIds={watchlistIds}
                newMovies={newMovies}
                topTrendingMovies={topTrendingMovies}
                theaterHotMovies={theaterHotMovies}
                actionMovies={actionMovies}
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
