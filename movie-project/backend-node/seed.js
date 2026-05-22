import fs from "fs";
import path from "path";
import readline from "readline";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import User from "./models/user.js";
import Movie from "./models/movie.js";
import Rating from "./models/ratings.js";
import WatchHistory from "./models/watchHistory.js";
import Comment from "./models/comments.js";
import Genre from "./models/genres.js";
import { hashPassword } from "./utils/hashPassword.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = path.resolve("../recommendation-py/data");

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

function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(
      `Warning: ${filename} not found, links lookup will be skipped.`,
    );
    return [];
  }

  const content = fs.readFileSync(filePath, "utf8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function extractYear(dateString) {
  if (!dateString) return 0;
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? 0 : year;
}

async function ensureGenre(name) {
  if (!name) return null;
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  let genre = await Genre.findOne({ slug });
  if (!genre) {
    genre = await Genre.create({ name, slug, description: "" });
  }
  return genre._id;
}

async function importJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const links = readCsv("links.csv");
  const linksMap = new Map(
    links.map((row) => [row.movieId?.toString().trim(), row]),
  );

  let count = 0;
  let skipped = 0;
  let errors = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const data = JSON.parse(line);
      const movieId = data.movieId?.toString().trim();

      if (!movieId || !data.title) {
        skipped++;
        continue;
      }

      const genreNames = Array.isArray(data.genres)
        ? data.genres.map((g) => g.trim()).filter(Boolean)
        : [];
      const genreIds = [];
      for (const genreName of genreNames) {
        const id = await ensureGenre(genreName);
        if (id) genreIds.push(id);
      }

      const releaseYear = extractYear(data.release_date);
      const link = linksMap.get(movieId);
      const viewCount = randomInt(100000, 500000);
      const ratingCount = randomInt(
        10000,
        Math.max(10000, Math.floor(viewCount / 10)),
      );
      const movieData = {
        movielensId: movieId,
        tmdbId:
          link?.tmdbId || link?.tmdb_id
            ? Number(link.tmdbId || link.tmdb_id)
            : data.tmdbId || data.tmdb_id || undefined,
        title: data.title,
        description: data.overview || data.title,
        genres: genreIds,
        releaseDate: data.release_date || null,
        releaseYear,
        duration: data.runtime || undefined,
        videoUrl: data.video_url || data.trailer_link || "",
        poster:
          data.poster_path ||
          "https://via.placeholder.com/300x450?text=No+Poster",
        backdrop: data.backdrop_path || "",
        trailer: data.trailer_link || "",
        isPremium: false,
        isFeatured: false,
        viewCount,
        rating: {
          average: Number(data.vote_average) || 0,
          count: ratingCount,
        },
      };

      await Movie.updateOne(
        { movielensId: movieId },
        { $set: movieData },
        { upsert: true },
      );
      count++;
      process.stdout.write(`Imported: ${count} movies (Skipped: ${skipped})\r`);
    } catch (error) {
      errors++;
      console.error(`Error parsing line: ${line.substring(0, 100)}...`);
      console.error(`Error: ${error.message}`);
    }
  }

  console.log(
    `\n✓ Import complete: ${count} movies imported, ${skipped} skipped, ${errors} errors`,
  );
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

async function getNextNumericalId() {
  const counter = await mongoose.connection.db
    .collection("counters")
    .findOneAndUpdate(
      { _id: "user_numerical_id" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" },
    );
  return counter.value ? counter.value.seq : counter.seq; // Xử lý tương thích phiên bản driver
}

async function ensureUsers(count = 50) {
  const users = [];

  // Create test admin user
  const adminEmail = "admin@test.com";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashedPassword = await hashPassword("admin123");
    const nextId = await getNextNumericalId();
    admin = await User.create({
      username: "admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      numerical_id: nextId,
    });
    console.log(
      `✓ Created test admin user: ${adminEmail} / password: admin123`,
    );
  }
  users.push(admin);

  // Create regular users
  for (let i = 1; i <= count; i += 1) {
    const username = `user${i}`;
    const email = `user${i}@example.com`;
    let user = await User.findOne({ username });
    if (!user) {
      const hashedPassword = await hashPassword(`password${i}`);
      const nextId = await getNextNumericalId();
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: "user",
        isActive: true,
        numerical_id: nextId,
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
        user: user._id,
        movie: movie._id,
      });
      if (!existing) {
        const duration = movie.duration || randomInt(90, 160) * 60;
        const watchedTime = randomInt(Math.floor(duration * 0.4), duration);
        await WatchHistory.create({
          user: user._id,
          movie: movie._id,
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
    const jsonlPath = path.resolve("../../movies_checkpoints.jsonl");
    await importJsonl(jsonlPath);

    const movies = await ensureMovies(60);
    const users = await ensureUsers(50);
    await seedUserRelatedData(users, movies);

    console.log(
      "\nSeed completed for movies, users, ratings, watch history, and comments.",
    );
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
