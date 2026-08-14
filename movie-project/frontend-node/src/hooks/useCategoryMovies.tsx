import { useEffect,  useState } from "react";
import { normalizeMovie } from "../utils/normalizeMovie";
import {
  graphqlGetFeaturedMovies,
  graphqlGetTopRatedMovies,
  graphqlGetTopNewMovies,
  graphqlGetMovies,
  graphqlGetUserRecommendations,
} from "../services/graphql";
import { Movie, User } from "../types";

const useCategoryMovies = function (currentUser:User|null) {
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  // Section-specific lists (server-backed where possible)
  const [sectionNewMovies, setSectionNewMovies] = useState<Movie[]>([]);
  const [sectionActionMovies, setSectionActionMovies] = useState<Movie[]>([]);
  const [sectionTheaterHotMovies, setSectionTheaterHotMovies] = useState<
    Movie[]
  >([]);
  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredSrv, topRatedSrv, topNewSrv, actionSrv] =
          await Promise.all([
            graphqlGetFeaturedMovies(12),
            graphqlGetTopRatedMovies(12),
            graphqlGetTopNewMovies(12),
            // action uses GetMovies as server may not provide dedicated endpoint
            graphqlGetMovies({ limit: 12, page: 1, category: "Hành Động" }),
          ]);
        const normalizedFeatured = (featuredSrv || []).map((mm: any) =>
          normalizeMovie(mm),
        );
        const normalizedTopRated = (topRatedSrv || []).map((mm: any) =>
          normalizeMovie(mm),
        );
        const normalizedAction = (actionSrv || []).map((mm: any) =>
          normalizeMovie(mm),
        );

        const normalizedTopNew = (topNewSrv || []).map((mm: any) =>
          normalizeMovie(mm),
        );
        setSectionNewMovies(normalizedTopNew.slice(0, 12));
        const theaterSource = normalizedTopRated;
        setSectionTheaterHotMovies(theaterSource.slice(0, 12));
        setSectionActionMovies(normalizedAction.slice(0, 12));
      } catch (err) {}
    }
    fetchData();
  }, []);
	useEffect(()=>{
		async function fetchData(){
try {
          if (currentUser && (currentUser as any).id) {
            const recs = (await graphqlGetUserRecommendations(
              (currentUser as any).id,
              8,
            )) as any[];
            // convert recommendations into Movie[] (take rec.movie)
            const recMovies: Movie[] = recs
              .map((r) => r.movie)
              .filter(Boolean)
              .map((m: any) => normalizeMovie(m));
            setRecommendedMovies(recMovies);
            try {
              // debug: inspect recommended payload structure in browser console
              // eslint-disable-next-line no-console
              console.log(
                "[DEBUG] recommendedMovies (fetch):",
                recMovies.slice(0, 8),
              );
            } catch (e) {
              /* ignore */
            }
          } else {
            setRecommendedMovies([]);
          }
        } catch (err) {
          console.error("Failed to load recommendations", err);
          setRecommendedMovies([]);
        }

		}
		fetchData()

	}, [currentUser])
  return {recommendedMovies, sectionActionMovies, sectionTheaterHotMovies, sectionNewMovies};
};
export default useCategoryMovies;
