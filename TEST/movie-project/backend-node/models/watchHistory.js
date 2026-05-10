import mongoose from "mongoose";
const watchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tham chiếu đến Collection User
      required: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie", // Tham chiếu đến Collection Movie
      required: true,
    },
    watchedTime: {
      type: Number,
      default: 0, // Thời gian đã xem (giây)
    },
    duration: {
      type: Number,
      required: true, // Tổng thời lượng phim
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động tạo 'createdAt' và 'updatedAt'
  },
);

// Tạo Compound Index để đảm bảo 1 user chỉ có 1 bản ghi lịch sử duy nhất cho 1 bộ phim
watchHistorySchema.index({ userId: 1, movieId: 1 }, { unique: true });

export default mongoose.model("WatchHistory", watchHistorySchema);
