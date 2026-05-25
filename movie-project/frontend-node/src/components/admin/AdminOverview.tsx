import React from 'react';
import { Movie } from '../../types';
import { Film, Users, Eye, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';

interface OverviewProps {
  movies: Movie[];
  onNavigateToMovies: () => void;
  onNavigateToUsers: () => void;
}

export default function AdminOverview({ movies, onNavigateToMovies, onNavigateToUsers }: OverviewProps) {
  // Calculate dynamic stats
  const totalMovies = movies.length;
  const totalViews = movies.reduce((sum, item) => sum + (item.views || 0), 0);
  
  // Format total views (e.g. 1.2M or 842.1K)
  const formatViews = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toString();
  };

  // Static stats placeholders
  const staticStats = {
    totalUsers: 14850,
    userGrowth: '+12.4%',
    viewsGrowth: '+18.2%',
    vipRevenue: '148,650,000',
    revenueGrowth: '+8.6%',
    moviesGrowth: `+${Math.min(totalMovies, 5)}%`,
  };

  // Analyze movie categories for Chart (derive from genres)
  const categoryCounts: Record<string, number> = {};
  movies.forEach(m => {
    const cat = (m as any).genres && (m as any).genres.length > 0 ? ((m as any).genres[0].name || (m as any).genres[0]) : (m.category || 'Khác');
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoriesData = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalTags = categoriesData.reduce((acc, c) => acc + c.count, 0) || 1;

  // Last 7 days views stats
  const lineChartData = [
    { day: 'T5', views: 24000 },
    { day: 'T6', views: 38000 },
    { day: 'T7', views: 56000 },
    { day: 'CN', views: 78500 },
    { day: 'T2', views: 42000 },
    { day: 'T3', views: 51200 },
    { day: 'T4', views: 64100 },
  ];
  const maxVal = Math.max(...lineChartData.map(d => d.views)) * 1.15;

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] select-none text-zinc-800 text-left bg-zinc-50/50">
      
      {/* Overview Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Movies */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Trực quan kho phim</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{totalMovies}</span>
              <span className="text-xs text-zinc-500">phim</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{staticStats.moviesGrowth} tháng này</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Film className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Views */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Tổng lượt xem phim</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{formatViews(totalViews)}</span>
              <span className="text-xs text-zinc-500">lượt</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{staticStats.viewsGrowth} tuần qua</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total registered members */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Thành viên đăng ký</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{staticStats.totalUsers.toLocaleString()}</span>
              <span className="text-xs text-zinc-500">user</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{staticStats.userGrowth} tháng nay</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Sponsorship / Advertising Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Doanh thu đối tác (VND)</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-950 tracking-tight">{staticStats.vipRevenue}</span>
              <span className="text-xs text-zinc-500">đ</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{staticStats.revenueGrowth}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </section>

      {/* Visual Charts Component Panel Info */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Views in last 7 days */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-800">Thống Kê Lượt Xem</h3>
                <p className="text-xs text-zinc-400">Diễn biến lưu lượng truy cập xem phim 7 ngày gần nhất</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 rounded-lg text-zinc-650 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>+14.8% tuần trước</span>
              </span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="h-64 flex flex-col justify-between pt-4 relative">
              {/* Grid lines background */}
              <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none z-0">
                <div className="border-t border-dashed border-zinc-100" />
                <div className="border-t border-dashed border-zinc-100" />
                <div className="border-t border-dashed border-zinc-100" />
                <div className="border-t border-dashed border-zinc-100" />
              </div>

              {/* SVG Area */}
              <div className="flex-1 w-full relative z-10">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200">
                  {/* Definition of gradients */}
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Draw area filled path */}
                  <path
                    d={`
                      M 50 ${200 - (lineChartData[0].views / maxVal) * 160}
                      L 150 ${200 - (lineChartData[1].views / maxVal) * 160}
                      L 250 ${200 - (lineChartData[2].views / maxVal) * 160}
                      L 350 ${200 - (lineChartData[3].views / maxVal) * 160}
                      L 450 ${200 - (lineChartData[4].views / maxVal) * 160}
                      L 550 ${200 - (lineChartData[5].views / maxVal) * 160}
                      L 650 ${200 - (lineChartData[6].views / maxVal) * 160}
                      L 650 200 L 50 200 Z
                    `}
                    fill="url(#viewsGradient)"
                  />

                  {/* Stroke main line */}
                  <path
                    d={`
                      M 50 ${200 - (lineChartData[0].views / maxVal) * 160}
                      S 100 ${180 - (lineChartData[1].views / maxVal) * 160} 150 ${200 - (lineChartData[1].views / maxVal) * 160}
                      S 200 ${180 - (lineChartData[2].views / maxVal) * 160} 250 ${200 - (lineChartData[2].views / maxVal) * 160}
                      S 300 ${180 - (lineChartData[3].views / maxVal) * 160} 350 ${200 - (lineChartData[3].views / maxVal) * 160}
                      S 400 ${180 - (lineChartData[4].views / maxVal) * 160} 450 ${200 - (lineChartData[4].views / maxVal) * 160}
                      S 500 ${180 - (lineChartData[5].views / maxVal) * 160} 550 ${200 - (lineChartData[5].views / maxVal) * 160}
                      S 600 ${180 - (lineChartData[6].views / maxVal) * 160} 650 ${200 - (lineChartData[6].views / maxVal) * 160}
                    `}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Circle Dots & text overlays */}
                  {lineChartData.map((d, index) => {
                    const x = 50 + index * 100;
                    const y = 200 - (d.views / maxVal) * 160;
                    return (
                      <g key={index} className="group/dot cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth="3"
                          className="transition-transform group-hover/dot:scale-150 duration-200"
                        />
                        {/* Tooltip on hovering dot */}
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-zinc-700 select-none opacity-0 group-hover/dot:opacity-100 transition-opacity bg-white duration-200"
                        >
                          {d.views.toLocaleString()}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Lower text Labels */}
              <div className="flex justify-between border-t border-zinc-150 pt-2 px-10">
                {lineChartData.map((d, index) => (
                  <span key={index} className="text-zinc-500 font-bold text-xs">{d.day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Circular Breakdown of genres */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-sm flex flex-col justify-between text-left">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-800">Cơ Cấu Thể Loại</h3>
            <p className="text-xs text-zinc-400">Tỷ lệ các thể loại phim được phân bổ trong database hiện có</p>
            
            {/* Legend Breakdown metrics */}
            <div className="space-y-3.5 pt-4">
              {categoriesData.map((item, idx) => {
                const percentage = Math.round((item.count / totalTags) * 100);
                const colors = ['bg-blue-600', 'bg-orange-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-indigo-500'];
                const colorClass = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${colorClass}`} />
                        <span className="text-zinc-700">{item.name}</span>
                      </div>
                      <div className="space-x-1.5 text-zinc-500">
                        <span>{item.count} phim</span>
                        <span className="text-zinc-400">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Tiny Progress bar metric */}
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorClass} rounded-full`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between z-10">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Hành trình trải nghiệm</span>
            <span className="text-xs text-blue-600 font-bold">100% Phân tích</span>
          </div>
        </div>

      </section>

      {/* Recently Added Tabular display */}
      <section className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-sm text-left">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-800">5 Phim Vừa Cập Nhật Gần Đây</h3>
            <p className="text-xs text-zinc-400 font-medium">Danh sách các đầu phim mới đưa lên hệ thống</p>
          </div>
          <button 
            onClick={onNavigateToMovies}
            className="inline-flex items-center space-x-1 text-xs text-blue-600 font-bold hover:underline cursor-pointer"
          >
            <span>Tới quản lý kho phim</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200/60 font-sans">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold text-xs uppercase tracking-wider text-left">
                <th className="px-6 py-3.5">Ảnh & Tên gốc</th>
                <th className="px-6 py-3.5">Thể loại</th>
                <th className="px-6 py-3.5">Định dạng</th>
                {/* Nation column removed (backend does not expose country) */}
                <th className="px-6 py-3.5">Lượt xem</th>
                <th className="px-6 py-3.5">Điểm số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
              {movies.slice(-5).reverse().map((movie) => (
                <tr key={movie.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-3.5 flex items-center space-x-3.5 min-w-[280px]">
                    <img 
                      src={movie.poster} 
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-14 object-cover rounded shadow-md border border-zinc-200 shrink-0"
                    />
                    <div className="text-left space-y-0.5">
                      <span className="font-extrabold text-zinc-900 block leading-tight">{movie.title}</span>
                      <span className="text-[10px] text-zinc-450 font-bold block">{movie.originalTitle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-650">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-650 rounded-lg text-[11px] font-bold">
                      {movie.category}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-zinc-800">{movie.quality}</span>
                  </td>
                  {/* country removed */}
                  <td className="px-6 py-3.5 font-black text-zinc-800 font-mono">
                    {movie.views?.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center space-x-1 font-bold text-amber-500">
                      ★ {movie.imdb}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
