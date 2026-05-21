import { getSimilarMovies } from "../../proto/grpcClient.js";

async function testGetSimilarMovies() {
  try {
    console.log("Testing getSimilarMovies function...");
    const movieId = 1; // Example movie ID
    const similarMovies = await getSimilarMovies(movieId, 5); // Get top 5 similar movies
    console.log(
      `Similar movies to movie ID ${movieId}:`,
      JSON.stringify(similarMovies, null, 2),
    );
  } catch (error) {
    console.error("Error fetching similar movies:", error);
  }
}

testGetSimilarMovies();
