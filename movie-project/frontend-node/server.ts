import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Seed user data & movies for backend state persistence
const backendUserProfile = {
  id: "current-user",
  name: "Nguyễn Chí Viễn",
  email: "admin@cinemax.com",
  avatarUrl:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150",
  resolutionPreference: "Full HD 1080p (Ưu tiên)",
  autoNextEpisode: true,
  smartSubtitles: true,
  role: "Admin",
};

const backendMovies = [
  {
    id: "m-1",
    title: "Kỷ Nguyên Bóng Đêm: Khởi Đầu",
    description:
      "Trong một tương lai giả định năm 2085, khi thế giới chìm sâu vào đại băng hà thứ hai, một nhóm chiến binh tinh nhuệ được trang bị công nghệ sinh học tối tân phải xâm nhập vào trung tâm năng lượng của lòng đất để đánh cắp hạt nhân lượng tử hạt giống ánh sáng cuối cùng.",
    poster:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&q=80&w=1200",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    rating: 8.9,
    releaseYear: 2026,
    duration: 142,
    genre: "Hành động",
    genres: [{ id: 'g-1', name: 'Hành động', slug: 'hanh-dong' }],
    isFeatured: true,
    quality: "4K",
  },
  {
    id: "m-2",
    title: "Du Hành Tinh Hệ: Hố Đen Tử Thần",
    description:
      "Một tàu khoa học mất tích 10 năm bỗng dưng phát ra tín hiệu từ rìa hố đen siêu khối lượng. Một phi hành đoàn cứu hộ được cử đi để kiểm tra, nhưng những gì họ tìm thấy không đơn thuần là đống đổ nát của sắt thép, mà là một khe nứt không-thời gian bẻ gãy thực tại.",
    poster:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    rating: 9.1,
    releaseYear: 2025,
    duration: 168,
    genre: "Viễn tưởng",
    genres: [{ id: 'g-2', name: 'Viễn tưởng', slug: 'vien-tuong' }],
    isFeatured: true,
    quality: "4K",
  },
  {
    id: "m-3",
    title: "Akira: Kiếm Sĩ Cuối Cùng",
    description:
      "Lấy bối cảnh thời kỳ Edo suy vong, Akira - một Ronin chịu nhiều vết thương lòng của quá khứ, thề gác kiếm để nuôi nấng một đứa trẻ mồ côi. Nhưng khi băng đảng bóng tối truy sát gia tộc cũ tìm đến làng quê hẻo lánh của anh, anh buộc phải cầm thanh katana cổ xưa một lần cuối.",
    poster:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=1200",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    rating: 8.4,
    releaseYear: 2024,
    duration: 135,
    genre: "Cổ trang",
    genres: [{ id: 'g-3', name: 'Cổ trang', slug: 'co-trang' }],
    isFeatured: false,
    quality: "Full HD",
  },
  {
    id: "m-4",
    title: "Học Viện Pháp Thuật: Vùng Đất Bay",
    description:
      "Câu chuyện phiêu lưu kỳ huyễn của cô bé Yuki lạc vào thành phố nổi lơ lửng giữa những đám mây cổ tích. Tại đây, cô học được phép thuật điều khiển mưa gió và hợp sức với những sinh vật huyền bí để ngăn chặn sự xâm lấn của các bóng đen công nghiệp khói bụi.",
    poster:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1200",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    rating: 8.8,
    releaseYear: 2026,
    duration: 112,
    genre: "Hoạt hình",
    genres: [{ id: 'g-4', name: 'Hoạt hình', slug: 'hoat-hinh' }],
    isFeatured: true,
    quality: "Full HD",
  },
  {
    id: "m-5",
    title: "Thành Phố Mưa Tình Yêu",
    description:
      "Một bộ phim lãng mạn đầy chiều sâu khai thác cuộc đời đầy những nút thắt của hai tâm hồn xa lạ tình cờ chạm mặt nhau dưới màn mưa và ánh đèn neon rực rỡ của thành thị Seoul nhộn nhịp.",
    poster:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400",
    backdrop:
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&q=80&w=1200",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    rating: 8.5,
    releaseYear: 2025,
    duration: 124,
    genre: "Tâm lý",
    genres: [{ id: 'g-5', name: 'Tâm lý', slug: 'tam-ly' }],
    isFeatured: false,
    quality: "Full HD",
  },
];

const backendWatchlist = new Set<string>(["m-1", "m-2"]);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // If you want the frontend dev server to proxy GraphQL requests
  // to the real backend-node GraphQL endpoint, set BACKEND_GRAPHQL_URL
  // in the environment (e.g. http://localhost:3000/graphql).
  const BACKEND_GRAPHQL_URL = process.env.BACKEND_GRAPHQL_URL || null;

  app.use(express.json());

  // 1. Proxy to real backend GraphQL when configured, otherwise fall back to
  // the lightweight in-memory GraphQL shim (useful for offline dev).
  app.post("/api/graphql", async (req, res) => {
    // If BACKEND_GRAPHQL_URL is provided, forward the request
    if (BACKEND_GRAPHQL_URL) {
      try {
        const forwardHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        // forward authorization header if present
        if (req.headers.authorization) {
          forwardHeaders.Authorization = String(req.headers.authorization);
        }

        const proxied = await fetch(BACKEND_GRAPHQL_URL, {
          method: "POST",
          headers: forwardHeaders,
          body: JSON.stringify(req.body),
        });

        const payload = await proxied.text();
        // attempt to parse JSON, but if backend returned non-json, forward as text
        try {
          const json = JSON.parse(payload);
          res.status(proxied.status).json(json);
        } catch (err) {
          res.status(proxied.status).type("text").send(payload);
        }

        return;
      } catch (err) {
        console.error("GraphQL proxy error:", err);
        return res.status(502).json({ errors: [{ message: "Failed to proxy to backend GraphQL" }] });
      }
    }

    // --- Fallback: lightweight in-memory responses for offline dev ---
    const { query, variables } = req.body;
    const queryStr = (query || "").trim();

    // GET_USER_PROFILE
    if (
      queryStr.includes("GetUserProfile") ||
      queryStr.includes("userProfile")
    ) {
      return res.json({
        data: {
          userProfile: backendUserProfile,
        },
      });
    }

    // UPDATE_USER_PROFILE
    if (
      queryStr.includes("UpdateUserProfile") ||
      queryStr.includes("updateUserProfile")
    ) {
      const input = variables?.input || {};
      if (typeof input.name === "string") backendUserProfile.name = input.name;
      if (typeof input.email === "string")
        backendUserProfile.email = input.email;
      if (typeof input.resolutionPreference === "string") {
        backendUserProfile.resolutionPreference = input.resolutionPreference;
      }
      if (typeof input.autoNextEpisode === "boolean") {
        backendUserProfile.autoNextEpisode = input.autoNextEpisode;
      }
      if (typeof input.smartSubtitles === "boolean") {
        backendUserProfile.smartSubtitles = input.smartSubtitles;
      }

      return res.json({
        data: {
          updateUserProfile: backendUserProfile,
        },
      });
    }

    // GET_MOVIES (supports pagination: page, limit, and filtering by genre/search)
    if (queryStr.includes("GetMovies") || queryStr.includes("movies")) {
      let filtered = [...backendMovies];
      const { page = 1, limit = 10, genre, search } = variables || {};

      if (genre) {
        filtered = filtered.filter((m) => m.genre.toLowerCase() === String(genre).toLowerCase());
      }
      if (search) {
        const needle = String(search).toLowerCase();
        filtered = filtered.filter(
          (m) => m.title.toLowerCase().includes(needle) || m.description.toLowerCase().includes(needle),
        );
      }

      const start = (Math.max(1, Number(page)) - 1) * Number(limit);
      const paged = filtered.slice(start, start + Number(limit));

      // Map to a GraphQL-like shape (genres array, rating object)
      const mapped = paged.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        releaseYear: m.releaseYear,
        duration: m.duration,
        isFeatured: m.isFeatured,
        videoUrl: m.videoUrl,
        poster: m.poster,
        backdrop: m.backdrop,
        rating: { average: m.rating, count: Math.round((m.rating || 0) * 10) },
        genres: [
          {
            id: `g-${m.genre.replace(/\s+/g, "-").toLowerCase()}`,
            name: m.genre,
            slug: m.genre.replace(/\s+/g, "-").toLowerCase(),
          },
        ],
      }));

      return res.json({ data: { movies: mapped } });
    }

    // GET_MOVIE_BY_ID
    if (queryStr.includes("GetMovieById") || (queryStr.includes("movie") && queryStr.includes("id:"))) {
      const id = variables?.id;
      const found = backendMovies.find((m) => m.id === id) || backendMovies[0];
      const mapped = {
        id: found.id,
        title: found.title,
        description: found.description,
        poster: found.poster,
        backdrop: found.backdrop,
        videoUrl: found.videoUrl,
        rating: { average: found.rating, count: Math.round((found.rating || 0) * 10) },
        releaseYear: found.releaseYear,
        duration: found.duration,
        isFeatured: found.isFeatured,
        genres: [
          {
            id: `g-${found.genre.replace(/\s+/g, "-").toLowerCase()}`,
            name: found.genre,
            slug: found.genre.replace(/\s+/g, "-").toLowerCase(),
          },
        ],
      };
      return res.json({ data: { movie: mapped } });
    }

    // GET_GENRES
    if (queryStr.includes("GetGenres") || queryStr.includes("genres")) {
      const unique = new Map();
      backendMovies.forEach((m) => {
        const key = m.genre;
        if (!unique.has(key)) {
          unique.set(key, {
            id: `g-${key.replace(/\s+/g, "-").toLowerCase()}`,
            name: key,
            slug: key.replace(/\s+/g, "-").toLowerCase(),
            description: `${key} movies`,
            thumbnail: m.poster,
            isActive: true,
          });
        }
      });

      return res.json({ data: { genres: Array.from(unique.values()) } });
    }

    // CREATE_COMMENT
    if (queryStr.includes("CreateComment") || queryStr.includes("createComment")) {
      const movieId = variables?.movieId || null;
      const content = variables?.content || "";
      const comment = {
        id: `c-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        user: { id: backendUserProfile.id, username: backendUserProfile.name, avatar: backendUserProfile.avatarUrl },
      };
      return res.json({ data: { createComment: comment } });
    }

    // CREATE_RATING
    if (queryStr.includes("CreateRating") || queryStr.includes("createRating")) {
      const movieId = variables?.movieId || null;
      const ratingVal = variables?.rating || 0;
      const rating = {
        id: `r-${Date.now()}`,
        rating: ratingVal,
        createdAt: new Date().toISOString(),
        user: { id: backendUserProfile.id, username: backendUserProfile.name },
        movie: { id: movieId, title: backendMovies.find((m) => m.id === movieId)?.title || "Unknown" },
      };
      return res.json({ data: { createRating: rating } });
    }

    // AUTH: REGISTER / LOGIN
    if (queryStr.includes("Register") || queryStr.includes("register")) {
      const username = variables?.username || "newuser";
      const email = variables?.email || "new@cinemax.com";
      const user = { id: `u-${Date.now()}`, username, email };
      return res.json({ data: { register: { token: "mock-token", user } } });
    }

    if (queryStr.includes("Login") || queryStr.includes("login")) {
      const email = variables?.email || backendUserProfile.email;
      const user = { id: backendUserProfile.id, username: backendUserProfile.name, email };
      return res.json({ data: { login: { token: "mock-token", user } } });
    }

    // TOGGLE_WATCHLIST
    if (
      queryStr.includes("ToggleWatchlist") ||
      queryStr.includes("toggleWatchlist")
    ) {
      const movieId = variables?.movieId;
      if (movieId) {
        if (backendWatchlist.has(movieId)) {
          backendWatchlist.delete(movieId);
        } else {
          backendWatchlist.add(movieId);
        }
      }
      return res.json({
        data: {
          toggleWatchlist: {
            success: true,
            watchlistIds: Array.from(backendWatchlist),
          },
        },
      });
    }

    // Catch-all response for undefined queries
    return res.json({
      data: {
        message: "Query processed successfully",
      },
    });
  });

  // 2. Integration of Vite Midleware for developer mode OR serving Static files in build mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Catch-all for React index.html injection fallback routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[CineMax Backend Engine Live] listening at http://localhost:${PORT}`,
    );
  });
}

startServer();
