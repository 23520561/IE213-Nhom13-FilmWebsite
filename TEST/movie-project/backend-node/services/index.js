import DataLoader from "dataloader";
import User from "../models/user.js";
import Movie from "../models/movie.js";

const userLoader = new DataLoader(async (ids) => {
  const users = await User.find({ _id: { $in: ids } });
  return ids.map((id) => users.find((user) => user._id.toString() === id));
});

const movieLoader = new DataLoader(async (ids) => {
  const movies = await Movie.find({ _id: { $in: ids } });
  return ids.map((id) => movies.find((movie) => movie._id.toString() === id));
});

const genreLoader = new DataLoader(async (ids) => {
  const genres = await Genre.find({ _id: { $in: ids } });
  return ids.map((id) => genres.find((genre) => genre._id.toString() === id));
});

const getAllUsers = async () => {
  // Implementation for getting all users
  return await userLoader.loadMany(
    await User.find()
      .select("_id")
      .then((users) => users.map((user) => user._id.toString())),
  );
};

const getUserById = async (id) => {
  // Implementation for getting user by ID
  return await userLoader.load(id);
};

const getMovies = async (page, limit) => {
  // Implementation for getting movies
  return await Movie.find()
    .skip((page - 1) * limit)
    .limit(limit);
};

const getMovieById = async (id) => {
  // Implementation for getting movie by ID
  return await movieLoader.load(id);
};

export { getAllUsers, getUserById, getMovies, getMovieById };
