import React, { useState, useEffect } from "react";
import { Routes, Route, useParams } from "react-router-dom"; // Import các công cụ quản lý URL
import { Movie, FilterState } from "./types";
import Header from "./components/Header";
import MovieDetail from "./components/MovieDetail";
import VideoPlayer from "./components/VideoPlayer";
import HomeView from "./components/HomeView";
import { graphqlGetMovies } from "./services/graphql";
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
import { useNavigate } from "react-router-dom";

// Admin modules lazy loaded for premium production performance setup
const AdminSidebar = React.lazy(
  () => import("./components/admin/AdminSidebar"),
);
const AdminTopbar = React.lazy(() => import("./components/admin/AdminTopbar"));
const AdminOverview = React.lazy(
  () => import("./components/admin/AdminOverview"),
);
const AdminMovies = React.lazy(() => import("./components/admin/AdminMovies"));
const AdminUsers = React.lazy(() => import("./components/admin/AdminUsers"));

export default function App() {
  // 1. Khởi tạo danh sách phim là mảng rỗng [] thay vì dùng MOCK_MOVIES
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Khởi tạo State lưu thông tin User hiện tại từ LocalStorage
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
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

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<"overview" | "movies" | "users">(
    "overview",
  );

  // 2. Tự động gọi API khi chạy ứng dụng
  useEffect(() => {
    async function fetchBackendMovies() {
      try {
        setLoading(true);
        // Ép kiểu kết quả trả về thành any để linh hoạt bóc tách dữ liệu mà không bị TypeScript chặn
        const data = (await graphqlGetMovies({})) as any;

        console.log("Dữ liệu gốc từ Backend:", data);

        // Trích xuất mảng phim thực tế dựa theo cấu trúc phân trang của backend
        const rawMovies = data?.movies || (Array.isArray(data) ? data : []);

        // CHUẨN HÓA DỮ LIỆU KHỚP 100% VỚI MONGODB BÊN BACKEND
        const formattedMovies = rawMovies.map((movie: any) => ({
          ...movie,
          // 1. Đồng bộ ID (Mongoose dùng _id, Frontend tìm id)
          id: movie.id || movie._id,

          // 2. Đồng bộ năm phát hành (Backend dùng releaseYear, UI dùng year)
          year: movie.year || movie.releaseYear || 1994,

          // 3. Đồng bộ lượt xem (Database dùng viewCount -> đổi sang views cho UI)
          views: movie.views || movie.viewCount || 0,

          // 4. Đồng bộ các thuộc tính phân loại (Gán mặc định nếu database chưa có)
          category: movie.category || "Hành Động",
          country: movie.country || "Mỹ",
          director: movie.director || "Đang cập nhật",
          actors: Array.isArray(movie.actors)
            ? movie.actors
            : ["Đang cập nhật"],
          originalTitle: movie.originalTitle || movie.title || "",

          // 5. Khắc phục triệt để lỗi .toFixed() dựa trên object rating của bạn
          rating: movie.rating
            ? {
                average:
                  movie.rating.average !== undefined
                    ? Number(movie.rating.average)
                    : 8.5,
                count: movie.rating.count || 100,
              }
            : { average: 8.5, count: 100 },
          imdb: movie.imdb !== undefined ? Number(movie.imdb) : 8.5,

          // 6. Đường dẫn ảnh poster và backdrop
          poster:
            movie.poster ||
            "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400",
          backdrop:
            movie.backdrop ||
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",

          // 7. Đồng bộ link video phát phim
          videoUrl: movie.videoUrl || movie.trailer || "",

          // Điều kiện để lọt vào các hàng phim trang chủ
          isNew: movie.isNew !== undefined ? movie.isNew : true,
          isTrending: movie.isTrending !== undefined ? movie.isTrending : true,
          duration: movie.duration || 120,
        }));

        console.log("Dữ liệu sau khi đã chuẩn hóa xong:", formattedMovies);
        setMovies(formattedMovies);
      } catch (error) {
        console.error("Không thể kết nối với Backend hoặc lỗi GraphQL:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBackendMovies();
  }, []); // Kết thúc useEffect

  // Watch list state loaded from localStorage
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cinemax_watchlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    category: "Tất Cả",
    country: "Tất Cả",
    year: "Tất Cả",
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
  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      movie.originalTitle
        .toLowerCase()
        .includes(filters.searchQuery.toLowerCase()) ||
      movie.director
        .toLowerCase()
        .includes(filters.searchQuery.toLowerCase()) ||
      movie.actors.some((actor) =>
        actor.toLowerCase().includes(filters.searchQuery.toLowerCase()),
      );

    const matchesCategory =
      filters.category === "Tất Cả" || movie.category === filters.category;
    const matchesCountry =
      filters.country === "Tất Cả" || movie.country === filters.country;
    const matchesYear =
      filters.year === "Tất Cả" || movie.year.toString() === filters.year;

    return matchesSearch && matchesCategory && matchesCountry && matchesYear;
  });

  // Watchlist movies matching filtered list
  const watchlistMovies = movies.filter((m) => watchlistIds.includes(m.id));

  // Categorizations lists for home layout view
  const newMovies = movies.filter((m) => m.isNew);
  const actionMovies = movies.filter((m) => m.category === "Hành Động");
  const theaterHotMovies = movies.filter((m) => m.views > 180000);
  const topTrendingMovies = movies.filter((m) => m.isTrending);

  // Active movie entity
  // const activeMovie = movies.find((m) => m.id === selectedMovieId) || movies[0];

  const hasActiveFilters =
    filters.searchQuery.trim().length > 0 ||
    filters.category !== "Tất Cả" ||
    filters.country !== "Tất Cả" ||
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
    const activeMovie = movies.find((m) => m.id === id);

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
    const activeMovie = movies.find((m) => m.id === id);

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

  if (isAdminMode) {
    return (
      <React.Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-slate-100 font-sans">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold tracking-wider text-slate-400 uppercase animate-pulse">
                Đang nạp hệ thống Admin...
              </p>
            </div>
          </div>
        }
      >
        <div className="flex bg-[#0f172a] text-slate-100 min-h-screen font-sans overflow-hidden">
          <AdminSidebar
            activeTab={adminTab}
            setActiveTab={setAdminTab}
            onExitAdmin={() => {
              setIsAdminMode(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#f8fafc]">
            <AdminTopbar
              currentTabName={
                adminTab === "overview"
                  ? "Tổng quan hệ thống"
                  : adminTab === "movies"
                    ? "Quản lý kho phim lẻ"
                    : "Quản lý người dùng"
              }
            />
            <main className="flex-1 overflow-hidden font-sans">
              {adminTab === "overview" ? (
                <AdminOverview
                  movies={movies}
                  onNavigateToMovies={() => setAdminTab("movies")}
                  onNavigateToUsers={() => setAdminTab("users")}
                />
              ) : adminTab === "movies" ? (
                <AdminMovies
                  movies={movies}
                  onAddMovie={(newDoc) => {
                    const mId = `m-${Date.now()}`;
                    const created: Movie = { id: mId, ...newDoc };
                    setMovies((prev) => [...prev, created]);
                    showNotification(
                      `Đã công chiếu "${newDoc.title}" thành công!`,
                    );
                  }}
                  onEditMovie={(id, updated) => {
                    setMovies((prev) =>
                      prev.map((m) => (m.id === id ? { ...m, ...updated } : m)),
                    );
                    showNotification("Đã lưu thay đổi phim thành công!");
                  }}
                  onDeleteMovie={(id) => {
                    setMovies((prev) => prev.filter((m) => m.id !== id));
                    showNotification(
                      "Đã gỡ bỏ phim khỏi kho dữ liệu thành công.",
                    );
                  }}
                />
              ) : (
                <AdminUsers />
              )}
            </main>
          </div>
        </div>
      </React.Suspense>
    );
  }

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
            country: "Tất Cả",
            year: "Tất Cả",
          });
          navigate("/");
          showNotification("Đang hiển thị danh sách phim yêu thích của bạn");
          // Smooth scroll to watchlist category
          setTimeout(() => {
            const listNode = document.getElementById("my-watchlist-section");
            if (listNode)
              listNode.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 150);
        }}
        onShowNotification={showNotification}
        onOpenAdmin={() => {
          setIsAdminMode(true);
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
              />
            }
          />

          {/* 2. ĐƯỜNG DẪN CHI TIẾT PHIM */}
          <Route path="/phim/:id" element={<MovieDetailWrapper />} />

          {/* 3. ĐƯỜNG DẪN TRÌNH PHÁT VIDEO */}
          <Route path="/xem-phim/:id" element={<VideoPlayerWrapper />} />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer
        id="cinemax-footer"
        className="mt-20 border-t border-slate-800/50 bg-[#0b1222] py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
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
                      setFilters((p) => ({ ...p, category: "Hành Động" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Phim Hành Động Võ Thuật
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: "Viễn Tưởng" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Khoa Học Viễn Tưởng
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: "Cổ Trang" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Cổ Trang Kiếm Hiệp
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: "Hoạt Hình" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Hoạt Hình Anime 3D
                  </button>
                </li>
              </ul>
            </div>

            {/* Links B */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-black text-slate-350 tracking-wider">
                Quốc Gia Lọc Phim
              </h4>
              <ul className="space-y-2 text-xs text-zinc-550 font-medium">
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, country: "Mỹ" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Phim Lẻ Âu Mỹ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, country: "Hàn Quốc" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Phim Điện Ảnh Hàn Quốc
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, country: "Nhật Bản" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Điện Ảnh Nhật Bản
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setFilters((p) => ({ ...p, country: "Việt Nam" }));
                      handleGoHome();
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    Phim Chiếu Rạp Việt Nam
                  </button>
                </li>
              </ul>
            </div>

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
              <button
                onClick={() => {
                  setIsAdminMode(true);
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
