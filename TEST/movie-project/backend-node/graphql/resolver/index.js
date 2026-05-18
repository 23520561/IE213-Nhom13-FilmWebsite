import { gql } from "apollo-server";
import models from "../../models/index.js";
import {
  getAllUsers,
  getMovies,
  getUserById,
  getMovieById,
} from "../services/index.js";
import { getSimilarMovies, recommendMovies } from "../../proto/grpcClient.js";
const resolvers = {
  Query: {
    users: async (parent, args, context) => {
      return await getAllUsers();
    },
    user: async (parent, args, context) => {
      return await getUserById(args.id);
    },
    movies: async (parent, args, context) => {
      return await getMovies(args.page, args.limit, args.genre, args.search);
    },
    movie: async (parent, args, context) => {
      return await getMovieById(args.id);
    },
    genres: async (parent, args, context) => {
      return await models.Genre.find().sort({ name: 1 });
    },
    ratings: async (parent, args, context) => {
      return await models.Rating.find();
    },
    watchHistories: async (parent, args, context) => {
      return await models.WatchHistory.find();
    },
    myWatchHistory: async (parent, args, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return await models.WatchHistory.find({ userId: context.user.id });
    },
    comments: async (parent, args, context) => {
      return await models.Comment.find();
    },
    trendingMovies: async (parent, args, context) => {
      return await models.Movie.find()
        .sort({ viewCount: -1 })
        .limit(args.limit);
    },
    featuredMovies: async (parent, args, context) => {
      return await models.Movie.find({ isFeatured: true }).limit(args.limit);
    },
    topRatedMovies: async (parent, args, context) => {
      return await models.Movie.find()
        .sort({ "rating.average": -1 })
        .limit(args.limit);
    },
  },
  Movie: {
    genres: async (parent, args, context) => {
      return await context.loaders.genreLoader.loadMany(parent.genres);
    },
    similarMovies: async (parent, args, context) => {
      try {
        const movies = await getSimilarMovies(parent.id, args.limit);
        return movies.map((movie) => ({
          id: movie.movie_id || movie.id,
          title: movie.title,
        }));
      } catch (error) {
        throw new Error("Failed to fetch similar movies");
      }
    },
  },
  User: {
    recommendations: async (parent, args, context) => {
      try {
        const recommendations = await recommendMovies(parent.id, args.limit);
        const movieIds = recommendations.map((rec) => rec.movie_id);
        const movies = await models.Movie.find({
          movielensId: { $in: movieIds },
        });
        const movieMap = new Map(
          movies.map((movie) => [movie.movielensId, movie]),
        );

        return recommendations
          .filter((rec) => movieMap.has(rec.movie_id))
          .map((rec) => ({
            id: rec.movie_id,
            score: null,
            movie: movieMap.get(rec.movie_id),
          }));
      } catch (error) {
        return [];
      }
    },
  },
  Rating: {
    user: async (parent, args, context) => {
      return await context.loaders.userLoader.load(parent.user);
    },
    movie: async (parent, args, context) => {
      return await context.loaders.movieLoader.load(parent.movie);
    },
  },
};

export default resolvers;
