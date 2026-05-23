import React from 'react';
import { LayoutDashboard, Film, Users, LogOut, Tv, Settings, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'movies' | 'users';
  setActiveTab: (tab: 'overview' | 'movies' | 'users') => void;
  onExitAdmin: () => void;
}

export default function AdminSidebar({ activeTab, setActiveTab, onExitAdmin }: SidebarProps) {
  const menuItems = [
    { id: 'overview', name: 'Tổng quan hệ thống', icon: LayoutDashboard },
    { id: 'movies', name: 'Quản lý kho phim', icon: Film },
    { id: 'users', name: 'Quản lý người dùng', icon: Users },
  ];

  return (
    <aside id="admin-sidebar" className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 text-slate-305 text-left">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 space-x-3 bg-slate-950/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg shadow-blue-550/20">
          <Film className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-white text-lg tracking-tight">CineMax Admin</span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Hệ thống quản trị</span>
        </div>
      </div>

      {/* Nav Link Lists */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15 font-black'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-450'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Exit Control Footer */}
      <div className="p-4 border-t border-slate-850 space-y-2">
        <div className="bg-slate-950/45 rounded-xl p-3 border border-slate-800/80 flex items-center space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="text-[10px] leading-relaxed text-zinc-500">
            Trạng thái quản trị viên: <strong className="text-emerald-400">Đang hoạt động</strong>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-550/20 bg-rose-950/15 hover:bg-rose-900/20 text-rose-400 text-xs font-bold transition-all"
        >
          <Tv className="h-4 w-4" />
          <span>Quay lại trang xem phim</span>
        </button>
      </div>
    </aside>
  );
}
