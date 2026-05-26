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

      const existingMovie = await Movie.findOne({ movielensId: movieId });
      if (existingMovie) {
        skipped++; // Tăng biến đếm số lượng phim bị bỏ qua
        process.stdout.write(
          `Imported: ${count} movies (Skipped: ${skipped})\r`,
        );
        continue; // Nhảy sang vòng lặp tiếp theo, bỏ qua toàn bộ logic xử lý phía dưới
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
  console.log(
    "Đang đọc dữ liệu từ ratings.csv bằng Stream để tránh tràn bộ nhớ...",
  );

  const filePath = path.join(DATA_DIR, "ratings.csv");
  if (!fs.existsSync(filePath)) {
    console.warn(
      "Không tìm thấy ratings.csv, bỏ qua bước tạo dữ liệu tương tác.",
    );
    return;
  }

  // Tạo map để tra cứu nhanh Movie và User
  const movieMap = new Map(movies.map((m) => [m.movielensId, m]));
  const userMap = new Map(users.map((u) => [u.numerical_id?.toString(), u]));

  let count = 0;

  // Sử dụng ReadStream để đọc từng dòng thay vì load toàn bộ file vào RAM
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;

  for await (const line of rl) {
    // Bỏ qua dòng tiêu đề (header) của file CSV
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    if (!line.trim()) continue;

    // Phân tách dữ liệu: CSV thường có format: userId,movieId,rating,timestamp
    const parts = line.split(",");
    const userId = parts[0]?.trim();
    const movieId = parts[1]?.trim();
    const ratingValue = Number(parts[2]);

    const movie = movieMap.get(movieId);
    const user = userMap.get(userId);

    // Nếu tìm thấy cả User và Movie hợp lệ trong Database
    if (movie && user) {
      // 1. TẠO RATING (Chuẩn 100% data)
      const existingRating = await Rating.findOne({
        movie: movie._id,
        user: user._id,
      });
      if (!existingRating) {
        await Rating.create({
          movie: movie._id,
          user: user._id,
          rating: ratingValue * 2, // Đổi hệ số 5 sao thành 10
        });
      }

      // 2. TẠO WATCH HISTORY
      const existingWatch = await WatchHistory.findOne({
        user: user._id,
        movie: movie._id,
      });
      if (!existingWatch) {
        const duration = movie.duration || 120;
        let watchPercentage = 1.0; // Mặc định là xem 100%

        // Phân tích tâm lý dựa trên điểm số (ratingValue trong CSV từ 0.5 đến 5.0)
        if (ratingValue >= 4) {
          watchPercentage = 1.0; // Phim hay: Xem trọn vẹn
        } else if (ratingValue >= 2.5) {
          watchPercentage = randomInt(80, 100) / 100; // Bình thường: Xem 80-100%
        } else {
          watchPercentage = randomInt(20, 60) / 100; // Quá dở: Tắt sớm sau 20-60% thời lượng
        }

        const watchedTime = Math.floor(duration * watchPercentage);

        // Trạng thái hoàn thành: Nếu xem qua 90% thì coi như đã xem xong
        const isFinished = watchPercentage >= 0.9;

        await WatchHistory.create({
          user: user._id,
          movie: movie._id,
          duration: duration,
          watchedTime: watchedTime,
          isFinished: isFinished,
        });
      }

      count++;
      process.stdout.write(
        `Đã đồng bộ Rating & WatchHistory thực tế cho ${count} lượt... \r`,
      );
    }

    // Giới hạn 5000 lượt để test cho nhanh.
    if (count >= 5000) {
      rl.close(); // Đóng stream giải phóng RAM
      break;
    }
  }

  console.log(`\n✓ Hoàn tất đồng bộ ${count} tương tác thực tế từ Stream CSV.`);
}

async function seedTagsAsComments(users, movies) {
  console.log(
    "Đang đọc dữ liệu từ tags.csv bằng Stream để đồng bộ Bình luận...",
  );

  const filePath = path.join(DATA_DIR, "tags.csv");
  if (!fs.existsSync(filePath)) {
    console.warn("Không tìm thấy tags.csv, bỏ qua bước tạo bình luận.");
    return;
  }

  const movieMap = new Map(movies.map((m) => [m.movielensId, m]));
  const userMap = new Map(users.map((u) => [u.numerical_id?.toString(), u]));

  let count = 0;

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    if (!line.trim()) continue;

    // Phân tách chuỗi thủ công để lấy dữ liệu (đề phòng tag có chứa dấu phẩy)
    const firstComma = line.indexOf(",");
    const secondComma = line.indexOf(",", firstComma + 1);
    const lastComma = line.lastIndexOf(",");

    if (firstComma === -1 || secondComma === -1 || lastComma === -1) continue;

    const userId = line.substring(0, firstComma).trim();
    const movieId = line.substring(firstComma + 1, secondComma).trim();

    // Lấy nội dung tag nằm giữa dấu phẩy thứ 2 và dấu phẩy cuối cùng, đồng thời xóa dấu ngoặc kép nếu có
    let tagContent = line.substring(secondComma + 1, lastComma).trim();
    tagContent = tagContent.replace(/(^"|"$)/g, "");

    const movie = movieMap.get(movieId);
    const user = userMap.get(userId);

    // Nếu dữ liệu hợp lệ, biến Tag thành một dòng Bình luận (Comment)
    if (movie && tagContent) {
      // Chọn ngẫu nhiên 1 User trong Database làm tác giả của bình luận này
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const content = `"${tagContent}"`;

      const existingComment = await Comment.findOne({
        user: randomUser._id,
        movie: movie._id,
        content,
      });

      if (!existingComment) {
        await Comment.create({
          user: randomUser._id,
          movie: movie._id,
          content: content,
          parent: null,
          likeCount: randomInt(0, 20),
          replyCount: 0,
        });
      }

      count++;
      process.stdout.write(
        `Đã đồng bộ Bình luận (Tags) thực tế cho ${count} lượt... \r`,
      );
    }

    // Giới hạn 3000 bình luận để Seed chạy nhanh.
    if (count >= 3000) {
      rl.close();
      break;
    }
  }

  console.log(`\n✓ Hoàn tất đồng bộ ${count} bình luận từ tags.csv.`);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  try {
    await mongoose.connection.db.collection("counters").updateOne(
      { _id: "user_numerical_id" },
      { $setOnInsert: { seq: 0 } }, // Chỉ đặt bằng 0 nếu bản ghi này CHƯA TỪNG CÓ
      { upsert: true },
    );

    const jsonlPath = path.resolve("../../movies_checkpoints.jsonl");
    await importJsonl(jsonlPath);

    const movies = await ensureMovies(60);
    const users = await ensureUsers(50);
    await seedUserRelatedData(users, movies);
    await seedTagsAsComments(users, movies);

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
