import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    movielensId: {
      type: String,
      required: true,
      index: "text",
    },
    tmdbId: {
      type: Number,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Tên phim là bắt buộc"],
      trim: true,
      index: "text",
    },
    description: {
      type: String,
      required: [true, "Mô tả phim là bắt buộc"],
    },

    genres: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Genre",
      required: true,
      index: true,
    },

    releaseYear: {
      type: Number,
      required: true,
    },

    isPremium: Boolean,

    rating: {
      avarage: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    title: String,
    duration: Number,

    videoUrl: String,

    poster: {
      type: String, // URL ảnh poster
      required: [true, "Poster là bắt buộc"],
    },
    backdrop: {
      type: String, // URL ảnh nền rộng
      default: "",
    },
    trailer: {
      type: String, // URL trailer (YouTube embed)
      default: "",
    },
  },
  { timestamps: true },
);

movieSchema.index({ title: "text", originalTitle: "text", tags: "text" });
// Index lọc & sắp xếp phổ biến
movieSchema.index({ genres: 1, releaseYear: -1 });
movieSchema.index({ viewCount: -1 });
movieSchema.index({ "rating.average": -1 });
movieSchema.index({ isFeatured: 1, isActive: 1 });

movieSchema.methods.incrementView = function () {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Cập nhật điểm đánh giá
movieSchema.methods.updateRating = async function (newScore) {
  const total = this.rating.average * this.rating.count + newScore;
  this.rating.count += 1;
  this.rating.average = +(total / this.rating.count).toFixed(1);
  return this.save({ validateBeforeSave: false });
};

export default mongoose.model("Movie", movieSchema);
