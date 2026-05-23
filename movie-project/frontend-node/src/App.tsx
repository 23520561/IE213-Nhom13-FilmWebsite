import React, { useState, useEffect } from "react";
import { MOCK_MOVIES } from "./data/movies";
import { Movie, FilterState } from "./types";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import MovieRow from "./components/MovieRow";
import MovieCard from "./components/MovieCard";
import MovieDetail from "./components/MovieDetail";
import VideoPlayer from "./components/VideoPlayer";
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
const AdminOverview = React.lazy(
  () => import("./components/admin/AdminOverview"),
);
const AdminMovies = React.lazy(() => import("./components/admin/AdminMovies"));
const AdminUsers = React.lazy(() => import("./components/admin/AdminUsers"));

export default function App() {
  const [movies, setMovies] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem("cinemax_movies_persist");
      return saved ? JSON.parse(saved) : MOCK_MOVIES;
    } catch {
      return MOCK_MOVIES;
    }
  });

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<"overview" | "movies" | "users">(
    "overview",
  );

  const [activeView, setActiveView] = useState<"home" | "detail" | "player">(
    "home",
  );
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

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
    setSelectedMovieId(movieId);
    setActiveView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlayClick = (movieId: string) => {
    setSelectedMovieId(movieId);
    setActiveView("player");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoHome = () => {
    setActiveView("home");
    setSelectedMovieId(null);
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
  const activeMovie = movies.find((m) => m.id === selectedMovieId) || movies[0];

  const hasActiveFilters =
    filters.searchQuery.trim().length > 0 ||
    filters.category !== "Tất Cả" ||
    filters.country !== "Tất Cả" ||
    filters.year !== "Tất Cả";

  // Automatically reset to home view to display search/filter results if user starts typing in other views
  useEffect(() => {
    if (hasActiveFilters && activeView !== "home") {
      setActiveView("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hasActiveFilters, activeView]);

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
          setActiveView("home");
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
        {activeView === "home" ? (
          /* HOME VIEW */
          <div className="space-y-10">
            {!hasActiveFilters && (
              <HeroSection
                movies={movies}
                watchlistIds={watchlistIds}
                onMovieClick={handleMovieClick}
                onPlayClick={handlePlayClick}
                onToggleWatchlist={handleToggleWatchlist}
              />
            )}

            {/* Filter tags header details if filters are active */}
            {hasActiveFilters ? (
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
                <div className="border-b border-slate-900 pb-4 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-black text-red-500">
                    Bộ Lọc Phim
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl sm:text-3xl font-extrabold text-white flex items-center space-x-2">
                      <Grid2X2 className="h-6 w-6 text-red-500" />
                      <span>
                        Kết quả tìm kiếm cho bộ lọc ({filteredMovies.length}{" "}
                        phim)
                      </span>
                    </h2>

                    <button
                      onClick={() =>
                        setFilters({
                          searchQuery: "",
                          category: "Tất Cả",
                          country: "Tất Cả",
                          year: "Tất Cả",
                        })
                      }
                      className="inline-flex items-center space-x-1 border border-slate-800 bg-slate-900 px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:border-slate-700 hover:text-white transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Đặt Lại Bộ Lọc</span>
                    </button>
                  </div>

                  {/* Active tags visualizer list */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                    {filters.category !== "Tất Cả" && (
                      <span className="rounded-full bg-red-950/80 border border-red-900/60 text-red-400 px-3 py-1 font-medium">
                        Thể loại: {filters.category}
                      </span>
                    )}
                    {filters.country !== "Tất Cả" && (
                      <span className="rounded-full bg-slate-900 border border-slate-800 text-slate-350 px-3 py-1 font-medium">
                        Quốc gia: {filters.country}
                      </span>
                    )}
                    {filters.year !== "Tất Cả" && (
                      <span className="rounded-full bg-slate-900 border border-slate-800 text-slate-350 px-3 py-1 font-medium">
                        Năm: {filters.year}
                      </span>
                    )}
                    {filters.searchQuery.trim().length > 0 && (
                      <span className="rounded-full bg-slate-900 border border-slate-800 text-slate-350 px-3 py-1 font-medium">
                        Từ khóa: "{filters.searchQuery}"
                      </span>
                    )}
                  </div>
                </div>

                {filteredMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredMovies.map((movie) => (
                      <div
                        key={movie.id}
                        className="animate-in fade-in duration-300 text-left"
                      >
                        <MovieCard
                          movie={movie}
                          isInWatchlist={watchlistIds.includes(movie.id)}
                          onMovieClick={handleMovieClick}
                          onPlayClick={handlePlayClick}
                          onToggleWatchlist={handleToggleWatchlist}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    id="no-search-results"
                    className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-4"
                  >
                    <Layers className="h-12 w-12 text-slate-600 mx-auto" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-300">
                        Không tìm thấy phim phù hợp
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh các
                        tiêu chí bộ lọc về trạng thái ban đầu để xem danh mục
                        phim.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFilters({
                          searchQuery: "",
                          category: "Tất Cả",
                          country: "Tất Cả",
                          year: "Tất Cả",
                        })
                      }
                      className="px-5 py-2 rounded-lg bg-red-600 font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      Xóa tất cả điều kiện lọc
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CATEGORIES ORGANIZED HOME */
              <div className="space-y-6">
                {/* Watch list category (if any bookmark items present) */}
                {watchlistMovies.length > 0 && (
                  <section
                    id="my-watchlist-section"
                    className="bg-gradient-to-r from-red-950/20 via-slate-950 to-slate-950 border-y border-slate-900 py-3"
                  >
                    <MovieRow
                      title="Danh Sách Phim Yêu Thích Của Tôi"
                      subtitle="Phim lẻ bạn đã đánh dấu để xem lại sau"
                      movies={watchlistMovies}
                      watchlistIds={watchlistIds}
                      onMovieClick={handleMovieClick}
                      onPlayClick={handlePlayClick}
                      onToggleWatchlist={handleToggleWatchlist}
                    />
                  </section>
                )}

                {/* Phim Mới Cập Nhật */}
                <section id="new-movies-section">
                  <MovieRow
                    title="Phim Mới Cập Nhật"
                    subtitle="Phim lẻ chiếu rạp, bom tấn chất lượng 4K cực nét vừa lên sóng"
                    movies={newMovies}
                    watchlistIds={watchlistIds}
                    onMovieClick={handleMovieClick}
                    onPlayClick={handlePlayClick}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                </section>

                {/* Top Trending Section */}
                <section id="trending-movies-section">
                  <MovieRow
                    title="Phim Lẻ Đang Thịnh Hành"
                    subtitle="Đứng đầu lượt tìm kiếm và thảo luận của cộng đồng tuần qua"
                    movies={topTrendingMovies}
                    watchlistIds={watchlistIds}
                    onMovieClick={handleMovieClick}
                    onPlayClick={handlePlayClick}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                </section>

                {/* Phim Chiếu Rạp Hot */}
                <section id="theaters-hot-section">
                  <MovieRow
                    title="Phim Chiếu Rạp Siêu Hot"
                    subtitle="Tác phẩm phá kỷ lục phòng vé quốc tế lẫn trong nước"
                    movies={theaterHotMovies}
                    watchlistIds={watchlistIds}
                    onMovieClick={handleMovieClick}
                    onPlayClick={handlePlayClick}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                </section>

                {/* Phim Hành Động */}
                <section id="action-movies-section">
                  <MovieRow
                    title="Phim Hành Động Kịch Tính"
                    subtitle="Pha rượt đuổi nghẹt thở, đấu kiếm samurai cổ trang mãn nhãn"
                    movies={actionMovies}
                    watchlistIds={watchlistIds}
                    onMovieClick={handleMovieClick}
                    onPlayClick={handlePlayClick}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                </section>

                {/* Informational Promo box */}
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col md:flex-row items-center justify-between text-left gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-100 flex items-center space-x-1.5 font-sans">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>Trải Nghiệm Rạp Phim Tại Nhà Premium</span>
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed font-sans">
                        CineMax hỗ trợ mọi thành viên thưởng thức kho phim lẻ
                        độc quyền, truyền tải hình ảnh 4K Dolby Vision sinh
                        động, đa kênh máy chủ liên kết tốc độ cao không giới hạn
                        băng thông và hoàn toàn loại bỏ quảng cáo.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        showNotification(
                          "Độ phân giải 4K Dolby và mọi máy chủ truyền tải cao cấp đã được mở khóa tự động hoàn toàn miễn phí cho bạn!",
                        )
                      }
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-2.5 px-5 rounded-full transition-colors shrink-0 cursor-pointer font-sans font-black"
                    >
                      Kích Hoạt Chế Độ 4K Miễn Phí
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeView === "detail" ? (
          /* DETAILED MOVIE VIEW */
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
        ) : (
          /* VIDEO PLAYER VIEW */
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <VideoPlayer
              movie={activeMovie}
              onGoBack={() => {
                setActiveView("detail");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onShowNotification={showNotification}
            />
          </div>
        )}
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
