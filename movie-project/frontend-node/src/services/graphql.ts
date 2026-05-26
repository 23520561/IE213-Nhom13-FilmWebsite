/**
 * GraphQL Client Service Configuration
 * Provides type-safe native query and mutation structures for fetching Users, Movies, and watchlist data.
 */

import { Movie, Profile } from "../types";

// Detect GraphQL endpoint from Vite environment variables or fallback to a standard relative proxy/live route
export const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:3000/graphql";

/**
 * Custom Error wrapper for GraphQL error payloads
 */
export class GraphQLError extends Error {
  public errors: any[];
  constructor(message: string, errors: any[]) {
    super(message);
    this.name = "GraphQLError";
    this.errors = errors;
  }
}

/**
 * Core generic fetch function for executing statements securely against the GraphQL server
 */
export async function executeGraphQL<
  TData = any,
  TVariables = Record<string, any>,
>(
  query: string,
  variables?: TVariables,
  headers: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<TData> {
  const token = localStorage.getItem("cinemax_auth_token");

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        query,
        variables,
      }),
      signal,
    });

    // 1. CỐ GẮNG ĐỌC DỮ LIỆU JSON TRƯỚC (Dù là lỗi 400 thì GraphQL vẫn trả JSON báo lỗi chi tiết)
    let result: any;
    try {
      result = await response.json();
    } catch (e) {
      // Nếu không phải JSON (Lỗi server sập hẳn)
    }

    // 2. NẾU GRAPHQL CHỈ RA LỖI CHI TIẾT -> BẮT VÀ NÉM RA MÀN HÌNH
    if (result && result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    // 3. NẾU LỖI HTTP MÀ KHÔNG CÓ TRONG JSON
    if (!response.ok) {
      throw new Error(`Lỗi kết nối Server: ${response.status}`);
    }

    return result.data as TData;
  } catch (error) {
    console.error("GraphQL Execution Error:", error);
    throw error;
  }
}

/* ==========================================================
   GraphQL Node Query and Mutation Templates (GraphQL Schema)
   ========================================================== */

export const GET_USER_PROFILE = `
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      username
      email
      avatar
      role
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_PROFILE = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      username
      email
      avatar
      role
    }
  }
`;

export const GET_MOVIES = `
  query GetMovies($page: Int, $limit: Int, $category: String, $year: String, $searchQuery: String) {
    movies(page: $page, limit: $limit, category: $category, year: $year, searchQuery: $searchQuery) {
      id
      title
      description
      releaseYear
      releaseDate
      movielensId
      tmdbId
      viewCount
      isPremium
      duration
      isFeatured
      videoUrl
      poster
      backdrop
      rating {
        average
        count
      }
      genres {
        id
        name
        slug
      }
    }
  }
`;

export const GET_USER_RECOMMENDATIONS = `
    query GetUserRecommendations($id: ID!, $limit: Int) {
      user(id: $id) {
        id
        recommendations(limit: $limit) {
          id
          score
          movie {
            id
            title
            description
            poster
            releaseYear
            releaseDate
            movielensId
            tmdbId
            backdrop
            duration
            viewCount
            rating { average count }
            genres { id name slug }
            videoUrl
          }
        }
      }
    }
  `;

export const GET_MOVIE_BY_ID = `
  query GetMovieById($id: ID!) {
    movie(id: $id) {
      id
      title
      description
      poster
      backdrop
      videoUrl
      rating {
        average
        count
      }
      releaseYear
      releaseDate
      movielensId
      tmdbId
      viewCount
      isPremium
      duration
      isFeatured
      genres {
        id
        name
        slug
      }
    }
  }
`;

export const GET_GENRES = `
  query GetGenres {
    genres {
      id
      name
      slug
      description
      thumbnail
      isActive
    }
  }
`;

export const GET_TRENDING_MOVIES = `
  query GetTrendingMovies($limit: Int) {
    trendingMovies(limit: $limit) {
      id
      title
      description
      poster
      backdrop
      duration
      releaseYear
      releaseDate
      viewCount
      rating { average count }
      genres { id name slug }
      videoUrl
      # server does not expose isTrending/isNew; client will derive these
    }
  }
`;

export const GET_FEATURED_MOVIES = `
  query GetFeaturedMovies($limit: Int) {
    featuredMovies(limit: $limit) {
      id
      title
      description
      poster
      backdrop
      duration
      releaseYear
      releaseDate
      viewCount
      rating { average count }
      genres { id name slug }
      videoUrl
      isFeatured
      # server does not expose isNew; client will derive if needed
    }
  }
`;

export const GET_TOP_RATED_MOVIES = `
  query GetTopRatedMovies($limit: Int) {
    topRatedMovies(limit: $limit) {
      id
      title
      description
      poster
      backdrop
      duration
      releaseYear
      releaseDate
      viewCount
      rating { average count }
      genres { id name slug }
      videoUrl
      # server does not expose isTrending/isNew; client will derive these
    }
  }
`;

export const GET_TOP_NEW_MOVIES = `
  query GetTopNewMovies($limit: Int) {
    topNewMovies(limit: $limit) {
      id
      title
      description
      poster
      backdrop
      duration
      releaseYear
      releaseDate
      viewCount
      rating { average count }
      genres { id name slug }
      videoUrl
    }
  }
`;
export const GET_MOVIE_COMMENTS = `
  query GetMovieComments($movieId: ID!) {
    comments(movieId: $movieId) {
      id
      content
      createdAt
      likeCount
      user {
        id
        username
        avatar
      }
    }
  }
`;
export const LIKE_COMMENT = `
  mutation LikeComment($commentId: ID!) {
    likeComment(commentId: $commentId) {
      id
      likeCount
    }
  }
`;
export const CREATE_COMMENT = `
  mutation CreateComment($movieId: ID!, $content: String!) {
    createComment(movieId: $movieId, content: $content) {
      id
      content
      createdAt
      user {
        id
        username
        avatar
      }
    }
  }
`;

export const CREATE_RATING = `
  mutation CreateRating($movieId: ID!, $rating: Int!) {
    createRating(movieId: $movieId, rating: $rating) {
      id
      rating
      createdAt
      user { id username }
      movie { id title }
    }
  }
`;

export const REGISTER = `
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user { id 
        username 
        email 
        role 
        avatar }
    }
  }
`;

export const LOGIN = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id 
        username 
        email 
        role 
        avatar }
    }
  }
`;

export const TOGGLE_WATCHLIST = `
  mutation ToggleWatchlist($userId: ID!, $movieId: ID!) {
    toggleWatchlist(userId: $userId, movieId: $movieId) {
      success
      watchlistIds
    }
  }
`;

export const GET_ALL_USERS = `
  query GetAllUsers {
    users {
      id
      username
      email
      role
    }
  }
`;
export const CREATE_WATCH_HISTORY = `
  mutation CreateWatchHistory($movieId: ID!, $watchedTime: Int!, $duration: Int!, $isFinished: Boolean) {
    createWatchHistory(movieId: $movieId, watchedTime: $watchedTime, duration: $duration, isFinished: $isFinished) {
      id
      user { id }
      movie { id title }
      watchedTime
      duration
      isFinished
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_WATCH_HISTORY = `
  mutation UpdateWatchHistory($id: ID!, $watchedTime: Int, $duration: Int, $isFinished: Boolean) {
    updateWatchHistory(id: $id, watchedTime: $watchedTime, duration: $duration, isFinished: $isFinished) {
      id
      watchedTime
      duration
      isFinished
      updatedAt
    }
  }
`;

/* ==========================================================
   High-level Type-Safe API Helper Interface Methods
   ========================================================== */

export async function graphqlGetUserProfile(id: string): Promise<Profile> {
  interface Response {
    user: Profile;
  }
  const data = await executeGraphQL<Response>(GET_USER_PROFILE, { id });
  // map backend `user` to frontend `Profile` as best-effort
  const u = data.user;
  return {
    name: (u && u.name) || "",
    email: (u && u.email) || "",
    avatarUrl: (u && u.avatarUrl) || undefined,
    role: u?.role,
  } as Profile;
}

export async function graphqlGetUserRecommendations(id: string, limit = 8) {
  interface Response {
    user: { id: string; recommendations: any[] };
  }

  try {
    const data = await executeGraphQL<Response>(GET_USER_RECOMMENDATIONS, {
      id,
      limit,
    });
    return (data && data.user && data.user.recommendations) || [];
  } catch (err) {
    console.error("graphqlGetUserRecommendations failed:", err);
    return [];
  }
}

export async function graphqlGetTrendingMovies(limit = 8) {
  interface Response {
    trendingMovies: Movie[];
  }
  try {
    const data = await executeGraphQL<Response>(GET_TRENDING_MOVIES, { limit });
    return (data && data.trendingMovies) || [];
  } catch (err) {
    console.error("graphqlGetTrendingMovies failed:", err);
    return [];
  }
}

export async function graphqlGetFeaturedMovies(limit = 8) {
  interface Response {
    featuredMovies: Movie[];
  }
  try {
    const data = await executeGraphQL<Response>(GET_FEATURED_MOVIES, { limit });
    return (data && data.featuredMovies) || [];
  } catch (err) {
    console.error("graphqlGetFeaturedMovies failed:", err);
    return [];
  }
}

export async function graphqlGetTopRatedMovies(limit = 8) {
  interface Response {
    topRatedMovies: Movie[];
  }
  try {
    const data = await executeGraphQL<Response>(GET_TOP_RATED_MOVIES, {
      limit,
    });
    return (data && data.topRatedMovies) || [];
  } catch (err) {
    console.error("graphqlGetTopRatedMovies failed:", err);
    return [];
  }
}

export async function graphqlGetTopNewMovies(limit = 8) {
  interface Response {
    topNewMovies: Movie[];
  }
  try {
    const data = await executeGraphQL<Response>(GET_TOP_NEW_MOVIES, { limit });
    // debug
    // eslint-disable-next-line no-console
    console.debug("[graphql] GET_TOP_NEW_MOVIES response ->", data);
    return (data && data.topNewMovies) || [];
  } catch (err) {
    console.error("graphqlGetTopNewMovies failed:", err);
    return [];
  }
}

export async function graphqlUpdateUserProfile(
  id: string,
  input: Partial<Profile>,
): Promise<Profile> {
  interface Response {
    updateUser: Profile;
  }
  const data = await executeGraphQL<Response>(UPDATE_USER_PROFILE, {
    id,
    input,
  });
  return data.updateUser;
}

export async function graphqlGetMovies(variables: {
  page?: number;
  limit?: number;
  category?: string;
  year?: string;
  searchQuery?: string;
}): Promise<Movie[]> {
  interface Response {
    movies: Movie[] | null;
  }

  try {
    const data = await executeGraphQL<Response>(GET_MOVIES, variables);
    return data && data.movies ? data.movies : [];
  } catch (err) {
    console.error("graphqlGetMovies failed:", err);
    return [];
  }
}

export async function graphqlGetGenres() {
  interface Response {
    genres: any[];
  }
  const data = await executeGraphQL<Response>(GET_GENRES);
  return data.genres;
}

export async function graphqlCreateComment(movieId: string, content: string) {
  interface Response {
    createComment: any;
  }
  const data = await executeGraphQL<Response>(CREATE_COMMENT, {
    movieId,
    content,
  });
  return data.createComment;
}

export async function graphqlLikeComment(commentId: string) {
  interface Response {
    likeComment: any;
  }
  const data = await executeGraphQL<Response>(LIKE_COMMENT, { commentId });
  return data.likeComment;
}

export async function graphqlCreateRating(movieId: string, rating: number) {
  interface Response {
    createRating: any;
  }
  const data = await executeGraphQL<Response>(CREATE_RATING, {
    movieId,
    rating,
  });
  return data.createRating;
}

export async function graphqlRegister(
  username: string,
  email: string,
  password: string,
) {
  interface Response {
    register: { token: string; user: any };
  }
  const data = await executeGraphQL<Response>(REGISTER, {
    username,
    email,
    password,
  });
  return data.register;
}

export async function graphqlLogin(email: string, password: string) {
  interface Response {
    login: { token: string; user: any };
  }
  const data = await executeGraphQL<Response>(LOGIN, { email, password });
  return data.login;
}

export async function graphqlGetMovieById(id: string): Promise<Movie | null> {
  interface Response {
    movie: Movie | null;
  }

  try {
    const data = await executeGraphQL<Response>(GET_MOVIE_BY_ID, { id });
    return data && data.movie ? data.movie : (null as any);
  } catch (err) {
    console.error("graphqlGetMovieById failed:", err);
    return null as any;
  }
}

export async function graphqlToggleWatchlist(
  userId: string,
  movieId: string,
): Promise<{ success: boolean; watchlistIds: string[] }> {
  interface Response {
    toggleWatchlist?: {
      success: boolean;
      watchlistIds: string[];
    };
  }

  try {
    const data = await executeGraphQL<Response>(TOGGLE_WATCHLIST, {
      userId,
      movieId,
    });

    if (data && data.toggleWatchlist) return data.toggleWatchlist;
    return { success: false, watchlistIds: [] };
  } catch (err) {
    // If backend does not support server-side watchlist, fall back gracefully
    console.warn("graphqlToggleWatchlist unavailable, falling back:", err);
    return { success: false, watchlistIds: [] };
  }
}

export async function graphqlCreateWatchHistory(
  movieId: string,
  watchedTime: number,
  duration: number,
  isFinished = false,
) {
  interface Response {
    createWatchHistory: any;
  }
  try {
    const data = await executeGraphQL<Response>(CREATE_WATCH_HISTORY, {
      movieId,
      watchedTime,
      duration,
      isFinished,
    });
    return data.createWatchHistory;
  } catch (err) {
    console.error("graphqlCreateWatchHistory failed:", err);
    return null;
  }
}

export async function graphqlUpdateWatchHistory(
  id: string,
  watchedTime?: number,
  duration?: number,
  isFinished?: boolean,
) {
  interface Response {
    updateWatchHistory: any;
  }
  try {
    const data = await executeGraphQL<Response>(UPDATE_WATCH_HISTORY, {
      id,
      watchedTime,
      duration,
      isFinished,
    });
    return data.updateWatchHistory;
  } catch (err) {
    console.error("graphqlUpdateWatchHistory failed:", err);
    return null;
  }
}
export async function graphqlGetMovieComments(
  movieId: string,
  signal?: AbortSignal,
) {
  interface Response {
    comments: any[];
  }
  try {
    const data = await executeGraphQL<Response>(
      GET_MOVIE_COMMENTS,
      {
        movieId,
      },
      undefined,
      signal,
    );
    return data && data.comments ? data.comments : [];
  } catch (err) {
    // If aborted, ignore noise
    if ((err as any)?.name === "AbortError") return [];
    console.error("graphqlGetMovieComments failed:", err);
    return [];
  }
}

export async function graphqlCreateMovie(input: any) {
  const query = `
    mutation CreateMovie($input: CreateMovieInput!) {
      createMovie(input: $input) {
        id
        title
      }
    }
  `;
  const data = await executeGraphQL(query, { input });
  return data.createMovie;
}

export async function graphqlUpdateMovie(id: string, input: any) {
  const query = `
    mutation UpdateMovie($id: ID!, $input: UpdateMovieInput!) {
      updateMovie(id: $id, input: $input) {
        id
        title
      }
    }
  `;
  const data = await executeGraphQL(query, { id, input });
  return data.updateMovie;
}

export async function graphqlDeleteMovie(id: string) {
  const query = `
    mutation DeleteMovie($id: ID!) {
      deleteMovie(id: $id)
    }
  `;
  const data = await executeGraphQL(query, { id });
  return data.deleteMovie;
}

export async function graphqlGetAllUsers() {
  try {
    const data = await executeGraphQL(GET_ALL_USERS);
    return data && data.users ? data.users : [];
  } catch (err) {
    console.error("graphqlGetAllUsers failed:", err);
    return [];
  }
}
