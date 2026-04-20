import express from "express";
import History from "../models/history.js";
import Rating from "../models/rating.js";

const router = express.Router();

// POST /history
router.post("/history", async (req, res) => {
  try {
    const { userId, movieId, watchTime } = req.body;

    const history = await History.create({
      userId,
      movieId,
      watchTime,
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /rating
router.post("/rating", async (req, res) => {
  try {
    const { userId, movieId, rating } = req.body;

    const result = await Rating.findOneAndUpdate(
      { userId, movieId },
      { rating },
      { upsert: true, new: true },
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/user/:id/activity", async (req, res) => {
  try {
    const history = await History.find({ userId: req.params.id }).populate(
      "movieId",
    );

    const ratings = await Rating.find({ userId: req.params.id }).populate(
      "movieId",
    );

    res.json({ history, ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
