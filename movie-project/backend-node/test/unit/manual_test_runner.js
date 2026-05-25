import readline from "readline";
import {
  getSimilarMovies,
  recommendMovies,
  setClient,
} from "../../proto/grpcClient.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((res) => rl.question(prompt, (ans) => res(ans)));
}

function installMock() {
  const mockClient = {
    SimilarMovies: (req, cb) => {
      cb(null, {
        recommendations: [
          { movie_id: String(req.movie_id), title: "Mock Similar", score: 0.9 },
        ],
      });
    },
    Recommend: (req, maybeMetadata, cb) => {
      const actualCb = typeof maybeMetadata === "function" ? maybeMetadata : cb;
      actualCb(null, {
        recommendations: [
          {
            movie_id: req.movie_id ? String(req.movie_id) : "999",
            title: "Mock Recommend",
            score: 0.8,
          },
        ],
      });
    },
  };
  setClient(mockClient);
  console.log("Mock client installed.");
}

async function run() {
  console.log("Interactive manual test runner for grpcClient");
  console.log(
    "You can run against the real gRPC server or install a mock client.",
  );

  const useMockAns = (await question("Install mock client? (y/N): "))
    .trim()
    .toLowerCase();
  if (useMockAns === "y" || useMockAns === "yes") installMock();

  while (true) {
    console.log("\nChoose function to test:");
    console.log("1) getSimilarMovies(movieId, maxResults)");
    console.log("2) recommendMovies(userId, maxResults, movieId?, alpha?)");
    console.log("3) Exit");

    const choice = (await question("Select 1/2/3: ")).trim();
    if (choice === "3") break;

    try {
      if (choice === "1") {
        const mid = await question("movieId: ");
        const k = await question("maxResults (default 5): ");
        const res = await getSimilarMovies(Number(mid), k ? Number(k) : 5);
        console.log("Result:", JSON.stringify(res, null, 2));
      } else if (choice === "2") {
        const uid = await question("userId: ");
        const k = await question("maxResults (default 10): ");
        const mid = await question(
          "optional movieId to bias (press Enter to skip): ",
        );
        const alpha = await question("alpha (0-1, default 0.6): ");
        const total = await question(
          "optional totalWatched (press Enter to skip): ",
        );
        const res = await recommendMovies(
          uid,
          k ? Number(k) : 10,
          mid ? Number(mid) : undefined,
          alpha ? Number(alpha) : undefined,
          total ? Number(total) : undefined,
        );
        console.log("Result:", JSON.stringify(res, null, 2));
      } else {
        console.log("Invalid selection");
      }
    } catch (err) {
      console.error("Error during call:", err);
    }
  }

  rl.close();
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].endsWith("manual_test_runner.js")
) {
  run();
}
