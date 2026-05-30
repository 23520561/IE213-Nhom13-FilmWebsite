import { getCache, setCache } from "../utils/cache.js";

const BASE_URL = process.env.RECOMMENDATION_URL || "http://localhost:8000";

export const getSimilarMovies = (movieId, maxResults) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cacheKey = `similar:${movieId}:${maxResults}`;
      const cached = getCache(cacheKey);
      if (cached) return resolve(cached);

      const response = await fetch(`${BASE_URL}/similar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movie_id: String(movieId),
          max_results: maxResults,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      setCache(cacheKey, data.recommendations, 5 * 60 * 1000);

      resolve(data.recommendations);
    } catch (error) {
      reject(error);
    }
  });
};

export const recommendMovies = (
  userId,
  maxResults,
  movieId = undefined,
  alpha = undefined,
  totalWatched = undefined
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cacheKey = `recommend:${userId}:${maxResults}:${movieId}:${alpha}:${totalWatched}`;
      const cached = getCache(cacheKey);
      if (cached) return resolve(cached);

      const body = {
        user_id: String(userId),
        max_results: maxResults,
      };

      if (movieId != null) body.movie_id = String(movieId);
      if (alpha != null) body.alpha = Number(alpha);
      if (totalWatched != null) body.total_watched = totalWatched;

      const response = await fetch(`${BASE_URL}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      setCache(cacheKey, data.recommendations, 10 * 60 * 1000);

      resolve(data.recommendations);
    } catch (error) {
      reject(error);
    }
  });
};

export default { getSimilarMovies, recommendMovies };