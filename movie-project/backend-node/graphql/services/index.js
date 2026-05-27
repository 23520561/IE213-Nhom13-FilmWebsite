import User from "../../models/user.js";
import Movie from "../../models/movie.js";
import Rating from "../../models/ratings.js";
import models from "../../models/index.js";
import { getCache, setCache } from "../../utils/cache.js";

const getAllUsers = async () => {
  // Implementation for getting all users
  return await User.find();
};

const getUserById = async (id) => {
  // Implementation for getting user by ID
  return await User.findById(id);
};

const getMovies = async (page = 1, limit = 50, category, year, searchQuery) => {
  try {
    let dbQuery = {};

    // 1. Lọc theo Thể loại (Category -> Genres ObjectID)
    if (category && category !== "Tất Cả") {
      // Tìm ID của thể loại trong bảng Genre dựa vào tên hoặc slug
      const genreDoc = await models.Genre.findOne({
        $or: [
          { name: category }, // Khớp tiếng Việt (VD: "Hành Động")
          { slug: category }, // Khớp tiếng Anh/Slug (VD: "Action", "Drama")
          { slug: category.toLowerCase() },
        ],
      });

      if (genreDoc) {
        // Lọc các phim có chứa ID của thể loại này trong mảng genres
        dbQuery.genres = genreDoc._id;
      } else {
        // Nếu thể loại này không tồn tại trong DB, trả về mảng rỗng ngay
        return [];
      }
    }

    // 2. Lọc theo Năm (ReleaseYear)
    if (year && year !== "Tất Cả") {
      dbQuery.releaseYear = Number(year);
    }

    // 3. Lọc theo Tên phim (SearchQuery)
    if (searchQuery) {
      dbQuery.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { originalTitle: { $regex: searchQuery, $options: "i" } },
      ];
    }

    console.log("MongoDB Query Parameters:", dbQuery); // In ra console của Node.js để dễ kiểm tra

    // Tính toán số lượng phim cần bỏ qua dựa vào số trang
    const skipAmount = (page - 1) * limit;

    // 4. Lấy dữ liệu từ DB
    const movies = await models.Movie.find(dbQuery)
      .sort({ createdAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    return movies;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phim:", error);
    throw new Error("Không thể lấy danh sách phim");
  }
};

const getMovieById = async (id) => {
  // Check cache first
  const cacheKey = `movie:${id}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  // Implementation for getting movie by ID
  const movie = await Movie.findById(id);
  
  // Cache for 30 minutes
  if (movie) {
    setCache(cacheKey, movie, 30 * 60 * 1000);
  }
  
  return movie;
};

const getRatingsByMovieId = async (movieId) => {
  // Check cache first
  const cacheKey = `ratings:${movieId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const ratings = await Rating.find({ movie: movieId }).sort({ createdAt: -1 });
  
  // Cache for 15 minutes
  setCache(cacheKey, ratings, 15 * 60 * 1000);
  
  return ratings;
};
export {
  getAllUsers,
  getUserById,
  getMovies,
  getMovieById,
  getRatingsByMovieId,
};
