import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    thumbnail: String,
    // Đoạn thêm từ đây
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tags: [String],
    // Đoạn thêm đến đây
  },
  { timestamps: true },
);

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;
