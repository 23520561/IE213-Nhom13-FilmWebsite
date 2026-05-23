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
    });

    if (!response.ok) {
      throw new Error(
        `GraphQL HTTP request failed with status ${response.status}`,
      );
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new GraphQLError(
        result.errors[0].message || "GraphQL Server returned errors",
        result.errors,
      );
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
  query GetMovies($page: Int, $limit: Int, $genre: String, $search: String) {
    movies(page: $page, limit: $limit, genre: $genre, search: $search) {
      id
      title
      description
      releaseYear
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
      user { id username email }
    }
  }
`;

export const LOGIN = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id username email }
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
  genre?: string;
  search?: string;
}): Promise<Movie[]> {
  interface Response {
    movies: Movie[];
  }
  const data = await executeGraphQL<Response>(GET_MOVIES, variables);
  return data.movies;
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

export async function graphqlGetMovieById(id: string): Promise<Movie> {
  interface Response {
    movie: Movie;
  }
  const data = await executeGraphQL<Response>(GET_MOVIE_BY_ID, { id });
  return data.movie;
}

export async function graphqlToggleWatchlist(
  userId: string,
  movieId: string,
): Promise<{ success: boolean; watchlistIds: string[] }> {
  interface Response {
    toggleWatchlist: {
      success: boolean;
      watchlistIds: string[];
    };
  }
  const data = await executeGraphQL<Response>(TOGGLE_WATCHLIST, {
    userId,
    movieId,
  });
  return data.toggleWatchlist;
}
