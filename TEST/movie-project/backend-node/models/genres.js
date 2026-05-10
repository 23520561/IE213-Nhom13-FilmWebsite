import mongoose from "mongoose";

const genreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên thể loại là bắt buộc"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: số lượng phim theo thể loại
genreSchema.virtual("movieCount", {
  ref: "Movie",
  localField: "_id",
  foreignField: "genres",
  count: true,
});

export default mongoose.model("Genre", genreSchema);
