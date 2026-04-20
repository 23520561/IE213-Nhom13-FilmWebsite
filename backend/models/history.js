import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
  watchTime: { type: Number, default: 0 },
  watchedAt: { type: Date, default: Date.now },
});

const History = mongoose.model("History", historySchema);

export default History;
