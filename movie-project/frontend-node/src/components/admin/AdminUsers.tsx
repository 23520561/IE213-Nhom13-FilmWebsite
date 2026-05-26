import React, { useState } from "react";
import {
  Search,
  ShieldAlert,
  BadgeCheck,
  Mail,
  Filter,
  Lock,
  Unlock,
} from "lucide-react";

interface UserFromDB {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive?: boolean;
}

interface AdminUsersProps {
  users: UserFromDB[];
  onToggleUserStatus?: (userId: string, currentStatus: boolean) => void; // Hàm xử lý khi bấm nút Khóa/Mở
}

export default function AdminUsers({
  users,
  onToggleUserStatus,
}: AdminUsersProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 select-none animate-fadeIn text-left text-zinc-800">
      {/* Thanh Công Cụ & Tìm Kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 outline-none text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-blue-500 transition-all text-xs"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-bold transition-all">
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ lọc</span>
          </button>
        </div>
      </div>

      {/* Bảng Dữ Liệu */}
      <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-zinc-800 font-sans border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 text-xs font-bold tracking-wider text-left">
                <th className="px-6 py-4">Thành viên hệ thống</th>
                <th className="px-6 py-4">Thông tin liên lạc</th>
                <th className="px-6 py-4">Phân quyền vai trò</th>
                <th className="px-6 py-4 text-center">
                  Trạng thái (Ban/Unban)
                </th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium divide-y divide-zinc-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-zinc-400 font-bold"
                  >
                    Không tìm thấy thành viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = user.isActive !== false; // Mặc định là true nếu không có dữ liệu

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 text-left">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md ${isActive ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/10" : "bg-zinc-400 grayscale"}`}
                          >
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-zinc-900 block leading-tight">
                              {user.username}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                              ID: {user.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="inline-flex items-center space-x-2 text-zinc-650">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-semibold">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black border border-amber-200/50">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Quản trị viên</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black border border-slate-200/60">
                            <BadgeCheck className="w-3 h-3 text-slate-400" />
                            <span>Thành viên</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            if (user.role === "admin") {
                              alert(
                                "Không thể khóa tài khoản của Quản trị viên!",
                              );
                              return;
                            }
                            if (
                              confirm(
                                `Bạn muốn ${isActive ? "KHÓA" : "MỞ KHÓA"} tài khoản ${user.username}?`,
                              )
                            ) {
                              onToggleUserStatus &&
                                onToggleUserStatus(user.id, isActive);
                            }
                          }}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100"
                          }`}
                        >
                          {isActive ? (
                            <Unlock className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          <span>
                            {isActive ? "Đang hoạt động" : "Đã bị khóa"}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
