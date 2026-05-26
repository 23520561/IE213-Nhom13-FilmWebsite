import { graphqlLogin, graphqlRegister } from "../services/graphql";
import React, { useState, useRef, useEffect } from "react";
import {
  Film,
  Search,
  Bookmark,
  ChevronDown,
  X,
  LogIn,
  Calendar,
  Menu,
} from "lucide-react";
import { FilterState } from "../types";
import { CATEGORIES, YEARS } from "../data/movies";
import styles from "../styles.module.css";

interface HeaderProps {
  filters: FilterState;
  setFilters: (
    update: FilterState | ((prev: FilterState) => FilterState),
  ) => void;
  bookmarkCount: number;
  onGoHome: () => void;
  onGoWatchlist: () => void;
  onShowNotification: (message: string) => void;
  onOpenAdmin?: () => void;
  currentUser?: any;
  onAuthChange?: (user: any | null) => void;
}

export default function Header({
  filters,
  setFilters,
  bookmarkCount,
  onGoHome,
  onGoWatchlist,
  onShowNotification,
  onOpenAdmin,
  currentUser,
  onAuthChange,
}: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Authentication states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Search input local state for instant input experience
  const [searchVal, setSearchVal] = useState(filters.searchQuery);

  const categoryRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  // Sync search input after short delay or change

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, searchQuery: searchVal }));
    }, 280);
    return () => clearTimeout(handler);
  }, [searchVal, setFilters]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !email.trim() ||
      !password.trim() ||
      (isRegisterMode && !username.trim())
    ) {
      onShowNotification("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setIsAuthLoading(true);
    try {
      if (isRegisterMode) {
        const data = await graphqlRegister(username, email, password);
        localStorage.setItem("cinemax_auth_token", data.token);
        if (onAuthChange) onAuthChange(data.user);
        setIsLoginModalOpen(false);
        onShowNotification(
          `Đăng ký thành công! Chào mừng ${data.user.username}.`,
        );
      } else {
        const data = await graphqlLogin(email, password);
        localStorage.setItem("cinemax_auth_token", data.token);
        if (onAuthChange) onAuthChange(data.user);
        setIsLoginModalOpen(false);
        onShowNotification(`Đăng nhập thành công! Chào mừng trở lại.`);
      }
    } catch (error: any) {
      onShowNotification(
        error.message || "Email hoặc mật khẩu không chính xác!",
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cinemax_auth_token");
    if (onAuthChange) onAuthChange(null);
    setIsSettingsModalOpen(false);
    onShowNotification("Đã đăng xuất tài khoản.");
  };

  const selectCategory = (category: string) => {
    setFilters((prev) => ({ ...prev, category }));
    setIsCategoryDropdownOpen(false);
    onGoHome();
  };

  // country filter removed — reserved for compatibility only

  const selectYear = (year: string) => {
    setFilters((prev) => ({ ...prev, year }));
    setIsYearDropdownOpen(false);
    onGoHome();
  };

  const clearAllFilters = (silent: boolean = false) => {
    setSearchVal("");
    setFilters({
      searchQuery: "",
      category: "Tất Cả",
      year: "Tất Cả",
    });
    onGoHome();
    if (!silent) {
      onShowNotification("Đã đặt lại các bộ lọc phim.");
    }
  };

  const activeFiltersCount =
    (filters.category !== "Tất Cả" ? 1 : 0) +
    (filters.year !== "Tất Cả" ? 1 : 0);

  return (
    <>
      <header
        id="main-header"
        className={`sticky top-0 z-50 w-full ${styles.glassHeader} h-20 transition-all`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div
            id="header-logo-container"
            onClick={() => {
              clearAllFilters(true);
            }}
            className="flex cursor-pointer items-center space-x-2 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ef4444] font-bold text-white transition-transform group-hover:scale-105 group-hover:rotate-6">
              <Film className="h-5 w-5" />
            </div>
            <span className="text-[#ef4444] font-black text-3xl tracking-tighter select-none">
              CINE
              <span className="text-white group-hover:text-[#ef4444] transition-colors">
                MAX
              </span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav
            id="desktop-nav"
            className="hidden lg:flex items-center space-x-6"
          >
            {/* Genre Dropdown */}
            <div ref={categoryRef} className="relative z-50">
              <button
                id="genre-dropdown-trigger"
                onClick={() =>
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                }
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                <span>Thể Loại</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isCategoryDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isCategoryDropdownOpen && (
                <div
                  id="genre-dropdown-menu"
                  className="absolute left-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => selectCategory(cat)}
                        className={`block text-left text-xs px-3 py-2 rounded-lg transition-colors leading-normal truncate ${
                          filters.category === cat
                            ? "bg-red-600 text-white font-bold"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Country filter removed */}

            {/* Year Dropdown */}
            <div ref={yearRef} className="relative z-50">
              <button
                id="year-dropdown-trigger"
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Năm</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isYearDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isYearDropdownOpen && (
                <div
                  id="year-dropdown-menu"
                  className="absolute left-0 mt-2 w-40 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {YEARS.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => selectYear(yr)}
                      className={`block w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                        filters.year === yr
                          ? "bg-red-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {yr === "Tất Cả" ? "Tất cả năm" : `Năm ${yr}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {onOpenAdmin && currentUser?.role === "admin" && (
              <button
                id="header-admin-trigger"
                onClick={onOpenAdmin}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors text-xs font-black border border-blue-500/20 shadow-md shadow-blue-500/5 cursor-pointer ml-2"
              >
                <span>Hệ thống Admin</span>
              </button>
            )}
          </nav>

          {/* Search bar & User controls */}
          <div
            id="header-right-side"
            className="flex items-center space-x-3 sm:space-x-4"
          >
            {/* Search inputs */}
            <div className="relative max-w-xs sm:max-w-sm">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                id="movie-search-input"
                type="text"
                placeholder="Tìm phim, đạo diễn, diễn viên..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setFilters((prev) => ({ ...prev, searchQuery: searchVal }));
                    onGoHome(); // Cưỡng chế quay về trang chủ để xem kết quả lọc
                    onShowNotification(
                      `Đang tìm kiếm dữ liệu cho: "${searchVal}"`,
                    );
                  }
                }}
                className="w-40 sm:w-60 rounded-full border border-slate-800 bg-slate-950/80 hover:bg-slate-950 hover:border-slate-700 focus:border-red-500 focus:bg-slate-950 focus:ring-1 focus:ring-red-500 text-xs text-white py-2.5 pl-9 pr-4 outline-none transition-all placeholder:text-slate-500"
              />
              {searchVal && (
                <button
                  onClick={() => setSearchVal("")}
                  className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Clear Filters Button tag (if filter active) */}
            {activeFiltersCount > 0 && (
              <button
                id="reset-filters-badge"
                onClick={() => clearAllFilters(false)}
                className="hidden md:flex items-center space-x-1 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 text-[10px] uppercase tracking-wider py-1.5 px-2.5 rounded-lg transition-colors font-semibold"
              >
                <span>Hủy {activeFiltersCount} lọc</span>
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Bookmarks (My Watchlist) */}
            <button
              id="watchlist-trigger-btn"
              onClick={onGoWatchlist}
              className="relative p-2.5 rounded-full bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white transition-all hover:scale-105"
              title="Danh sách lưu trữ"
            >
              <Bookmark className="h-4 w-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-slate-950 animate-pulse">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Authentications & Login State */}
            {currentUser ? (
              <div
                id="logged-in-profile"
                className="flex items-center space-x-2"
              >
                <div
                  className="hidden md:flex flex-col items-end text-xs cursor-pointer"
                  title="Cài đặt tài khoản"
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  <span className="font-bold text-slate-200 hover:text-red-400 transition-colors">
                    {currentUser.username}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Thiết lập cá nhân
                  </span>
                </div>
                <div
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="h-9 w-9 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 cursor-pointer p-[2px] transition-transform hover:scale-105"
                  title="Cài đặt tài khoản"
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                    {currentUser.username?.slice(0, 2).toUpperCase() || "US"}
                  </div>
                </div>
              </div>
            ) : (
              <button
                id="login-modal-trigger"
                onClick={() => setIsLoginModalOpen(true)}
                className={`flex items-center space-x-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-red-700 ${styles.glowingButton}`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </button>
            )}

            {/* Menu icon Mobile toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex lg:hidden rounded-lg p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu expanded */}
        {isMobileMenuOpen && (
          <div
            id="mobile-navigation-pane"
            className="lg:hidden absolute left-0 right-0 border-b border-slate-800 bg-slate-950 p-4 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200"
          >
            {/* Category selection */}
            <div>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">
                Lọc theo thể loại
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      selectCategory(cat);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      filters.category === cat
                        ? "bg-red-600 text-white"
                        : "bg-slate-900 text-slate-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Year selection only (country filter removed) */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">
                  Lọc theo năm
                </p>
                <select
                  value={filters.year}
                  onChange={(e) => {
                    selectYear(e.target.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 outline-none"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y === "Tất Cả" ? "Tất cả năm" : y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {onOpenAdmin && currentUser?.role === "admin" && (
              <div className="pt-2.5 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    onOpenAdmin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs text-center block transition-colors shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  Truy cập Hệ thống Admin
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Login modal dialog */}
      {isLoginModalOpen && (
        <div
          id="login-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrops */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsLoginModalOpen(false)}
          />

          <div
            id="login-modal-content"
            className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 font-bold text-white mb-2 shadow-lg shadow-red-500/25">
                <Film className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {isRegisterMode ? "Đăng Ký Tài Khoản" : "Đăng Nhập Thành Viên"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isRegisterMode
                  ? "Tạo tài khoản miễn phí để trải nghiệm kho phim"
                  : "Đăng nhập để lưu danh sách phim yêu thích của riêng bạn"}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên hiển thị (Username)
                  </label>
                  <input
                    type="text"
                    required={isRegisterMode}
                    placeholder="VD: CineFan99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className={`w-full rounded-xl bg-red-600 py-3 text-xs font-bold text-white transition-all hover:bg-red-700 ${isAuthLoading ? "opacity-50 cursor-not-allowed" : styles.glowingButton}`}
              >
                {isAuthLoading
                  ? "Đang xử lý..."
                  : isRegisterMode
                    ? "Đăng Ký Ngay"
                    : "Đăng Nhập Ngay"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              {isRegisterMode ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-red-400 hover:underline hover:text-red-300 font-semibold"
              >
                {isRegisterMode ? "Đăng nhập tại đây" : "Đăng ký ngay"}
              </button>
            </div>

            {!isRegisterMode && (
              <div className="mt-4 text-center text-xs text-slate-500 pt-3 border-t border-slate-800/50">
                Muốn thử nhanh?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setEmail("demo@cinemax.com");
                    setPassword("demo1234");
                    onShowNotification(
                      "Đã điền thông tin tài khoản demo trải nghiệm!",
                    );
                  }}
                  className="text-red-400 hover:underline hover:text-red-300 font-semibold"
                >
                  Dùng Thử Tài Khoản Trải Nghiệm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal Dialog */}
      {isSettingsModalOpen && (
        <div
          id="settings-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
        >
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsSettingsModalOpen(false)}
          />

          <div
            id="settings-modal-content"
            className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left text-slate-200"
          >
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-red-600 to-amber-400 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                  {currentUser?.username?.slice(0, 2).toUpperCase() || "US"}
                </div>
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-white font-sans">
                  Cài đặt cá nhân
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {currentUser?.email || "member@cinemax.com"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-sans text-left">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={currentUser?.username || ""}
                  onChange={(e) => {
                    const newName = e.target.value;
                    if (onAuthChange) {
                      onAuthChange({ ...currentUser, username: newName });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-sans text-left">
                  Độ phân giải mặc định
                </label>
                <select className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-red-500 cursor-pointer font-sans">
                  <option>Full HD 1080p (Ưu tiên)</option>
                  <option>Ultra HD 4K (Dành cho SmartTV)</option>
                  <option>HD 720p (Tiết kiệm băng thông di động)</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-slate-300">
                    Tự động phát tiếp tập phim
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-red-500 cursor-pointer h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-slate-300">
                    Bật phụ đề thông minh mặc định
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-red-500 cursor-pointer h-4 w-4"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4 font-sans max-[380px]:flex-col">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    onShowNotification("Đã lưu các tùy chọn cài đặt cá nhân!");
                  }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 font-bold text-white text-xs rounded-xl transition-all cursor-pointer"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white text-xs rounded-xl transition-all cursor-pointer"
                >
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
