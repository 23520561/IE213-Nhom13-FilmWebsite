import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import Movie from "./models/movie.js";
import Genre from "./models/genres.js";
import User from "./models/user.js";
import Rating from "./models/ratings.js";

dotenv.config();

const DATA_DIR = path.resolve("./data");

function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: ${filename} not found, skipping.`);
    return [];
  }

  const content = fs.readFileSync(filePath, "utf8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function extractYear(title) {
  const match = title.match(/\((\d{4})\)$/);
  return match ? Number(match[1]) : null;
}

function parseGenres(genresString) {
  if (!genresString) return [];
  return genresString
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
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

async function ensureUser(userId) {
  if (!userId) return null;
  const username = `user${userId}`;
  const email = `user${userId}@example.com`;
  let user = await User.findOne({ username });
  if (!user) {
    user = await User.create({
      username,
      email,
      password: `password${userId}`,
      role: "user",
      isActive: true,
    });
  }
  return user._id;
}

async function importMovies() {
  const movies = readCsv("movies.csv");
  const links = readCsv("links.csv");
  const linksMap = new Map(links.map((row) => [row.movieId, row]));

  if (movies.length === 0) {
    console.log("No movies.csv data found.");
    return;
  }

  console.log(`Importing ${movies.length} movies...`);

  for (const row of movies) {
    const movieId = row.movieId?.trim();
    if (!movieId) continue;

    const link = linksMap.get(movieId);
    const genreNames = parseGenres(row.genres);
    const genreIds = [];
    for (const genreName of genreNames) {
      const id = await ensureGenre(genreName);
      if (id) genreIds.push(id);
    }

    const releaseYear = extractYear(row.title) || 0;
    const title = row.title || `Movie ${movieId}`;

    const movieData = {
      movielensId: movieId,
      tmdbId: link?.tmdbId ? Number(link.tmdbId) : undefined,
      title,
      description: title,
      genres: genreIds,
      releaseYear,
      isPremium: false,
      poster: "https://via.placeholder.com/300x450?text=No+Poster",
      backdrop: "",
      trailer: "",
      isFeatured: false,
      viewCount: 0,
      rating: {
        average: 0,
        count: 0,
      },
    };

    await Movie.updateOne(
      { movielensId: movieId },
      { $set: movieData },
      { upsert: true },
    );
    process.stdout.write(`Imported movie ${movieId}\r`);
  }

  console.log(`\nMovie import complete.`);
}

async function importRatings() {
  const ratings = readCsv("ratings.csv");
  if (ratings.length === 0) {
    console.log("No ratings.csv data found.");
    return;
  }

  console.log(`Importing ${ratings.length} ratings...`);

  for (const row of ratings) {
    const movieId = row.movieId?.trim();
    const userId = row.userId?.trim();
    const score = Number(row.rating);
    if (!movieId || !userId || Number.isNaN(score)) continue;

    const movie = await Movie.findOne({ movielensId: movieId });
    if (!movie) {
      console.warn(`Movie not found for movieId=${movieId}, skipping rating.`);
      continue;
    }

    const userObjectId = await ensureUser(userId);
    if (!userObjectId) continue;

    const existingRating = await Rating.findOne({
      movie: movie._id,
      user: userObjectId,
    });
    if (existingRating) {
      continue;
    }

    await Rating.create({
      movie: movie._id,
      user: userObjectId,
      rating: score,
    });
    process.stdout.write(
      `Imported rating movieId=${movieId} userId=${userId}\r`,
    );
  }

  console.log(`\nRating import complete.`);
}

async function importTags() {
  const tags = readCsv("tags.csv");
  if (tags.length === 0) {
    console.log("No tags.csv data found.");
    return;
  }

  if (!Movie.schema.path("tags")) {
    console.warn("Movie schema does not define 'tags'. Skipping tags import.");
    return;
  }

  console.log(`Importing ${tags.length} tags...`);

  for (const row of tags) {
    const movieId = row.movieId?.trim();
    const tag = row.tag?.trim();
    if (!movieId || !tag) continue;

    await Movie.updateOne(
      { movielensId: movieId },
      { $addToSet: { tags: tag } },
    );
    process.stdout.write(`Imported tag for movieId=${movieId}\r`);
  }

  console.log(`\nTag import complete.`);
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error(
      "MONGODB_URI is not set. Create a .env file with MONGODB_URI.",
    );
    process.exit(1);
  }

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  try {
    await importMovies();
    await importRatings();
    await importTags();
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
