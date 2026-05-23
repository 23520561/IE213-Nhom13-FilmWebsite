import React, { useState } from 'react';
import { Search, Bell, Mail, HelpCircle, User, LogOut, Check } from 'lucide-react';

interface TopbarProps {
  currentTabName: string;
}

export default function AdminTopbar({ currentTabName }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    { id: 1, text: 'Phim mới "Chiến Binh Cuối Cùng" vừa được thêm bởi Admin_01.', time: '10 phút trước', read: false },
    { id: 2, text: 'Người dùng huan_pham@gmail.com vừa đóng góp ý kiến đánh giá phim.', time: '1 giờ trước', read: true },
    { id: 3, text: 'Báo cáo vi phạm nội dung tóm tắt phim "Ảo Ảnh Kinh Hoàng" đã xử lý.', time: '2 giờ trước', read: true },
  ];

  return (
    <header className="h-20 bg-white border-b border-zinc-200/80 px-8 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Title block */}
      <div className="flex flex-col text-left">
        <h1 className="text-xl font-bold text-slate-850 tracking-tight">{currentTabName}</h1>
        <p className="text-[11px] text-zinc-500 font-medium">Bảng điều hướng tổng hợp trạng thái thời gian thực</p>
      </div>

      {/* Global tools */}
      <div className="flex items-center space-x-5">
        
        {/* Mock Search input */}
        <div className="relative hidden md:flex items-center bg-zinc-100 rounded-full px-4 py-1.8 border border-zinc-200/50">
          <Search className="w-4 h-4 text-zinc-400 mr-2" />
          <input 
            type="text" 
            placeholder="Tìm kiếm tác vụ, phim, người dùng..." 
            className="bg-transparent text-xs text-zinc-800 outline-none w-56 placeholder-zinc-450"
          />
        </div>

        {/* Notifications list trigger */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-zinc-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
              <div className="px-4 py-2 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <span className="text-xs font-bold text-zinc-800">Thông báo mới nhất</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">Đánh dấu đã đọc</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 border-b border-zinc-50 hover:bg-zinc-50/80 transition-colors last:border-0 leading-tight">
                    <p className={`text-xs ${notif.read ? 'text-zinc-500' : 'text-zinc-800 font-semibold'}`}>{notif.text}</p>
                    <span className="text-[9px] text-zinc-400 block mt-1">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help tooltip toggle */}
        <button className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer" title="Cần trợ giúp?">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Administrator profile */}
        <div className="relative">
          <button 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center space-x-2.5 pl-3 border-l border-zinc-200/80 cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm border-2 border-white ring-2 ring-blue-105 shadow-md">
              AD
            </div>
            <div className="hidden lg:block">
              <span className="text-xs font-bold text-zinc-800 block">Nguyễn Chí Viễn</span>
              <span className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider">Super Admin</span>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-zinc-200/80 py-2 z-50 text-left">
              <div className="px-4 py-2 border-b border-zinc-100">
                <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-widest">Tài khoản</span>
                <span className="text-xs font-semibold text-zinc-800">admin@cinemax.com</span>
              </div>
              <button className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs text-zinc-750 hover:bg-zinc-55 hover:text-zinc-850">
                <User className="w-4 h-4 text-zinc-455" />
                <span>Hồ sơ cá nhân</span>
              </button>
              <button 
                onClick={() => { setShowProfile(false); }}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs text-emerald-600 hover:bg-emerald-50"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Trạng thái hoạt động</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
