import { useEffect, useState } from "react";
import { FilterState, Movie } from "../types";
import { useNavigate } from "react-router-dom";
import {
  graphqlCreateWatchHistory,
  graphqlGetMovies,
} from "../services/graphql";
import { normalizeMovie } from "../utils/normalizeMovie";

const useFilter = function () {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    category: "Tất Cả",
    year: "Tất Cả",
  });
  const [currentPage, setCurrentPage] = useState(1);

  function updateMovies(movies: Movie[]) {
    setMovies(movies);
  }
  function updateFilters(query: FilterState) {
    setFilters(query);
    setCurrentPage(1);
  }
  function updatePage(n: number) {
    setCurrentPage(n);
  }
  const handleMovieClick = (movieId: string) => {
    navigate(`/phim/${movieId}`); // Thay đổi URL thành /phim/id-cua-phim
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlayClick = (m: Movie) => {
    // Record watch start (fire-and-forget). Prefer movie duration from known lists.
    try {
      const duration =
        (m && (m.duration || m.duration === 0) ? Number(m.duration) : 0) || 0;
      // fire-and-forget
      graphqlCreateWatchHistory(m.id, 0, duration, false)
        .then((res) => {
          if (res && res.id) {
            const mapRaw =
              localStorage.getItem("cinemax_watchhistory_map") || "{}";
            const idMap = JSON.parse(mapRaw || "{}");
            idMap[m.id] = res.id;
            localStorage.setItem(
              "cinemax_watchhistory_map",
              JSON.stringify(idMap),
            );
          }
        })
        .catch(() => {
          // Save pending local entry to be synced on login
          const raw =
            localStorage.getItem("cinemax_local_watchhistory") || "[]";
          const arr = JSON.parse(raw || "[]");
          arr.push({
            movieId: m.id,
            watchedTime: 0,
            duration,
            isFinished: false,
          });
          localStorage.setItem(
            "cinemax_local_watchhistory",
            JSON.stringify(arr),
          );
        });
    } catch (e) {
      throw e;
    }
    navigate(`/xem-phim/${m.id}`); // Thay đổi URL thành /xem-phim/id-cua-phim
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cached movie
  useEffect(() => {
    if (movies.length > 0) {
      localStorage.setItem("movies", JSON.stringify(movies));
    }
  }, [movies]);

  // Tự động quay về trang chủ CHỈ KHI người dùng tương tác thay đổi bộ lọc
  useEffect(() => {
    const hasActiveFilters =
      filters.searchQuery.trim().length > 0 ||
      filters.category !== "Tất Cả" ||
      filters.year !== "Tất Cả";
    // Nếu có bộ lọc và hiện tại không ở trang chủ thì mới đưa về
    if (hasActiveFilters && window.location.pathname !== "/") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [filters]);
  useEffect(() => {
    async function fetchData() {
      try {
        const queryParams: any = {
          limit: 50,
          page: currentPage,
        };

        if (currentPage > 1) setIsFetchingMore(true);
        if (filters.category !== "Tất Cả")
          queryParams.category = filters.category;
        if (filters.year !== "Tất Cả") queryParams.year = filters.year;
        if (filters.searchQuery.trim() !== "")
          queryParams.searchQuery = filters.searchQuery;

        const data = (await graphqlGetMovies(queryParams)) as any;
        const rawMovies = data?.movies || (Array.isArray(data) ? data : []);

        // Nếu dữ liệu trả về ít hơn 50 phim nghĩa là database đã hết phim để tải tiếp
        if (rawMovies.length < 50) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        const formattedMovies: Movie[] = rawMovies.map((movie: any) =>
          normalizeMovie(movie),
        );

        // Compute most recent release year across fetched movies and mark `isNew`
        const maxYear =
          formattedMovies.reduce(
            (acc, m) => Math.max(acc, Number(m.year || 0)),
            0,
          ) || undefined;
        const finalMovies: Movie[] = formattedMovies.map((m) => ({
          ...m,
          isNew: maxYear ? Number(m.year) === Number(maxYear) : false,
        }));

        // Quyết định làm sạch danh sách hay nối tiếp mảng phim
        if (currentPage === 1) {
          setMovies(finalMovies);
        } else {
          setMovies((prev) => {
            const existingIds = new Set(prev.map((m: any) => m.id));
            const uniqueNewMovies = finalMovies.filter(
              (m: any) => !existingIds.has(m.id),
            );
            return [...prev, ...uniqueNewMovies];
          });
        }
      } catch (err) {
        throw err;
      } finally {
        setIsFetchingMore(false);
      }
    }
    fetchData();
  }, [filters, currentPage]);

  return {
    movies,
    hasMore,
    isFetchingMore,
    filters,
    currentPage,
    updatePage,
    updateFilters,
    updateMovies,
    handleMovieClick,
    handlePlayClick,
  };
};
export default useFilter;
