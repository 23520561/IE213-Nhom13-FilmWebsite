import React, { useEffect, useState } from "react";
import { graphqlGetGenres, graphqlGetMovies } from "../../services/graphql";
import { Movie } from "../../types";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Play,
  HelpCircle,
  Film,
  RefreshCw,
  Upload,
  Sparkles,
} from "lucide-react";

interface MoviesProps {
  movies: Movie[];
  onAddMovie: (movie: Omit<Movie, "id">) => void;
  onEditMovie: (id: string, updated: Partial<Movie>) => void;
  onDeleteMovie: (id: string) => void;
}

export default function AdminMovies({
  movies,
  onAddMovie,
  onEditMovie,
  onDeleteMovie,
}: MoviesProps) {
  // Filter variables
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất Cả");
  const [selectedStatus, setSelectedStatus] = useState("Tất Cả"); // Tất Cả, Hot, Mới

  // Modal control triggers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // Form input states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("2024-01-01");
  const [genres, setGenres] = useState<string[]>(["Action"]);
  const [duration, setDuration] = useState(120);
  const [poster, setPoster] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [trailer, setTrailer] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const [availableGenres, setAvailableGenres] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [additionalMovies, setAdditionalMovies] = useState<Movie[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Ẩn nút "Tải thêm" nếu trang đầu tiên nhận về từ cha đã ít hơn 50 phim (nghĩa là DB đã hết phim)
  useEffect(() => {
    if (movies.length > 0 && movies.length < 50) {
      setHasMore(false);
    }
  }, [movies]);

  // Tự động kéo danh sách thể loại từ Backend khi vào trang Quản lý phim
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const genresData = await graphqlGetGenres();
        setAvailableGenres(genresData);
      } catch (error) {
        console.error("Không thể tải danh sách thể loại:", error);
      }
    };
    fetchGenres();
  }, []);

  // Hàm gọi API lấy trang tiếp theo
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      // Gọi API với page mới, limit mặc định 50
      const newMovies = await graphqlGetMovies({ page: nextPage, limit: 50 });

      // Nếu số phim trả về ít hơn 50, nghĩa là đã chạm đáy Database
      if (newMovies.length < 50) {
        setHasMore(false);
      }

      if (newMovies.length > 0) {
        // Cập nhật vào danh sách phim tải thêm
        setAdditionalMovies((prev) => [...prev, ...newMovies]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Lỗi khi tải thêm phim:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Nút điền nhanh dữ liệu mẫu
  const handleQuickFill = () => {
    setTitle("X-Men (sample)");
    setDescription(
      "Two mutants, Rogue and Wolverine, come to a private academy for their kind...",
    );
    setReleaseDate("2000-07-13");
    setGenres(["Action"]);
    setDuration(104);
    setPoster(
      "https://image.tmdb.org/t/p/w500/bRDAc4GogyS9ci3ow7UnInOcriN.jpg",
    );
    setBackdrop("");
    setVideoUrl("https://www.youtube.com/watch?v=s4Wqw8tqgdM");
    setTrailer("https://www.youtube.com/watch?v=s4Wqw8tqgdM");
    setIsPremium(false);
    setIsFeatured(false);
  };

  const openAddModal = () => {
    setEditingMovie(null);
    setTitle("");
    setDescription("");
    setReleaseDate(new Date().toISOString().split("T")[0]);
    setGenres(["Action"]);
    setDuration(120);
    setPoster("");
    setBackdrop("");
    setVideoUrl("");
    setTrailer("");
    setIsPremium(false);
    setIsModalOpen(true);
  };

  const openEditModal = (movie: any) => {
    setEditingMovie(movie);
    setTitle(movie.title);
    setDescription(movie.description || movie.synopsis || "");
    setReleaseDate(
      movie.releaseDate ||
        `${movie.releaseYear || new Date().getFullYear()}-01-01`,
    );
    setGenres(
      movie.genres && movie.genres.length > 0
        ? movie.genres.map((g: any) => g.name || g)
        : ["Action"],
    );
    setDuration(movie.duration || 120);
    setPoster(movie.poster || "");
    setBackdrop(movie.backdrop || "");
    setVideoUrl(movie.videoUrl || "");
    setTrailer(movie.trailer || movie.videoUrl || "");
    setIsPremium(movie.isPremium || false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !poster || !videoUrl) {
      alert("Vui lòng hoàn tất các thông tin bắt buộc (*)!");
      return;
    }

    // Đóng gói data
    const movieInput = {
      title,
      description,
      releaseDate,
      genres,
      duration: Number(duration) || 120,
      videoUrl,
      poster,
      backdrop,
      trailer: trailer || videoUrl, // Lấy videoUrl làm trailer nếu để trống
      isPremium,
    };

    if (editingMovie) {
      onEditMovie(editingMovie.id, movieInput as any);
    } else {
      onAddMovie(movieInput as any);
    }
    setIsModalOpen(false);
  };
  // 1. Gộp phim trang 1 và các phim vừa tải thêm, đồng thời dùng Map để lọc trùng ID
  const allMoviesList = [...movies, ...additionalMovies];
  const uniqueMoviesMap = new Map();
  allMoviesList.forEach((m) => uniqueMoviesMap.set(m.id, m));
  const finalAllMovies = Array.from(uniqueMoviesMap.values());

  // 2. Chạy bộ lọc trên TẤT CẢ danh sách phim đã gộp
  const filteredMovies = finalAllMovies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(search.toLowerCase()) ||
      movie.originalTitle?.toLowerCase().includes(search.toLowerCase());

    const primaryCat =
      (movie as any).genres && (movie as any).genres.length > 0
        ? (movie as any).genres[0].name || (movie as any).genres[0]
        : movie.category;
    const matchesCategory =
      selectedCategory === "Tất Cả" || primaryCat === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === "Premium") matchesStatus = movie.isPremium === true;
    else if (selectedStatus === "Free") matchesStatus = !movie.isPremium;
    else if (selectedStatus === "Featured")
      matchesStatus = movie.isFeatured === true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 3. Trích xuất danh mục cho dropdown dựa trên TẤT CẢ phim
  const categories = [
    "Tất Cả",
    ...Array.from(
      new Set(
        finalAllMovies.map((m) =>
          (m as any).genres && (m as any).genres.length > 0
            ? (m as any).genres[0].name || (m as any).genres[0]
            : m.category,
        ),
      ),
    ),
  ];

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] select-none text-zinc-850 text-left bg-zinc-50/50">
      {/* Search and control filter line */}
      <section className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Header block */}
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900">
              Danh Mục Kho Phim
            </h2>
            <p className="text-xs text-zinc-400">
              Quản lý, xuất bản, tinh chỉnh phim và đổi server phân phối nội
              dung
            </p>
          </div>

          {/* Create movie action trigger button */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-755 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer w-fit"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Thêm Phim Mới</span>
          </button>
        </div>

        {/* Real Filter Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* Search text box */}
          <div className="relative flex items-center bg-zinc-100 rounded-xl px-4 py-2 border border-zinc-200/40">
            <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên phim, tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-zinc-805 outline-none w-full placeholder-zinc-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-2 bg-zinc-100/60 rounded-xl px-3.5 py-1.5 border border-zinc-200/50">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider shrink-0">
              Thể loại:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 outline-none w-full cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Country filter removed (backend does not provide nation) */}

          {/* Status Dropdown */}
          <div className="flex items-center space-x-2 bg-zinc-100/60 rounded-xl px-3.5 py-1.5 border border-zinc-200/50">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider shrink-0">
              Trạng thái:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 outline-none w-full cursor-pointer"
            >
              <option value="Tất Cả">Tất Cả Phim</option>
              <option value="Premium">Phim Premium (Trả phí)</option>
              <option value="Free">Phim Miễn Phí</option>
              <option value="Featured">Phim Nổi Bật</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid Movies Results Data table */}
      <section className="bg-white rounded-2xl border border-zinc-200/95 shadow-sm overflow-hidden">
        <div className="overflow-x-auto rounded-t-2xl font-sans">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-55 border-b border-zinc-200 text-zinc-500 font-bold text-xs uppercase tracking-wider text-left">
                <th className="px-6 py-4">Bìa & Tên phim</th>
                <th className="px-6 py-4">Phân loại</th>
                <th className="px-6 py-4">Chất lượng</th>
                <th className="px-6 py-4">Thời lượng</th>
                <th className="px-6 py-4">Lượt xem</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
              {filteredMovies.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-zinc-400 font-medium"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Film className="w-10 h-10 text-zinc-300" />
                      <span>
                        Không tìm thấy bộ phim nào phù hợp với bộ lọc!
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovies.map((movie) => (
                  <tr
                    key={movie.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    {/* Cover & Title */}
                    <td className="px-6 py-4.5 flex items-center space-x-3.5 min-w-[320px]">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        referrerPolicy="no-referrer"
                        className="w-11 h-15 object-cover rounded-md shadow-md border border-zinc-200/80 shrink-0"
                      />
                      <div className="text-left space-y-0.5">
                        <span className="font-extrabold text-zinc-900 block leading-tight hover:text-blue-600 transition-colors cursor-pointer">
                          {movie.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold block">
                          {/* Sửa: Dùng releaseYear thay cho year */}
                          ID: {movie.id.substring(0, 24)} • Năm:{" "}
                          {movie.releaseYear || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Category Label */}
                    <td className="px-6 py-4.5">
                      <div className="space-y-0.5">
                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-[10px] font-black">
                          {(movie as any).genres &&
                          (movie as any).genres.length > 0
                            ? (movie as any).genres
                                .map((g: any) =>
                                  typeof g === "string" ? g : g.name,
                                )
                                .join(", ")
                            : movie.category || "Chưa phân loại"}
                        </span>
                      </div>
                    </td>

                    {/* Quality Formats (Database không có Quality nên set cứng hoặc bỏ trống) */}
                    <td className="px-6 py-4.5">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 bg-amber-500/10 border border-amber-550/20 px-2 py-0.5 rounded text-[10px] inline-block uppercase">
                          {movie.quality || "FHD 1080P"}
                        </span>
                      </div>
                    </td>

                    {/* Running Time */}
                    <td className="px-6 py-4.5 font-bold text-zinc-700 font-mono">
                      {movie.duration || 120} phút
                    </td>

                    {/* View Counts */}
                    <td className="px-6 py-4.5 font-extrabold text-zinc-850 font-mono">
                      {/* Sửa: Dùng viewCount thay cho views */}
                      {movie.viewCount?.toLocaleString() || "0"}
                    </td>

                    {/* Status badges */}
                    <td className="px-6 py-4.5 space-y-1.5">
                      {/* Đồng bộ trạng thái: isFeatured và isPremium */}
                      {movie.isFeatured && (
                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600 border border-rose-220 block w-fit mb-1">
                          ★ Nổi Bật
                        </span>
                      )}
                      {movie.isPremium ? (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 border border-amber-220 block w-fit">
                          Premium VIP
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-220 block w-fit">
                          Miễn Phí
                        </span>
                      )}
                    </td>

                    {/* Actions button column */}
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Edit single row */}
                        <button
                          onClick={() => openEditModal(movie)}
                          className="p-1.8 text-zinc-500 hover:text-blue-605 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa phim"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete single row */}
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Bạn chắc chắn muốn xóa phim "${movie.title}"?`,
                              )
                            ) {
                              onDeleteMovie(movie.id);
                            }
                          }}
                          className="p-1.8 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa phim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="p-5 border-t border-zinc-200/80 bg-zinc-50/50 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-white border border-zinc-200 shadow-sm text-zinc-700 font-bold hover:bg-zinc-50 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingMore ? "animate-spin text-blue-600" : "text-zinc-400"}`}
              />
              <span>
                {isLoadingMore
                  ? "Đang tải thêm dữ liệu..."
                  : "Tải thêm danh sách phim"}
              </span>
            </button>
          </div>
        )}
      </section>

      {/* ================= MODAL DIALOG ADD/EDIT PHIM ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 min-h-screen bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto select-none font-sans">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-zinc-200 flex flex-col justify-between max-h-[90vh]">
            {/* Modal Header bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-left">
                <div className="p-1.5 bg-blue-600 rounded-lg">
                  <Film className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    {editingMovie
                      ? "CẬP NHẬT THÔNG TIN PHIM"
                      : "THÊM MỚI PHIM VÀO KHO"}
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Thiết lập tham số phát trực tuyến
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-xs"
            >
              {/* Nút Test nhanh */}
              {!editingMovie && (
                <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-650 animate-bounce" />
                    <span className="text-blue-700 font-semibold text-[11px]">
                      Thử nghiệm nhanh dữ liệu mẫu?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px]"
                  >
                    Lấy dữ liệu X-Men
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                {/* Tiêu đề & Thể loại */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">
                    Tiêu đề phim *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">
                    Thể loại chính *
                  </label>
                  <select
                    value={genres[0] || ""}
                    onChange={(e) => setGenres([e.target.value])}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800 cursor-pointer text-xs font-semibold"
                  >
                    <option value="" disabled>
                      -- Vui lòng chọn thể loại --
                    </option>

                    {/* Đổ dữ liệu thật từ Database ra form */}
                    {availableGenres.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mô tả nội dung */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-zinc-700 block">
                    Mô tả nội dung (Description) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800"
                  />
                </div>

                {/* Ngày phát hành & Thời lượng */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">
                    Ngày phát hành (Release Date)
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550 font-mono"
                  />
                </div>

                {/* Hình ảnh (Poster & Backdrop) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">
                    Poster URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">
                    Backdrop URL
                  </label>
                  <input
                    type="url"
                    value={backdrop}
                    onChange={(e) => setBackdrop(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550"
                  />
                </div>

                {/* Video và Trailer URL */}
                <div className="space-y-1.5">
                  <label className="font-black text-blue-700 block text-[11px]">
                    VIDEO STREAM URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600 text-zinc-800 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-black text-blue-700 block text-[11px]">
                    TRAILER URL
                  </label>
                  <input
                    type="url"
                    value={trailer}
                    onChange={(e) => setTrailer(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600 text-zinc-800 font-mono font-bold"
                  />
                </div>

                {/* Switchers (Premium & Featured) */}
                <div className="space-y-1.5 md:col-span-2 flex space-x-8 pt-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span className="font-bold text-zinc-700">
                      Phim Premium (Yêu cầu trả phí)
                    </span>
                  </label>
                  {/* <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span className="font-bold text-zinc-700">
                      Phim Nổi Bật (Featured)
                    </span>
                  </label> */}
                </div>
              </div>

              {/* Nút Submit */}
              <div className="pt-4 border-t border-zinc-150 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-500 font-bold"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/10"
                >
                  {editingMovie ? "Cập Nhật Ngay" : "Kích Hoạt Công Bố"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
