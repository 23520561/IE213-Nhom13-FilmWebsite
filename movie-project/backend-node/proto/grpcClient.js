import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

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
  "localhost:50051",
  grpc.credentials.createInsecure(),
);

export const setClient = (newClient) => {
  client = newClient;
};

// Export the client for use in other parts of the application
export const getSimilarMovies = (movieId, maxResults) => {
  return new Promise((resolve, reject) => {
    const request = {
      movie_id: String(movieId),
      max_results: maxResults,
    };
    client.SimilarMovies(request, (error, response) => {
      if (error) {
        reject(error);
      } else {
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
          resolve(response.recommendations);
        }
      });
    } else {
      client.Recommend(request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.recommendations);
        }
      });
    }
  });
};

export default { getSimilarMovies, recommendMovies };
