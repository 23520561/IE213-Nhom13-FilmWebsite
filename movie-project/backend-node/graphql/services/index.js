import User from "../../models/user.js";
import Movie from "../../models/movie.js";
import Rating from "../../models/ratings.js";

const getAllUsers = async () => {
  // Implementation for getting all users
  return await User.find();
};

const getUserById = async (id) => {
  // Implementation for getting user by ID
  return await User.findById(id);
};

const getMovies = async (page, limit) => {
  // Implementation for getting movies
  return await Movie.find()
    .skip((page - 1) * limit)
    .limit(limit);
};

const getMovieById = async (id) => {
  // Implementation for getting movie by ID
  const movie = await Movie.findById(id);
  return movie;
};

const getRatingsByMovieId = async (movieId) => {
  return await Rating.find({ movie: movieId }).sort({ createdAt: -1 });
};
export {
  getAllUsers,
  getUserById,
  getMovies,
  getMovieById,
  getRatingsByMovieId,
};
