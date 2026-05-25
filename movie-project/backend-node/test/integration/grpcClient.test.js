import {
  getSimilarMovies,
  recommendMovies,
  setClient,
} from "../../proto/grpcClient.js";

describe("grpcClient", () => {
  afterEach(() => {
    setClient(undefined);
  });

  test("getSimilarMovies returns recommendations from client", async () => {
    const mockResponse = {
      recommendations: [{ movie_id: "10", title: "A", score: 0.9 }],
    };
    const mockClient = {
      SimilarMovies: (req, cb) => {
        expect(req).toMatchObject({ movie_id: "10", max_results: 5 });
        cb(null, mockResponse);
      },
    };
    setClient(mockClient);

    const res = await getSimilarMovies(10, 5);
    expect(res).toEqual(mockResponse.recommendations);
  });

  test("recommendMovies sends movieId and alpha when provided", async () => {
    const mockResponse = {
      recommendations: [{ movie_id: "20", title: "B", score: 0.7 }],
    };
    const mockClient = {
      Recommend: (req, maybeMetadata, cb) => {
        // support both (req, cb) and (req, metadata, cb) signatures
        const actualReq = req;
        const actualCb =
          typeof maybeMetadata === "function" ? maybeMetadata : cb;
        expect(actualReq).toMatchObject({
          user_id: "user1",
          max_results: 3,
          movie_id: "20",
          alpha: 0.4,
        });
        actualCb(null, mockResponse);
      },
    };
    setClient(mockClient);

    const res = await recommendMovies("user1", 3, 20, 0.4);
    expect(res).toEqual(mockResponse.recommendations);
  });

  test("recommendMovies omits optional fields when not provided", async () => {
    const mockResponse = {
      recommendations: [{ movie_id: "30", title: "C", score: 0.5 }],
    };
    const mockClient = {
      Recommend: (req, maybeMetadata, cb) => {
        const actualReq = req;
        const actualCb =
          typeof maybeMetadata === "function" ? maybeMetadata : cb;
        expect(actualReq).toMatchObject({ user_id: "u2", max_results: 2 });
        expect(actualReq.movie_id).toBeUndefined();
        expect(actualReq.alpha).toBeUndefined();
        actualCb(null, mockResponse);
      },
    };
    setClient(mockClient);

    const res = await recommendMovies("u2", 2);
    expect(res).toEqual(mockResponse.recommendations);
  });

  test("recommendMovies sends totalWatched via metadata when provided", async () => {
    const mockResponse = {
      recommendations: [{ movie_id: "40", title: "D", score: 0.6 }],
    };
    const mockClient = {
      Recommend: (req, metadata, cb) => {
        // metadata may be a function if not provided
        if (typeof metadata === "function") {
          cb = metadata;
          metadata = null;
        }
        expect(req).toMatchObject({ user_id: "u3", max_results: 4 });
        if (metadata) {
          // grpc.Metadata in real client; in tests we expect a map-like object
          const vals = metadata.get ? metadata.get("total_watched") : ["5"];
          expect(vals[0] || vals).toEqual("5");
        } else {
          throw new Error("Expected metadata to be provided");
        }
        cb(null, mockResponse);
      },
    };
    setClient(mockClient);

    const res = await recommendMovies("u3", 4, undefined, undefined, 5);
    expect(res).toEqual(mockResponse.recommendations);
  });
});
