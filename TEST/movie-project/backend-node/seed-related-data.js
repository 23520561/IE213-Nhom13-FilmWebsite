import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/user.js";
import Movie from "./models/movie.js";
import Rating from "./models/ratings.js";
import WatchHistory from "./models/watchHistory.js";
import Comment from "./models/comments.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Create a .env file with MONGODB_URI.");
  process.exit(1);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(items, count) {
  const result = [];
  const pool = [...items];
  while (result.length < count && pool.length > 0) {
    const index = randomInt(0, pool.length - 1);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
}

async function ensureMovies(minCount = 60) {
  const existingMovies = await Movie.find().limit(minCount).lean();
  if (existingMovies.length === 0) {
    throw new Error(
      "No movies found in Movie collection. Please import movies first.",
    );
  }
  if (existingMovies.length < minCount) {
    console.warn(
      `Warning: only ${existingMovies.length} movies found; seed will use available movies.`,
    );
  }
  return existingMovies;
}

async function ensureUsers(count = 50) {
  const users = [];
  for (let i = 1; i <= count; i += 1) {
    const username = `user${i}`;
    const email = `user${i}@example.com`;
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({
        username,
        email,
        password: `password${i}`,
        role: "user",
        isActive: true,
      });
    }
    users.push(user);
  }
  return users;
}

async function seedUserRelatedData(users, movies) {
  for (const user of users) {
    const movieSelection = pickRandom(movies, 8);
    const ratingMovies = movieSelection.slice(0, 5);
    const watchMovies = movieSelection.slice(2, 7);
    const commentMovies = movieSelection.slice(4, 7);

    for (const movie of ratingMovies) {
      const existing = await Rating.findOne({
        movie: movie._id,
        user: user._id,
      });
      if (!existing) {
        const ratingValue = randomInt(5, 10);
        await Rating.create({
          movie: movie._id,
          user: user._id,
          rating: ratingValue,
        });
        process.stdout.write(
          `User ${user.username} rated ${movie.title} = ${ratingValue}       \r`,
        );
      }
    }

    for (const movie of watchMovies) {
      const existing = await WatchHistory.findOne({
        userId: user._id,
        movieId: movie._id,
      });
      if (!existing) {
        const duration = movie.duration || randomInt(90, 160) * 60;
        const watchedTime = randomInt(Math.floor(duration * 0.4), duration);
        await WatchHistory.create({
          userId: user._id,
          movieId: movie._id,
          duration,
          watchedTime,
          isFinished: watchedTime >= Math.floor(duration * 0.95),
        });
        process.stdout.write(
          `User ${user.username} watch history for ${movie.title}         \r`,
        );
      }
    }

    for (const movie of commentMovies) {
      const content = `Review by ${user.username} for ${movie.title}: This movie is great!`;
      const existing = await Comment.findOne({
        user: user._id,
        movie: movie._id,
        content,
      });
      if (!existing) {
        await Comment.create({
          user: user._id,
          movie: movie._id,
          content,
          parent: null,
          likeCount: randomInt(0, 20),
          replyCount: 0,
        });
        process.stdout.write(
          `User ${user.username} commented on ${movie.title}                  \r`,
        );
      }
    }
  }
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  try {
    const movies = await ensureMovies(60);
    const users = await ensureUsers(50);
    await seedUserRelatedData(users, movies);
    console.log("\nSeed completed for 50 users and related collections.");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
