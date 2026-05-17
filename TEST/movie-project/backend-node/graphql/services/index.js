import User from "../../models/user.js";
import Movie from "../../models/movie.js";

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
  return await Movie.findById(id);
};

export { getAllUsers, getUserById, getMovies, getMovieById };
