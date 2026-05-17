import { gql } from "apollo-server";
import * as models from "../../models/index.js";
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
    ratings: async (parent, args, context) => {
      return await Rating.find();
    },
    watchHistories: async (parent, args, context) => {
      return await WatchHistory.find();
    },
    myWatchHistory: async (parent, args, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return await WatchHistory.find({ user: context.user.id });
    },
    comments: async (parent, args, context) => {
      return await Comment.find();
    },
    trendingMovies: async (parent, args, context) => {
      return await Movie.find().sort({ viewCount: -1 }).limit(args.limit);
    },
    featuredMovies: async (parent, args, context) => {
      return await Movie.find({ isFeatured: true }).limit(args.limit);
    },
    topRatedMovies: async (parent, args, context) => {
      return await Movie.find()
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
        const movies = await getSimilarMovies(parent.id, args.maxResults);
        return movies.map((movie) => ({
          id: movie.id,
          title: movie.title,
        }));
      } catch (error) {
        throw new Error("Failed to fetch similar movies");
      }
    },
  },
  User: {
    recommendations: async (parent, args, context) => {
      // Lấy danh sách đề xuất cho người dùng từ flaskapi
      return await context.models.Recommendation.find({
        user: parent.id,
      }).populate("movie");
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
