import { useState, useEffect } from "react";
import { User } from "../types";

const useAuth = function(){
  // Khởi tạo State lưu thông tin User hiện tại từ LocalStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("cinemax_user_info");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
	function updateUser(user: User){
		setCurrentUser(user)
	}
  // Lưu tự động mỗi khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("cinemax_user_info", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("cinemax_user_info");
    }
  }, [currentUser]);
	return {currentUser, updateUser}
}
export default useAuth
