import fs from "fs";
import path from "path";
import readline from "readline";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Movie from "./models/movie.js";
import Genre from "./models/genres.js";

dotenv.config();

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

function extractYear(dateString) {
  if (!dateString) return 0;
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? 0 : year;
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

      // Process genres
      const genreNames = Array.isArray(data.genres)
        ? data.genres.map((g) => g.trim()).filter(Boolean)
        : [];
      const genreIds = [];
      for (const genreName of genreNames) {
        const id = await ensureGenre(genreName);
        if (id) genreIds.push(id);
      }

      // Extract year from release_date
      const releaseYear = extractYear(data.release_date);

      // Prepare movie data
      const movieData = {
        movielensId: movieId,
        title: data.title,
        description: data.overview || data.title,
        genres: genreIds,
        releaseYear,
        poster:
          data.poster_path ||
          "https://via.placeholder.com/300x450?text=No+Poster",
        backdrop: "",
        trailer: data.trailer_link || "",
        isPremium: false,
        isFeatured: false,
        viewCount: 0,
        rating: {
          average: data.vote_average || 0,
          count: 0,
        },
      };

      // Upsert movie
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

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  const jsonlPath = path.resolve("../../movies_checkpoints.jsonl");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✓ Connected to MongoDB");

  try {
    await importJsonl(jsonlPath);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  }
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
