import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { getCache, setCache } from "../utils/cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, "../proto/service.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const recommendationProto =
  grpc.loadPackageDefinition(packageDefinition).recommendation;

// Create a gRPC client (can be replaced in tests via `setClient`)
let client = new recommendationProto.RecommendationService(
  "movie-review-system-asd3cwhbd2b3g0fw.southeastasia-01.azurewebsites.net:50051",
  grpc.credentials.createInsecure(),
);

export const setClient = (newClient) => {
  client = newClient;
};

// Export the client for use in other parts of the application
export const getSimilarMovies = (movieId, maxResults) => {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cacheKey = `similar:${movieId}:${maxResults}`;
    const cached = getCache(cacheKey);
    if (cached) {
      resolve(cached);
      return;
    }
    
    const request = {
      movie_id: String(movieId),
      max_results: maxResults,
    };
    client.SimilarMovies(request, (error, response) => {
      if (error) {
        reject(error);
      } else {
        // Cache for 5 minutes
        setCache(cacheKey, response.recommendations, 5 * 60 * 1000);
        resolve(response.recommendations);
      }
    });
  });
};

export const recommendMovies = (
  userId,
  maxResults,
  movieId = undefined,
  alpha = undefined,
  totalWatched = undefined,
) => {
  return new Promise((resolve, reject) => {
    // Build cache key from all parameters
    const cacheKey = `recommend:${userId}:${maxResults}:${movieId}:${alpha}:${totalWatched}`;
    const cached = getCache(cacheKey);
    if (cached) {
      resolve(cached);
      return;
    }
    
    const request = {
      user_id: String(userId),
      max_results: maxResults,
    };

    if (movieId !== undefined && movieId !== null)
      request.movie_id = String(movieId);
    if (alpha !== undefined && alpha !== null) request.alpha = Number(alpha);

    // If totalWatched provided, send it in gRPC metadata so services that
    // haven't regenerated protos can still receive it.
    if (totalWatched !== undefined && totalWatched !== null) {
      const md = new grpc.Metadata();
      md.set("total_watched", String(totalWatched));
      client.Recommend(request, md, (error, response) => {
        if (error) {
          reject(error);
        } else {
          // Cache for 10 minutes
          setCache(cacheKey, response.recommendations, 10 * 60 * 1000);
          resolve(response.recommendations);
        }
      });
    } else {
      client.Recommend(request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          // Cache for 10 minutes
          setCache(cacheKey, response.recommendations, 10 * 60 * 1000);
          resolve(response.recommendations);
        }
      });
    }
  });
};

export default { getSimilarMovies, recommendMovies };
