import DataLoader from "dataloader";
import User from "../../models/user.js";
import Movie from "../../models/movie.js";
import Genre from "../../models/genres.js";

export const createLoaders = () => {
  return {
    userLoader: new DataLoader(async (ids) => {
      const users = await User.find({ _id: { $in: ids } });
      return ids.map((id) =>
        users.find((user) => user._id.toString() === id.toString()),
      );
    }),
    movieLoader: new DataLoader(async (ids) => {
      const movies = await Movie.find({ _id: { $in: ids } });
      return ids.map((id) =>
        movies.find((movie) => movie._id.toString() === id.toString()),
      );
    }),
    genreLoader: new DataLoader(async (ids) => {
      const genres = await Genre.find({ _id: { $in: ids } });
      return ids.map((id) =>
        genres.find((genre) => genre._id.toString() === id.toString()),
      );
    }),
  };
};
// const userLoader = new DataLoader(async (ids) => {
//   const users = await User.find({ _id: { $in: ids } });
//   return ids.map((id) => users.find((user) => user._id.toString() === id));
// });

// const movieLoader = new DataLoader(async (ids) => {
//   const movies = await Movie.find({ _id: { $in: ids } });
//   return ids.map((id) => movies.find((movie) => movie._id.toString() === id));
// });

// const genreLoader = new DataLoader(async (ids) => {
//   const genres = await Genre.find({ _id: { $in: ids } });
//   return ids.map((id) => genres.find((genre) => genre._id.toString() === id));
// });

// export { userLoader, movieLoader, genreLoader };
