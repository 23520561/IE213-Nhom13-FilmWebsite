import React from "react";
import {
  LayoutDashboard,
  Film,
  Users,
  LogOut,
  Tv,
  Settings,
  ShieldAlert,
} from "lucide-react";

interface SidebarProps {
  activeTab: "movies" | "users" | "moderation";
  setActiveTab: (tab: "movies" | "users" | "moderation") => void;
  onExitAdmin: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  onExitAdmin,
}: SidebarProps) {
  const menuItems = [
    { id: "movies", name: "Quản lý kho phim", icon: Film },
    { id: "users", name: "Quản lý người dùng", icon: Users },
    { id: "moderation", name: "Kiểm duyệt nội dung", icon: ShieldAlert },
  ] as const;

  return (
    <aside
      id="admin-sidebar"
      className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 text-slate-300 text-left"
    >
      <div className="h-20 flex items-center px-6 border-b border-slate-800 space-x-3 bg-slate-950/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg shadow-blue-550/20">
          <Film className="h-5 w-5" />
        </div>
        <div>
          <span className="text-sm font-black text-slate-100 block tracking-wide font-sans">
            CineMax Control
          </span>
          <span className="text-[10px] text-zinc-500 font-bold block tracking-wider font-mono">
            WORKSPACE V1.0
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15 font-black"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-450"}`}
              />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-850 space-y-2">
        <div className="bg-slate-950/45 rounded-xl p-3 border border-slate-800/80 flex items-center space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="text-[10px] leading-relaxed text-zinc-500">
            Trạng thái quản trị viên:{" "}
            <strong className="text-emerald-400">Đang hoạt động</strong>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-750/50 cursor-pointer"
        >
          <span>Quay về trang phim</span>
        </button>
      </div>
    </aside>
  );
}
