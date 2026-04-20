import express from "express";
import Movie from "../models/movie.js";
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

//
// CREATE MOVIE
//
router.post("/movies", verifyToken, isAdmin, async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// GET ALL MOVIES
//
router.get("/movies", verifyToken, isAdmin, async (req, res) => {
  try {
    const movies = await Movie.find().populate("categoryIds");
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// GET ONE MOVIE
//
router.get("/movies/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate("categoryIds");
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// UPDATE MOVIE
//
router.put("/movies/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!movie) return res.status(404).json({ error: "Movie not found" });

    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// DELETE MOVIE
//
router.delete("/movies/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) return res.status(404).json({ error: "Movie not found" });

    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
