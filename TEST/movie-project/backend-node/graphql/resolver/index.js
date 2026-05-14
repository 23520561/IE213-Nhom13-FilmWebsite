import { gql } from "apollo-server-express";
import {
  getAllUsers,
  getMovies,
  getUserById,
  getMovieById,
} from "../../services";
const resolvers = {
  Query: {
    users: async (parent, args, { User }) => {
      return await getAllUsers();
    },
    user: async (parent, args, { User }) => {
      return await getUserById(args.id);
    },
    movies: async (parent, args, { Movie }) => {
      return await getMovies(args.page, args.limit);
    },
    movie: async (parent, args, { Movie }) => {
      return await getMovieById(args.id);
    },
    ratings: async (parent, args, { Rating }) => {
      return await Rating.find();
    },
    watchHistories: async (parent, args, { WatchHistory }) => {
      return await WatchHistory.find();
    },
    myWatchHistory: async (parent, args, { WatchHistory, user }) => {
      if (!user) throw new Error("Unauthorized");
      return await WatchHistory.find({ user: user.id });
    },
    comments: async (parent, args, { Comment }) => {
      return await Comment.find();
    },
    trendingMovies: async (parent, args, { Movie }) => {
      return await Movie.find().sort({ viewCount: -1 }).limit(args.limit);
    },
    featuredMovies: async (parent, args, { Movie }) => {
      return await Movie.find({ isFeatured: true }).limit(args.limit);
    },
    topRatedMovies: async (parent, args, { Movie }) => {
      return await Movie.find()
        .sort({ "rating.average": -1 })
        .limit(args.limit);
    },
  },
  Movie: {
    genres: async (parent, args, { Genre }) => {
      return await genreLoader.loadMany(parent.genres);
    },
  },
  User: {
    recommendations: async (parent, args, { Recommendation }) => {
      // Lấy danh sách đề xuất cho người dùng từ flaskapi
      return await Recommendation.find({ user: parent.id }).populate("movie");
    },
  },
};
