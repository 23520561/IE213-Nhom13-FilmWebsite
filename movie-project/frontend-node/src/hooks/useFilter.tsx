import { useEffect, useState } from "react";
import { FilterState, Movie } from "../types";
import { useNavigate } from "react-router-dom";
import { graphqlGetMovies } from "../services/graphql";
import { normalizeMovie } from "../utils/normalizeMovie";

const useFilter = function (filters:FilterState, currentPage) {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

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
    console.log("filter changed");
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
  };
};
export default useFilter;
