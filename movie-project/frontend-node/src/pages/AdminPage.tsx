import { Movie } from "@/src/types";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  graphqlCreateMovie,
  graphqlDeleteComment,
  graphqlDeleteMovie,
  graphqlGetAllComments,
  graphqlGetAllUsers,
  graphqlUpdateMovie,
  graphqlUpdateUserStatus,
} from "@/src/services/graphql";

interface AdminDashboardProps {
  movies: Movie[];
  setMovies: (m:Movie[])=>void;
  showNotification: (msg: string) => void;
  currentUser: any;
}

// Admin modules lazy loaded for premium production performance setup
const AdminSidebar = React.lazy(
  () => import("../components/admin/AdminSidebar"),
);
const AdminTopbar = React.lazy(() => import("../components/admin/AdminTopbar"));
const AdminMovies = React.lazy(() => import("../components/admin/AdminMovies"));
const AdminUsers = React.lazy(() => import("../components/admin/AdminUsers"));
const AdminModeration = React.lazy(
  () => import("../components/admin/AdminModeration"),
);
export function AdminPage({
  movies,
  setMovies,
  showNotification,
  currentUser,
}: AdminDashboardProps) {
  // Thay đổi tab mặc định ban đầu là quản lý phim 'movies' thay vì 'overview'
  const [adminTab, setAdminTab] = useState<"movies" | "users" | "moderation">(
    "movies",
  );
  const [users, setUsers] = useState<any[]>([]); // Khởi tạo state lưu danh sách users từ DB
  const [comments, setComments] = useState<any[]>([]); // State lưu danh sách comment cho moderation
  const navigate = useNavigate();

  // Khóa bảo mật điều hướng
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      showNotification("Truy cập bị từ chối!");
      navigate("/");
      return;
    }

    // Gọi API lấy danh sách user từ DB ngay khi vào trang Admin
    const fetchUsers = async () => {
      const dbUsers = await graphqlGetAllUsers();
      setUsers(dbUsers);
    };
    fetchUsers();
  }, [currentUser, navigate, showNotification]);

  useEffect(() => {
    if (adminTab === "moderation") {
      const fetchComments = async () => {
        try {
          const dbComments = await graphqlGetAllComments();
          setComments(dbComments);
        } catch (error) {
          showNotification(
            "Chưa thể tải danh sách bình luận (Kiểm tra lại Backend Resolver)",
          );
        }
      };
      fetchComments();
    }
  }, [adminTab]);

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  // --- Các hàm API giữ nguyên logic cũ ---
  const handleAddMovie = async (newDoc: any) => {
    try {
      showNotification("Đang thêm phim mới...");
      const createdMovie = await graphqlCreateMovie(newDoc);
      setMovies([{ ...newDoc, id: createdMovie.id }, ...movies]);
      showNotification(`Đã thêm thành công: "${newDoc.title}"`);
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi thêm phim.");
    }
  };

  const handleEditMovie = async (id: string, updatedData: any) => {
    try {
      showNotification("Đang lưu thay đổi...");
      await graphqlUpdateMovie(id, updatedData);
      setMovies(movies.map((m) => (m.id === id ? { ...m, ...updatedData } : m)),
      );
      showNotification("Đã cập nhật phim!");
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi cập nhật.");
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phim này?")) return;
    try {
      showNotification("Đang thực hiện xóa...");
      await graphqlDeleteMovie(id);
      setMovies(movies.filter((m) => m.id !== id));
      showNotification("Đã xóa phim thành công.");
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi xóa phim.");
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    try {
      const newStatus = !currentStatus;
      await graphqlUpdateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: newStatus } : u)),
      );
      showNotification(
        newStatus ? "Đã MỞ KHÓA tài khoản!" : "Đã KHÓA tài khoản thành công!",
      );
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi cập nhật trạng thái.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await graphqlDeleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      showNotification("Đã xóa bình luận vi phạm!");
    } catch (error: any) {
      showNotification(error.message || "Lỗi khi xóa bình luận.");
    }
  };

  return (
    <div className="flex bg-[#0f172a] text-slate-100 min-h-screen font-sans overflow-hidden text-left fixed inset-0 z-50">
      <AdminSidebar
        activeTab={adminTab}
        setActiveTab={setAdminTab}
        onExitAdmin={() => {
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#f8fafc]">
        <AdminTopbar
          currentTabName={
            adminTab === "movies"
              ? "Quản lý kho phim"
              : adminTab === "users"
                ? "Danh sách người dùng đăng ký"
                : "Hệ thống kiểm duyệt nội dung"
          }
          currentUser={currentUser}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 font-sans">
          {adminTab === "movies" && (
            <AdminMovies
              movies={movies}
              onAddMovie={handleAddMovie}
              onEditMovie={handleEditMovie}
              onDeleteMovie={handleDeleteMovie}
            />
          )}

          {adminTab === "users" && (
            <AdminUsers
              users={users}
              onToggleUserStatus={handleToggleUserStatus}
            />
          )}

          {adminTab === "moderation" && (
            <React.Suspense fallback={<div>Đang tải...</div>}>
              <AdminModeration
                comments={comments}
                onDeleteComment={handleDeleteComment}
              />
            </React.Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
