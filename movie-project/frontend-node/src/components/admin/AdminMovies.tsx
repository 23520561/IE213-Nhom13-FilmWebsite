import React, { useState } from 'react';
import { Movie } from '../../types';
import { Search, Filter, Plus, Edit2, Trash2, X, AlertTriangle, Play, HelpCircle, Film, RefreshCw, Upload, Sparkles } from 'lucide-react';

interface MoviesProps {
  movies: Movie[];
  onAddMovie: (movie: Omit<Movie, 'id'>) => void;
  onEditMovie: (id: string, updated: Partial<Movie>) => void;
  onDeleteMovie: (id: string) => void;
}

export default function AdminMovies({ movies, onAddMovie, onEditMovie, onDeleteMovie }: MoviesProps) {
  // Filter variables
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất Cả');
  const [selectedCountry, setSelectedCountry] = useState('Tất Cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất Cả'); // Tất Cả, Hot, Mới

  // Modal control triggers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // Form input states
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [category, setCategory] = useState('Hành Động');
  const [country, setCountry] = useState('Mỹ');
  const [year, setYear] = useState(2026);
  const [duration, setDuration] = useState(120);
  const [director, setDirector] = useState('');
  const [actors, setActors] = useState('');
  const [imdb, setImdb] = useState(8.0);
  const [quality, setQuality] = useState('4K');
  const [language, setLanguage] = useState('Vietsub');
  const [poster, setPoster] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Auto-fill template placeholders for quick testing
  const handleQuickFill = () => {
    setTitle('Avengers: Ngày Tàn Đại Chiến');
    setOriginalTitle('Avengers: Endgame Part 2');
    setCategory('Hành Động');
    setCountry('Mỹ');
    setYear(2026);
    setDuration(181);
    setDirector('Anthony Russo, Joe Russo');
    setActors('Robert Downey Jr., Chris Evans, Mark Ruffalo');
    setImdb(9.3);
    setQuality('4K');
    setLanguage('Thuyết Minh');
    setPoster('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400');
    setBackdrop('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200');
    setSynopsis('Sau các sự kiện tàn khốc của phần trước, vũ trụ bị đe dọa nghiêm trọng. Nhóm Avengers còn lại tập hợp một lần nữa để đảo ngược hành động của Thanos và khôi phục lại trật tự cho thiên hà.');
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  };

  // Open modal for writing new movie
  const openAddModal = () => {
    setEditingMovie(null);
    setTitle('');
    setOriginalTitle('');
    setCategory('Hành Động');
    setCountry('Mỹ');
    setYear(2026);
    setDuration(120);
    setDirector('');
    setActors('');
    setImdb(8.0);
    setQuality('4K');
    setLanguage('Vietsub');
    setPoster('');
    setBackdrop('');
    setSynopsis('');
    setVideoUrl('');
    setIsModalOpen(true);
  };

  // Open modal to update existing movie
  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setTitle(movie.title);
    setOriginalTitle(movie.originalTitle || '');
    setCategory(movie.category);
    setCountry(movie.country);
    setYear(movie.year);
    setDuration(movie.duration);
    setDirector(movie.director || '');
    setActors((movie.actors || []).join(', '));
    setImdb(movie.imdb);
    setQuality(movie.quality);
    setLanguage(movie.language);
    setPoster(movie.poster);
    setBackdrop(movie.backdrop || '');
    setSynopsis(movie.synopsis || '');
    setVideoUrl(movie.videoUrl);
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !videoUrl || !poster) {
      alert('Vui lòng nhập đầy đủ các trường: Tiêu đề phim, Poster & Đường dẫn Video!');
      return;
    }

    const dataPayload = {
      title,
      originalTitle,
      category,
      country,
      year: Number(year),
      duration: Number(duration),
      director,
      actors: actors.split(',').map(s => s.trim()).filter(Boolean),
      imdb: Number(imdb),
      quality,
      language,
      poster,
      backdrop: backdrop || 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&q=80&w=1200',
      synopsis,
      videoUrl,
      views: editingMovie ? editingMovie.views : 100, // Initial views starting point
      isTrending: editingMovie ? editingMovie.isTrending : false,
      isNew: editingMovie ? editingMovie.isNew : true,
      ratingCount: editingMovie ? editingMovie.ratingCount : 1,
    };

    if (editingMovie) {
      onEditMovie(editingMovie.id, dataPayload);
    } else {
      onAddMovie(dataPayload);
    }

    setIsModalOpen(false);
  };

  // Perform dynamic filtering based on selections
  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase()) || 
                          movie.originalTitle?.toLowerCase().includes(search.toLowerCase()) ||
                          movie.director?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Tất Cả' || movie.category === selectedCategory;
    const matchesCountry = selectedCountry === 'Tất Cả' || movie.country === selectedCountry;
    
    let matchesStatus = true;
    if (selectedStatus === 'Hot') {
      matchesStatus = !!movie.isTrending;
    } else if (selectedStatus === 'Mới') {
      matchesStatus = !!movie.isNew;
    }

    return matchesSearch && matchesCategory && matchesCountry && matchesStatus;
  });

  // Extract unique categories and countries for listing in drop downs
  const categories = ['Tất Cả', ...Array.from(new Set(movies.map((m) => m.category)))];
  const countries = ['Tất Cả', ...Array.from(new Set(movies.map((m) => m.country)))];

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] select-none text-zinc-850 text-left bg-zinc-50/50">
      
      {/* Search and control filter line */}
      <section className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Header block */}
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900">Danh Mục Kho Phim</h2>
            <p className="text-xs text-zinc-400">Quản lý, xuất bản, tinh chỉnh phim và đổi server phân phối nội dung</p>
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
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider shrink-0">Thể loại:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 outline-none w-full cursor-pointer"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Country Dropdown */}
          <div className="flex items-center space-x-2 bg-zinc-100/60 rounded-xl px-3.5 py-1.5 border border-zinc-200/50">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider shrink-0">Quốc gia:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 outline-none w-full cursor-pointer"
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center space-x-2 bg-zinc-100/60 rounded-xl px-3.5 py-1.5 border border-zinc-200/50">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider shrink-0">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 outline-none w-full cursor-pointer"
            >
              <option value="Tất Cả">Tất Cả Phim</option>
              <option value="Hot">Phim Hot (Trending)</option>
              <option value="Mới">Phim Mới cập nhật</option>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Film className="w-10 h-10 text-zinc-300" />
                      <span>Không tìm thấy bộ phim nào phù hợp với bộ lọc!</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-zinc-50/50 transition-colors">
                    
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
                          {movie.originalTitle || 'N/A'} • {movie.year}
                        </span>
                      </div>
                    </td>

                    {/* Category Label */}
                    <td className="px-6 py-4.5">
                      <div className="space-y-0.5">
                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-[10px] font-black">
                          {movie.category}
                        </span>
                        <span className="text-[9px] text-zinc-400 block font-medium pl-1">{movie.country}</span>
                      </div>
                    </td>

                    {/* Quality Formats */}
                    <td className="px-6 py-4.5">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 bg-amber-500/10 border border-amber-550/20 px-2 py-0.5 rounded text-[10px] inline-block uppercase">
                          {movie.quality}
                        </span>
                        <span className="text-[9px] text-zinc-400 block font-semibold">{movie.language}</span>
                      </div>
                    </td>

                    {/* Running Time */}
                    <td className="px-6 py-4.5 font-bold text-zinc-700 font-mono">
                      {movie.duration} phút
                    </td>

                    {/* View Counts */}
                    <td className="px-6 py-4.5 font-extrabold text-zinc-850 font-mono">
                      {movie.views?.toLocaleString() || '100'}
                    </td>

                    {/* Status badges */}
                    <td className="px-6 py-4.5 space-y-1">
                      {movie.isTrending && (
                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600 border border-rose-220">
                          Hot Trending
                        </span>
                      )}
                      {movie.isNew ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-220 block w-fit">
                          Đang Chiếu
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-500 border border-zinc-200 block w-fit">
                          Lưu Trữ
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
                            if (confirm(`Bạn chắc chắn muốn xóa phim "${movie.title}"?`)) {
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
                  <h3 className="font-extrabold text-sm">{editingMovie ? 'CẬP NHẬT THÔNG TIN PHIM' : 'THÊM MỚI PHIM VÀO KHO'}</h3>
                  <p className="text-[10px] text-zinc-400">Thiết lập tham số phát trực tuyến</p>
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
            <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Quick test loader */}
              {!editingMovie && (
                <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-650 animate-bounce" />
                    <span className="text-blue-700 font-semibold text-[11px]">Thử nghiệm nhanh tính năng quản trị phim?</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] transition-colors"
                  >
                    Tự động nhận mẫu dữ liệu mẫu
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                
                {/* Movie title field */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Tiêu đề phim *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Kỷ Nguyên Bóng Đêm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800 transition-all"
                  />
                </div>

                {/* Original Title field */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Tên gốc tiếng Anh</label>
                  <input
                    type="text"
                    placeholder="VD: Dark Era: Genesis"
                    value={originalTitle}
                    onChange={(e) => setOriginalTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800 transition-all"
                  />
                </div>

                {/* Technical Server Video URL stream */}
                <div className="space-y-1.5 md:col-span-2 bg-zinc-50 border border-dashed border-zinc-250 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-black text-blue-700 block text-[11px]">ĐƯỜNG DẪN URL SERVER MULTIMEDIA *</label>
                    <span className="text-[9px] text-zinc-450">Hỗ trợ các dạng luồng MP4, HLS, DASH</span>
                  </div>
                  <input
                    type="url"
                    required
                    placeholder="VD: https://storage.googleapis.com/sample/stream.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-600 text-zinc-800 font-mono font-bold transition-all text-[11px]"
                  />
                </div>

                {/* Quality options */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Chất lượng hiển thị</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800 cursor-pointer"
                  >
                    <option value="4K">Độ phân giải 4K Ultra HD</option>
                    <option value="Full HD">Full HD 1080p</option>
                    <option value="HD">HD 720p</option>
                  </select>
                </div>

                {/* Language tags */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Phụ đề & Thuyết minh bản dịch</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800 cursor-pointer"
                  >
                    <option value="Vietsub">Vietsub (Phụ đề việt)</option>
                    <option value="Thuyết Minh">Thuyết Minh</option>
                    <option value="Lồng Tiếng">Lồng Tiếng</option>
                  </select>
                </div>

                {/* Category Options */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Thể loại phim</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800 cursor-pointer text-xs font-semibold"
                  >
                    <option value="Hành Động">Hành Động & Phiêu lưu</option>
                    <option value="Hài Phim">Hài Phim</option>
                    <option value="Viễn Tưởng">Khoa học viễn tưởng</option>
                    <option value="Cổ Trang">Cổ Trang dã sử</option>
                    <option value="Anime">Hoạt hình Anime</option>
                    <option value="Kinh Dị">Kinh Dị giật gân</option>
                    <option value="Tình Cảm">Tình bạn, Tình Cảm</option>
                  </select>
                </div>

                {/* Country values */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Quốc gia sản xuất</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-550 focus:bg-white text-zinc-800 cursor-pointer text-xs"
                  >
                    <option value="Mỹ">Mỹ (Hollywood)</option>
                    <option value="Nhật Bản">Nhật Bản</option>
                    <option value="Việt Nam">Việt Nam</option>
                    <option value="Hàn Quốc">Hàn Quốc</option>
                    <option value="Trung Quốc">Trung Quốc</option>
                  </select>
                </div>

                {/* Launch Year */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Năm phát hành</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550 font-mono"
                  />
                </div>

                {/* Durations */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Thời lượng (phút)</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550 font-mono"
                  />
                </div>

                {/* Poster Link */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Hình ảnh bìa Poster (URL) *</label>
                  <input
                    type="url"
                    required
                    placeholder="VD: https://images.unsplash.com/... (tỷ lệ dọc)"
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550"
                  />
                </div>

                {/* Backdrop design Link */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Ảnh đại diện ngang Backdrop (URL)</label>
                  <input
                    type="url"
                    placeholder="VD: https://images.unsplash.com/... (tỷ lệ ngang)"
                    value={backdrop}
                    onChange={(e) => setBackdrop(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550"
                  />
                </div>

                {/* Director */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Đạo diễn phim</label>
                  <input
                    type="text"
                    placeholder="VD: Christopher Nolan"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550"
                  />
                </div>

                {/* IMDb point */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 block">Điểm số IMDb</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={imdb}
                    onChange={(e) => setImdb(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550 font-mono"
                  />
                </div>

                {/* Actors line */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-zinc-700 block">Danh sách diễn viên chính (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="VD: Cillian Murphy, Emily Blunt, Matt Damon"
                    value={actors}
                    onChange={(e) => setActors(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550"
                  />
                </div>

                {/* Synopsis writing */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-zinc-700 block">Tóm tắt kịch bản lý tưởng</label>
                  <textarea
                    rows={3}
                    placeholder="Viết một đoạn tóm tắt hấp dẫn..."
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none text-zinc-800 focus:bg-white focus:border-blue-550 leading-relaxed text-xs"
                  />
                </div>

              </div>

              {/* Action Buttons Submit block */}
              <div className="pt-4 border-t border-zinc-150 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-550 font-bold transition-all cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {editingMovie ? 'Cập Nhật Ngay' : 'Kích Hoạt Công Bố'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
