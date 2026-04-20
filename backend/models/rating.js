import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true },
);

//prevent duplicate rating
ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
