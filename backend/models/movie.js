import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    thumbnail: String,
  },
  { timestamps: true },
);

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;
