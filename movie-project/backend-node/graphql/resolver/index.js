import models from "../../models/index.js";
import {
  getAllUsers,
  getMovies,
  getUserById,
  getMovieById,
  getRatingsByMovieId,
} from "../services/index.js";
import { getSimilarMovies, recommendMovies } from "../../proto/grpcClient.js";
import { hashPassword, comparePassword } from "../../utils/hashPassword.js";
import { signToken } from "../../utils/auth.js";
import {
  requireAuth,
  requireAdmin,
  requireOwnerOrAdmin,
} from "../../utils/authorization.js";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateNonEmpty,
  validateRating,
} from "../../utils/validators.js";
import { logAuth, logMutation, logError } from "../../utils/logger.js";

const resolvers = {
  Query: {
    users: async (parent, args, context) => {
      return await getAllUsers();
    },
    user: async (parent, args, context) => {
      return await getUserById(args.id);
    },
    movies: async (parent, args, context) => {
      return await getMovies(
        args.page,
        args.limit,
        args.category,
        args.year,
        args.searchQuery,
      );
    },
    movie: async (parent, args, context) => {
      return await getMovieById(args.id);
    },
    genres: async (parent, args, context) => {
      return await models.Genre.find().sort({ name: 1 });
    },
    ratings: async (parent, args, context) => {
      return await getRatingsByMovieId(args.movieId);
    },
    watchHistories: async (parent, args, context) => {
      return await models.WatchHistory.find();
    },
    myWatchHistory: async (parent, args, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return await models.WatchHistory.find({ user: context.user.userId });
    },
    comments: async (parent, args, context) => {
      return await models.Comment.find({ movie: args.movieId });
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
    topNewMovies: async (parent, args, context) => {
      return await models.Movie.find()
        .sort({ releaseYear: -1 })
        .limit(args.limit);
    },
    watchHistory: async (parent, args, context) => {
      return await models.WatchHistory.findById(args.id);
    },
  },

  Mutation: {
    // Auth mutations
    register: async (parent, args, context) => {
      const { username, email, password } = args;

      // Validate inputs
      if (!validateUsername(username)) {
        throw new Error("Invalid username (3-30 chars, alphanumeric + - _)");
      }
      if (!validateEmail(email)) {
        throw new Error("Invalid email format");
      }
      if (!validatePassword(password)) {
        throw new Error("Password must be at least 8 chars with 1 number");
      }

      // Check if user exists
      const existingUser = await models.User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        throw new Error("Email or username already in use");
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      const counter = await models.User.db
        .collection("counters")
        .findOneAndUpdate(
          { _id: "user_numerical_id" },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: "after" }, // Lấy bản ghi sau khi đã cộng thêm 1
        );

      const nextNumericalId = counter.value ? counter.value.seq : counter.seq;

      // Create user
      const user = await models.User.create({
        username,
        email,
        password: hashedPassword,
        role: "user",
        numerical_id: nextNumericalId,
      });

      const token = signToken(user._id, user.role);
      logAuth("register", user._id, "success");

      return {
        user,
        token,
      };
    },

    login: async (parent, args, context) => {
      const { email, password } = args;

      // Validate inputs
      if (!validateEmail(email)) {
        throw new Error("Invalid email format");
      }
      if (!password) {
        throw new Error("Password required");
      }

      // Find user
      const user = await models.User.findOne({ email }).select("+password");
      if (!user) {
        logAuth("login", email, "failed - user not found");
        throw new Error("Invalid email or password");
      }

      // Compare password
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        logAuth("login", user._id, "failed - wrong password");
        throw new Error("Invalid email or password");
      }

      const token = signToken(user._id, user.role);
      logAuth("login", user._id, "success");

      // Remove password from response
      user.password = undefined;

      return {
        user,
        token,
      };
    },

    logout: async (parent, args, context) => {
      // JWT is stateless, logout is client-side
      if (context.user) {
        logAuth("logout", context.user.userId, "success");
      }
      return true;
    },

    // Movie mutations
    createMovie: async (parent, args, context) => {
      requireAdmin(context);
      const { input } = args;

      // Validate input
      if (!validateNonEmpty(input.title)) {
        throw new Error("Title is required");
      }
      if (!validateNonEmpty(input.description)) {
        throw new Error("Description is required");
      }
      if (!input.genres || input.genres.length === 0) {
        throw new Error("At least one genre is required");
      }

      // Create movie
      const movie = await models.Movie.create({
        movielensId: Date.now().toString(),
        tmdbId: 0,
        title: input.title,
        description: input.description,
        releaseDate: input.releaseDate || null,
        releaseYear: input.releaseDate
          ? new Date(input.releaseDate).getFullYear()
          : new Date().getFullYear(),
        genres: input.genres,
        duration: input.duration || 0,
        videoUrl: input.videoUrl || null,
        poster: input.poster || null,
        backdrop: input.backdrop || null,
        trailer: input.trailer || null,
        isPremium: input.isPremium || false,
      });

      logMutation("createMovie", context.user.userId, movie._id);
      return movie;
    },

    updateMovie: async (parent, args, context) => {
      requireAdmin(context);
      const { id, input } = args;

      // Find and update movie
      const movie = await models.Movie.findByIdAndUpdate(id, input, {
        new: true,
        runValidators: true,
      });

      if (!movie) {
        throw new Error("Movie not found");
      }

      logMutation("updateMovie", context.user.userId, movie._id);
      return movie;
    },

    deleteMovie: async (parent, args, context) => {
      requireAdmin(context);
      const { id } = args;

      const movie = await models.Movie.findByIdAndDelete(id);
      if (!movie) {
        throw new Error("Movie not found");
      }

      logMutation("deleteMovie", context.user.userId, id);
      return true;
    },

    // User mutations
    updateUser: async (parent, args, context) => {
      requireAuth(context);
      const { id, input } = args;

      // Only admins can update other users, or users can update themselves
      requireOwnerOrAdmin(context, id);

      // Admin can change roles, but regular users cannot
      if (input.role && context.user.role !== "admin") {
        throw new Error("Only admins can change user roles");
      }

      const user = await models.User.findByIdAndUpdate(id, input, {
        new: true,
      });

      if (!user) {
        throw new Error("User not found");
      }

      logMutation("updateUser", context.user.userId, user._id);
      return user;
    },

    deleteUser: async (parent, args, context) => {
      requireAuth(context);
      const { id } = args;

      // Only admins can delete users, or users can delete themselves
      requireOwnerOrAdmin(context, id);

      const user = await models.User.findByIdAndDelete(id);
      if (!user) {
        throw new Error("User not found");
      }

      logMutation("deleteUser", context.user.userId, user._id);
      return true;
    },

    // Rating mutations
    createRating: async (parent, args, context) => {
      requireAuth(context);
      const { movieId, rating } = args;

      // Validate rating
      if (!validateRating(rating)) {
        throw new Error("Rating must be an integer between 1 and 10");
      }

      // Check movie exists
      const movie = await models.Movie.findById(movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Check if user already rated this movie
      const existing = await models.Rating.findOne({
        movie: movieId,
        user: context.user.userId,
      });
      if (existing) {
        throw new Error("You have already rated this movie");
      }

      // Create rating
      const newRating = await models.Rating.create({
        user: context.user.userId,
        movie: movieId,
        rating,
        isApproved: true,
      });
      logMutation("createRating", context.user.userId, newRating._id);

      return newRating;
    },

    updateRating: async (parent, args, context) => {
      requireAuth(context);
      const { ratingId, rating } = args;

      // Validate rating
      if (!validateRating(rating)) {
        throw new Error("Rating must be an integer between 1 and 10");
      }

      // Find rating
      const existingRating = await models.Rating.findById(ratingId);
      if (!existingRating) {
        throw new Error("Rating not found");
      }

      // Only owner or admin can update
      requireOwnerOrAdmin(context, existingRating.user);

      // Update rating
      existingRating.rating = rating;
      await existingRating.save();

      logMutation("updateRating", context.user.userId, ratingId);
      return await existingRating.populate("user movie");
    },

    deleteRating: async (parent, args, context) => {
      requireAuth(context);
      const { ratingId } = args;

      // Find rating
      const rating = await models.Rating.findById(ratingId);
      if (!rating) {
        throw new Error("Rating not found");
      }

      // Only owner or admin can delete
      requireOwnerOrAdmin(context, rating.user);

      await models.Rating.findByIdAndDelete(ratingId);

      logMutation("deleteRating", context.user.userId, ratingId);
      return true;
    },

    // Comment mutations
    createComment: async (parent, args, context) => {
      requireAuth(context);
      const { movieId, content } = args;

      // Validate input
      if (!validateNonEmpty(content)) {
        throw new Error("Comment content is required");
      }
      if (content.length > 1000) {
        throw new Error("Comment must be 1000 characters or less");
      }

      // Check movie exists
      const movie = await models.Movie.findById(movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Create comment
      const comment = await models.Comment.create({
        user: context.user.userId,
        movie: movieId,
        content,
      });

      logMutation("createComment", context.user.userId, comment._id);
      return comment;
    },

    updateComment: async (parent, args, context) => {
      requireAuth(context);
      const { commentId, content } = args;

      // Validate input
      if (!validateNonEmpty(content)) {
        throw new Error("Comment content is required");
      }
      if (content.length > 1000) {
        throw new Error("Comment must be 1000 characters or less");
      }

      // Find comment
      const comment = await models.Comment.findById(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }

      // Only owner or admin can update
      requireOwnerOrAdmin(context, comment.user);

      // Update comment
      comment.content = content;
      await comment.save();

      logMutation("updateComment", context.user.userId, commentId);
      return await comment.populate("user movie");
    },

    deleteComment: async (parent, args, context) => {
      requireAuth(context);
      const { commentId } = args;

      // Find comment
      const comment = await models.Comment.findById(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }

      // Only owner or admin can delete
      requireOwnerOrAdmin(context, comment.user);

      await models.Comment.findByIdAndDelete(commentId);

      logMutation("deleteComment", context.user.userId, commentId);
      return true;
    },
    likeComment: async (parent, args, context) => {
      requireAuth(context);
      const { commentId } = args;

      // Atomically increment likeCount
      const comment = await models.Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likeCount: 1 } },
        { new: true },
      );

      if (!comment) throw new Error("Comment not found");

      logMutation("likeComment", context.user.userId, comment._id);
      return comment;
    },

    // Genre mutations
    createGenre: async (parent, args, context) => {
      requireAdmin(context);
      const { input } = args;

      // Validate input
      if (!validateNonEmpty(input.name)) {
        throw new Error("Genre name is required");
      }
      if (!validateNonEmpty(input.slug)) {
        throw new Error("Genre slug is required");
      }

      // Check if genre exists
      const existing = await models.Genre.findOne({
        $or: [{ name: input.name }, { slug: input.slug }],
      });
      if (existing) {
        throw new Error("Genre with this name or slug already exists");
      }

      // Create genre
      const genre = await models.Genre.create({
        name: input.name,
        slug: input.slug,
        description: input.description || "",
      });

      logMutation("createGenre", context.user.userId, genre._id);
      return genre;
    },

    updateGenre: async (parent, args, context) => {
      requireAdmin(context);
      const { id, input } = args;

      const genre = await models.Genre.findByIdAndUpdate(id, input, {
        new: true,
      });

      if (!genre) {
        throw new Error("Genre not found");
      }

      logMutation("updateGenre", context.user.userId, genre._id);
      return genre;
    },

    deleteGenre: async (parent, args, context) => {
      requireAdmin(context);
      const { id } = args;

      const genre = await models.Genre.findByIdAndDelete(id);
      if (!genre) {
        throw new Error("Genre not found");
      }

      logMutation("deleteGenre", context.user.userId, id);
      return true;
    },
    // WatchHistory mutations
    createWatchHistory: async (parent, args, context) => {
      requireAuth(context);
      const { movieId, watchedTime, duration, isFinished } = args;
      // Upsert per-user per-movie record
      const doc = await models.WatchHistory.findOneAndUpdate(
        { user: context.user.userId, movie: movieId },
        {
          $set: {
            watchedTime: watchedTime || 0,
            duration: duration || 0,
            isFinished: !!isFinished,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return doc;
    },
    updateWatchHistory: async (parent, args, context) => {
      requireAuth(context);
      const { id, watchedTime, duration, isFinished } = args;
      const doc = await models.WatchHistory.findById(id);
      if (!doc) throw new Error("WatchHistory not found");
      // Only owner or admin can update
      requireOwnerOrAdmin(context, doc.user.toString());
      if (watchedTime !== undefined) doc.watchedTime = watchedTime;
      if (duration !== undefined) doc.duration = duration;
      if (isFinished !== undefined) doc.isFinished = isFinished;
      await doc.save();
      return doc;
    },
    deleteWatchHistory: async (parent, args, context) => {
      requireAuth(context);
      const { id } = args;
      const doc = await models.WatchHistory.findById(id);
      if (!doc) throw new Error("WatchHistory not found");
      requireOwnerOrAdmin(context, doc.user.toString());
      await models.WatchHistory.findByIdAndDelete(id);
      return true;
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
        // Load recent watch history and populate movie movielensId
        let watchedEntries = await models.WatchHistory.find({ user: parent.id })
          .select("movie")
          .sort({ updatedAt: -1 })
          .limit(10)
          .populate({ path: "movie", select: "movielensId" });

        // Extract populated movie documents (may be null if reference broken)
        const watchedMovieDocs = watchedEntries
          .map((we) => we.movie)
          .filter(Boolean);

        // If no watched movies, return a trending fallback shaped like recommendations
        if (watchedMovieDocs.length === 0) {
          console.log(
            "No watch history found for user, returning trending movies as fallback",
          );
          const trending = await models.Movie.find()
            .sort({ viewCount: -1 })
            .limit(args.limit || 8);
          return trending.map((m) => ({
            id: m.movielensId || String(m._id),
            score: null,
            movie: m,
          }));
        }

        // Choose a seed movielensId from the most-recent watched movie
        const seedMovielensId =
          watchedMovieDocs[0].movielensId || String(watchedMovieDocs[0]._id);

        const recommendations = await recommendMovies(
          parent.numerical_id,
          args.limit,
          seedMovielensId,
          0.6, // alpha mặc định
          watchedMovieDocs.length, // totalWatched
        );

        const movieIds = (recommendations || []).map((rec) => rec.movie_id);
        const movies = await models.Movie.find({
          movielensId: { $in: movieIds },
        });
        const movieMap = new Map(
          movies.map((movie) => [movie.movielensId, movie]),
        );

        return (recommendations || [])
          .filter((rec) => movieMap.has(rec.movie_id))
          .map((rec) => ({
            id: rec.movie_id,
            score: rec.score ?? null,
            movie: movieMap.get(rec.movie_id),
          }));
      } catch (error) {
        logError && logError("recommendations", error);
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
  Comment: {
    user: async (parent, args, context) => {
      return await context.loaders.userLoader.load(parent.user);
    },
    movie: async (parent, args, context) => {
      return await context.loaders.movieLoader.load(parent.movie);
    },
  },
  WatchHistory: {
    user: async (parent, args, context) => {
      return await context.loaders.userLoader.load(parent.user);
    },
    movie: async (parent, args, context) => {
      return await context.loaders.movieLoader.load(parent.movie);
    },
  },
};

export default resolvers;
