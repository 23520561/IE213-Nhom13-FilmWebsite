// --- Các hàm API giữ nguyên logic cũ ---
export const handleAddMovie = async (newDoc: any) => {
  try {
    showNotification("Đang thêm phim mới...");
    const createdMovie = await graphqlCreateMovie(newDoc);
    setMovies((prev) => [{ ...newDoc, id: createdMovie.id }, ...prev]);
    showNotification(`Đã thêm thành công: "${newDoc.title}"`);
  } catch (error: any) {
    showNotification(error.message || "Lỗi khi thêm phim.");
  }
};

export const handleEditMovie = async (id: string, updatedData: any) => {
  try {
    showNotification("Đang lưu thay đổi...");
    await graphqlUpdateMovie(id, updatedData);
    setMovies((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m)),
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
    setMovies((prev) => prev.filter((m) => m.id !== id));
    showNotification("Đã xóa phim thành công.");
  } catch (error: any) {
    showNotification(error.message || "Lỗi khi xóa phim.");
  }
};
