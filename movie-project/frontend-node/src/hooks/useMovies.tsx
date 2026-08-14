import { useEffect, useState } from "react";
import { Movie } from "../types";
import {
  graphqlGetMovies,
} from "../services/graphql";
import { normalizeMovie } from "../utils/normalizeMovie";

const useMovies = function () {
  const [movies, setMovies] = useState<Movie[]>([]);
  const PAGE_NUMBER = 1;
  const LIMIT = 50;
  useEffect(() => {
    async function fetchMovie() {
      try {
        // fetch movies
        const data = (await graphqlGetMovies({
          page: PAGE_NUMBER,
          limit: LIMIT,
        })) as any;
        const rawMovies = data?.movies || (Array.isArray(data) ? data : []);
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
        setMovies(finalMovies);
      } catch (error) {
        console.error("Không thể kết nối với Backend hoặc lỗi GraphQL:", error);
      }
    }
    fetchMovie();
  }, []);
  return {movies}
};
export default useMovies;
