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

// Create a gRPC client
const client = new recommendationProto.RecommendationService(
  "localhost:50051",
  grpc.credentials.createInsecure(),
);

// Export the client for use in other parts of the application
export const getSimilarMovies = (movieId, maxResults) => {
  return new Promise((resolve, reject) => {
    const request = {
      movie_id: movieId,
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

export const recommendMovies = (userId, maxResults) => {
  return new Promise((resolve, reject) => {
    const request = {
      user_id: userId,
      seed_movie_ids: [], // populate with movie IDs that the user has interacted with
      max_results: maxResults,
    };
    client.Recommend(request, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.recommendations);
      }
    });
  });
};

export default { getSimilarMovies, recommendMovies };
