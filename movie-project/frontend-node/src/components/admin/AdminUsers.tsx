import React, { useState } from 'react';
import { Search, UserPlus, Shield, UserX, UserCheck, ShieldAlert, BadgeCheck, Mail, Sparkles, Filter } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  regDate: string;
  role: 'Admin' | 'Thành viên' | 'Đối tác';
  status: 'Active' | 'Banned';
}

const INITIAL_USERS: User[] = [
  { id: 'usr-1', name: 'Nguyễn Chí Viễn', email: 'admin@cinemax.com', regDate: '2024-01-12', role: 'Admin', status: 'Active' },
  { id: 'usr-2', name: 'Lê Kiều Mỹ Linh', email: 'mylinh99@gmail.com', regDate: '2024-03-24', role: 'Đối tác', status: 'Active' },
  { id: 'usr-3', name: 'Trần Minh Hoàng', email: 'hoang_trieu@hotmail.com', regDate: '2024-05-18', role: 'Thành viên', status: 'Active' },
  { id: 'usr-4', name: 'Phan Gia Huy', email: 'huyphan_dev@gmail.com', regDate: '2024-06-02', role: 'Đối tác', status: 'Banned' },
  { id: 'usr-5', name: 'Vũ Thị Ngọc Hà', email: 'ngocha.vu@yahoo.com', regDate: '2024-08-11', role: 'Thành viên', status: 'Active' },
  { id: 'usr-6', name: 'Đỗ Hùng Dũng', email: 'dungdh.play@outlook.com', regDate: '2024-10-05', role: 'Thành viên', status: 'Active' },
  { id: 'usr-7', name: 'Nguyễn Tiến Linh', email: 'linhgoal@gmail.com', regDate: '2024-12-19', role: 'Đối tác', status: 'Active' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('Tất Cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất Cả');

  // Input states for adding new mockup user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Thành viên' | 'Đối tác'>('Thành viên');
  const [showAddForm, setShowAddForm] = useState(false);

  // Toggle user status (Active/Banned)
  const handleToggleStatus = (id: string) => {
    setUsers(uList => uList.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Banned' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Toggle role upgrade
  const handleUpgradeRole = (id: string, currentRole: 'Admin' | 'Thành viên' | 'Đối tác') => {
    let nextRole: 'Admin' | 'Thành viên' | 'Đối tác' = 'Thành viên';
    if (currentRole === 'Thành viên') nextRole = 'Đối tác';
    else if (currentRole === 'Đối tác') nextRole = 'Admin';
    else nextRole = 'Thành viên';

    setUsers(uList => uList.map(u => {
      if (u.id === id) {
        return { ...u, role: nextRole };
      }
      return u;
    }));
  };

  // Submission handler for manual user inject
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const customUser: User = {
      id: `usr-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      regDate: new Date().toISOString().split('T')[0],
      role: newUserRole,
      status: 'Active'
    };

    setUsers(prev => [customUser, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddForm(false);
  };

  // Filter members row
  const filteredUsers = users.filter(usr => {
    const matchesSearch = usr.name.toLowerCase().includes(search.toLowerCase()) || 
                          usr.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === 'Tất Cả' || usr.role === selectedRole;
    const matchesStatus = selectedStatus === 'Tất Cả' || usr.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate quick metrics
  const activeCount = users.filter(u => u.status === 'Active').length;
  const partnerCount = users.filter(u => u.role === 'Đối tác').length;
  const bannedCount = users.filter(u => u.status === 'Banned').length;

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] select-none text-zinc-850 text-left bg-zinc-50/50">
      
      {/* Top dashboard panels info cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Thành viên Đang Hoạt Động</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{activeCount} / {users.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Tài Khoản Đối Tác Cao Cấp</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{partnerCount} tài khoản</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BadgeCheck className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-medium">Bị chặn truy cập (Banned)</span>
            <span className="text-2xl font-black text-slate-900 font-mono text-rose-600">{bannedCount} user</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
        </div>

      </section>

      {/* Filter and registration controller controls */}
      <section className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-sm space-y-4">
        
        {/* Row control actions and headers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900">Danh Sách Thành Viên</h2>
            <p className="text-xs text-zinc-400">Xem hồ sơ, thời gian tham gia lớp đặc quyền và thu hồi giấy phép tài khoản</p>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-650 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer w-fit"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo tài khoản Demo</span>
          </button>
        </div>

        {/* Live inputs for adding simulation users */}
        {showAddForm && (
          <form onSubmit={handleAddUserSubmit} className="bg-zinc-50 rounded-xl p-4 border border-zinc-200/60 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-zinc-600">Tên người dùng *</label>
              <input
                type="text"
                required
                placeholder="VD: Trần Đình Khải"
                value={newUserName}
                aria-label="Tên người dùng"
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.8 text-xs outline-none focus:border-blue-500 text-zinc-800"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-zinc-600">Email thành viên *</label>
              <input
                type="email"
                required
                placeholder="developer@gmail.com"
                value={newUserEmail}
                aria-label="Email thành viên"
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.8 text-xs outline-none focus:border-blue-500 text-zinc-800"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-zinc-600">Quyền/Vai trò</label>
              <select
                value={newUserRole}
                aria-label="Quyền/Vai trò"
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.8 text-xs outline-none focus:border-blue-500 text-zinc-850 cursor-pointer"
              >
                <option value="Thành viên">Thành viên Phổ thông</option>
                <option value="Đối tác">Đặc quyền Đối tác</option>
                <option value="Admin">Nhân viên Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-650 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-500/5 h-[34px]"
            >
              Cấp phép sinh tạo
            </button>
          </form>
        )}

        {/* Search controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Text search user table */}
          <div className="relative flex items-center bg-zinc-100 rounded-xl px-4 py-2 border border-zinc-200/40">
            <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Tìm theo họ tên, thư điện tử..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 outline-none w-full placeholder-zinc-400"
            />
          </div>

          {/* Role selector dropdown */}
          <div className="flex items-center space-x-2 bg-zinc-100/60 rounded-xl px-3.5 py-1.5 border border-zinc-200/50">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider shrink-0">Phân quyền:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 outline-none w-full cursor-pointer"
            >
              <option value="Tất Cả">Tất Cả Vai Trò</option>
              <option value="Thành viên">Thành viên Thường</option>
              <option value="Đối tác">Đặc quyền Đối tác</option>
              <option value="Admin">Hệ thống Admin</option>
            </select>
          </div>

          {/* Status filter dropdown */}
          <div className="flex items-center space-x-2 bg-zinc-100/60 rounded-xl px-3.5 py-1.5 border border-zinc-200/50">
            <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider shrink-0">Giới hạn:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-700 outline-none w-full cursor-pointer"
            >
              <option value="Tất Cả">Tất Cả Trạng Thái</option>
              <option value="Active">Đang Hoạt Động</option>
              <option value="Banned">Đã bị Banned</option>
            </select>
          </div>
        </div>

      </section>

      {/* User listings Table */}
      <section className="bg-white rounded-2xl border border-zinc-200/95 shadow-sm overflow-hidden">
        <div className="overflow-x-auto rounded-t-2xl font-sans">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-zinc-55 border-b border-zinc-200 text-zinc-500 font-bold text-xs uppercase tracking-wider text-left">
                <th className="px-6 py-4">Họ Và Tên</th>
                <th className="px-6 py-4">Hòm Thư Liên Hệ</th>
                <th className="px-6 py-4">Ngày Đăng Ký</th>
                <th className="px-6 py-4">Nhóm Quyền</th>
                <th className="px-6 py-4">Bảo Mật</th>
                <th className="px-6 py-4 text-center">Tùy Chọn Khắc Phục</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">
                    Không tìm thấy thành viên phù hợp tiêu chí!
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                    
                    {/* User profile details */}
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-700 text-xs text-uppercase">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-extrabold text-zinc-900">{user.name}</span>
                    </td>

                    {/* Email path */}
                    <td className="px-6 py-4 font-semibold text-zinc-600">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{user.email}</span>
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4 font-medium text-zinc-500 font-mono">
                      {user.regDate}
                    </td>

                    {/* Permissions tags */}
                    <td className="px-6 py-4">
                      {user.role === 'Admin' ? (
                        <span className="px-2.5 py-1 bg-red-50 text-red-650 rounded-lg text-[10px] font-black border border-red-220">
                          Super Admin
                        </span>
                      ) : user.role === 'Đối tác' ? (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black border border-amber-200">
                          Đối tác liên kết
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold border border-blue-200">
                          Thành Viên Thường
                        </span>
                      )}
                    </td>

                    {/* Active/Banned indicator */}
                    <td className="px-6 py-4">
                      {user.status === 'Active' ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                          ● Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                          ● Bị vô hiệu hóa
                        </span>
                      )}
                    </td>

                    {/* Toggle controls */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-3.5">
                        {/* Change permissions level */}
                        <button
                          onClick={() => handleUpgradeRole(user.id, user.role)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[10px] text-zinc-650 font-bold transition-all cursor-pointer"
                          title="Thay đổi bậc vai trò"
                        >
                          Đổi Vai Trò
                        </button>

                        {/* Ban trigger */}
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            user.status === 'Active' 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {user.status === 'Active' ? (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Ban Account</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Mở Khóa</span>
                            </>
                          )}
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

    </div>
  );
}
