import mongoose from "mongoose";
const ratingSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "movie",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Điểm đánh giá là bắt buộc"],
      min: 1,
      max: 10,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isApproved: {
      type: Boolean,
      default: true, // Set false nếu cần duyệt thủ công
    },
    isSpoiler: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Mỗi user chỉ đánh giá 1 lần mỗi phim
ratingSchema.index({ movie: 1, user: 1 }, { unique: true });

// Sau khi lưu rating → cập nhật rating của movie
ratingSchema.post("save", async function () {
  const movie = mongoose.model("movie");
  const movie = await movie.findById(this.movie);
  if (movie) await movie.updateRating(this.rating);
});

export default mongoose.model("Rating", ratingSchema);
