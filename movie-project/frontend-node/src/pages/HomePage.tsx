import React from "react";
import HeroSection from "../components/HeroSection";
import MovieRow from "../components/MovieRow";
import MovieCard from "../components/MovieCard";
import { Grid2X2, RefreshCw, Layers } from "lucide-react";
import { Movie, FilterState, User } from "../types";
import useFilter from "../hooks/useFilter";
import useCategoryMovies from "../hooks/useCategoryMovies";

interface HomePageProps {
  filters: FilterState;
  updateFilters: (f: FilterState)=>void;
  currentPage: number;
  updatePage: (n: number)=>void;
  recommendedMovies?: Movie[];
  watchlistMovies: Movie[];
  watchlistIds: string[];
  handleMovieClick: (id: string) => void;
  handlePlayClick: (id: string) => void;
  handleToggleWatchlist: (id: string) => void;
  showNotification: (msg: string) => void;
  currentUser: User;
}

export default function HomePage({
  filters,
  updateFilters,
  currentPage,
  updatePage,
  recommendedMovies = [],
  watchlistMovies,
  watchlistIds,
  handleMovieClick,
  handlePlayClick,
  handleToggleWatchlist,
  showNotification,
  currentUser
}: HomePageProps) {
  const {movies, hasMore, isFetchingMore} = useFilter(filters, currentPage)
  const {sectionNewMovies: newMovies, sectionTheaterHotMovies: theaterHotMovies, sectionActionMovies: actionMovies} = useCategoryMovies(currentUser)
  const hasActiveFilters =
    filters.searchQuery.trim().length > 0 ||
    filters.category !== "Tất Cả" ||
    filters.year !== "Tất Cả";
  console.log(hasActiveFilters, filters)
  function onLoadMore(){
    updatePage(currentPage+1)
  }

  return (
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
                  Kết quả tìm kiếm cho bộ lọc ({movies.length} phim)
                </span>
              </h2>

              <button
                onClick={() =>
                  updateFilters({
                    searchQuery: "",
                    category: "Tất Cả",
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
              {/* Country filter removed */}
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

          {movies.length > 0 ? (
            <div className="space-y-12">
              {" "}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map((movie) => (
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
              {/* KHỐI NÚT TẢI THÊM MỚI */}
              {hasMore && (
                <div className="flex justify-center pb-8">
                  <button
                    onClick={onLoadMore}
                    disabled={isFetchingMore}
                    className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl"
                  >
                    {isFetchingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                        <span>Đang kết nối Database...</span>
                      </>
                    ) : (
                      <>
                        <Layers className="h-4 w-4 text-red-500" />
                        <span>Tải thêm phim</span>
                      </>
                    )}
                  </button>
                </div>
              )}
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
                  Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh các tiêu chí
                  bộ lọc về trạng thái ban đầu để xem danh mục phim.
                </p>
              </div>
              <button
                onClick={() =>
                  updateFilters({
                    searchQuery: "",
                    category: "Tất Cả",
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
          {/* Recommended for you */}
          {recommendedMovies && recommendedMovies.length > 0 && (
            <section id="recommended-section">
              <MovieRow
                title="Phim Dành Cho Bạn"
                subtitle="Gợi ý cá nhân dựa trên lịch sử xem và sở thích của bạn"
                movies={recommendedMovies}
                watchlistIds={watchlistIds}
                onMovieClick={handleMovieClick}
                onPlayClick={handlePlayClick}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </section>
          )}

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
          {/* <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col md:flex-row items-center justify-between text-left gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-100 flex items-center space-x-1.5 font-sans">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>Trải Nghiệm Rạp Phim Tại Nhà Premium</span>
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed font-sans">
                    CineMax hỗ trợ mọi thành viên thưởng thức kho phim lẻ độc
                    quyền, truyền tải hình ảnh 4K Dolby Vision sinh động, đa
                    kênh máy chủ liên kết tốc độ cao không giới hạn băng thông
                    và hoàn toàn loại bỏ quảng cáo.
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
            </div> */}
        </div>
      )}
    </div>
  );
}
