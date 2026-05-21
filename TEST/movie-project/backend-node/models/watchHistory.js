import mongoose from "mongoose";
const watchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    watchedTime: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: true,
    },
    isFinished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: 1 user only has 1 watch history record per movie
watchHistorySchema.index({ user: 1, movie: 1 }, { unique: true });

export default mongoose.model("WatchHistory", watchHistorySchema);
