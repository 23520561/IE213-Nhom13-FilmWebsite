import { Movie } from "../types";

// Normalize movie shape for use across multiple effects/components
export const normalizeMovie = (movie: any): Movie => ({
  ...movie,
  id: movie.id || movie._id,
  year:
    movie.releaseYear ||
    (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 1995),
  views: movie.views || movie.viewCount || 0,
  category:
    (Array.isArray(movie.genres) && movie.genres.length > 0
      ? movie.genres[0].name || movie.genres[0]
      : movie.category) || "Hành Động",
  director: movie.director || "Đang cập nhật",
  actors: Array.isArray(movie.actors) ? movie.actors : ["Đang cập nhật"],
  originalTitle: movie.originalTitle || movie.title || "",
  // Support both shapes: { average, count } or numeric average value
  rating:
    typeof movie.rating === "number"
      ? { average: Number(movie.rating), count: 100 }
      : movie.rating
        ? {
            average:
              movie.rating.average !== undefined
                ? Number(movie.rating.average)
                : 8.5,
            count: movie.rating.count || 100,
          }
        : { average: 8.5, count: 100 },
  imdb:
    typeof movie.rating === "number"
      ? Number(movie.rating)
      : movie.rating?.average !== undefined
        ? Number(movie.rating.average)
        : 8.5,
  poster:
    movie.poster ||
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=400",
  backdrop:
    movie.backdrop ||
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200",
  videoUrl: movie.videoUrl || movie.trailer || "",
  // Derive trending flag client-side; isNew will be computed per-list
  isNew: false,
  // Trending: simple heuristic based on view count
  isTrending: (() => {
    const views = movie.views || movie.viewCount || 0;
    return Number(views) > 150000;
  })(),
  duration: movie.duration || 120,
});
