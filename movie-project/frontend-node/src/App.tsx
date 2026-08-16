import { Routes, Route, useNavigate } from "react-router-dom"; // Import các công cụ quản lý URL
import Header from "./components/Header";
import { Film, Shield } from "lucide-react";
import MovieDetailWrapper from "./utils/MovieDetailWrapper";
import VideoPlayerWrapper from "./utils/VideoPlayerWrapper";
import { AdminPage } from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import useFilter from "./hooks/useFilter";
import useWatchlist from "./hooks/useWatchlist";
import useRecommendations from "./hooks/useRecommendations";
import useAuth from "./hooks/useAuth";
import useNotification from "./hooks/useNotification";

export default function App() {
  const navigate = useNavigate();
  const {
    movies,
    hasMore,
    isFetchingMore,
    updateFilters,
    updatePage,
    filters,
    currentPage,
    updateMovies,
    handleMovieClick,
    handlePlayClick
  } = useFilter();

  const {currentUser, updateUser} = useAuth()
  const {recommendedMovies} = useRecommendations(currentUser);
  const {notification, showNotification} = useNotification()
  const { watchlistIds,  handleToggleWatchlist } = useWatchlist(
    currentUser,
    movies,
    showNotification,
  );
  const watchlistMovies = movies.filter((m) => watchlistIds.includes(m.id));

  const handleGoHome = () => {
    navigate("/"); // Trở về URL trang chủ
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        onAuthChange={updateUser}
        filters={filters}
        updateFilters={updateFilters}
        bookmarkCount={watchlistMovies.length}
        onGoHome={handleGoHome}
        onGoWatchlist={() => {
          updateFilters({
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
                movies={movies}
                hasMore={hasMore}
                isFetchingMore={isFetchingMore}
              ></HomePage>
            }
          />

          {/* 2. ĐƯỜNG DẪN CHI TIẾT PHIM */}
          <Route
            path="/phim/:id"
            element={
              <MovieDetailWrapper
                watchlistIds={watchlistIds}
                handlePlayClick={handlePlayClick}
                handleToggleWatchlist={handleToggleWatchlist}
                handleMovieClick={handleMovieClick}
                showNotification={showNotification}
              />
            }
          />

          {/* 3. ĐƯỜNG DẪN TRÌNH PHÁT VIDEO */}
          <Route path="/xem-phim/:id" element={<VideoPlayerWrapper />} />
          <Route
            path="/admin/*"
            element={
              <AdminPage
                movies={movies}
                setMovies={updateMovies}
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
                      updateFilters({ ...filters, category: "Action" });
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
                      updateFilters({ ...filters, category: "Adventure" });
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
                      updateFilters({ ...filters, category: "History" });
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
                      updateFilters({ ...filters, category: "Animation" });
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
