import React, { useState } from "react";
import { MessageSquare, Trash2, ShieldCheck, Film, Search } from "lucide-react";

interface CommentFromDB {
  id: string;
  content: string;
  user: { username: string };
  movie: { title: string };
  createdAt: string;
}

interface AdminModerationProps {
  comments: CommentFromDB[];
  onDeleteComment: (commentId: string) => void;
}

export default function AdminModeration({
  comments,
  onDeleteComment,
}: AdminModerationProps) {
  const [search, setSearch] = useState("");

  const filteredComments = comments.filter(
    (c) =>
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      c.user.username.toLowerCase().includes(search.toLowerCase()) ||
      c.movie.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 select-none animate-fadeIn text-left text-zinc-800">
      {/* Header & Thanh tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo nội dung, tên người dùng, tên phim..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 outline-none text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-blue-500 transition-all text-xs"
          />
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl border border-amber-200/50">
          <ShieldCheck className="w-4 h-4 mr-1.5" />
          <span>Trung tâm kiểm duyệt nội dung</span>
        </div>
      </div>

      {/* Bảng Bình Luận */}
      <section className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-zinc-800 font-sans border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 text-xs font-bold tracking-wider text-left">
                <th className="px-6 py-4 w-1/4">Người dùng</th>
                <th className="px-6 py-4 w-2/4">Nội dung bình luận</th>
                <th className="px-6 py-4 w-1/4 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium divide-y divide-zinc-100">
              {filteredComments.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-12 text-center text-zinc-400 font-bold"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <MessageSquare className="w-10 h-10 text-zinc-300" />
                      <span>Không có bình luận nào cần hiển thị.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => (
                  <tr
                    key={comment.id}
                    className="hover:bg-zinc-50/60 transition-colors"
                  >
                    {/* Cột User & Thời gian */}
                    <td className="px-6 py-4 align-top">
                      <span className="font-extrabold text-zinc-900 block">
                        {comment.user.username}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold mt-1 block">
                        Đăng lúc:{" "}
                        {new Date(
                          Number(comment.createdAt) || Date.now(),
                        ).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Cột Nội dung bình luận & Phim */}
                    <td className="px-6 py-4 text-left">
                      <p className="text-zinc-700 text-xs leading-relaxed max-w-2xl bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                        {comment.content}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-2 text-[10px] text-blue-600 font-bold bg-blue-50/50 w-fit px-2 py-1 rounded-md">
                        <Film className="w-3 h-3" />
                        <span>Tại phim: {comment.movie.title}</span>
                      </div>
                    </td>

                    {/* Cột Xóa */}
                    <td className="px-6 py-4 text-center align-middle">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Bình luận này vi phạm quy tắc? Bạn chắc chắn muốn xóa?",
                            )
                          ) {
                            onDeleteComment(comment.id);
                          }
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/60 hover:bg-rose-100 hover:text-rose-700 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa vi phạm</span>
                      </button>
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
