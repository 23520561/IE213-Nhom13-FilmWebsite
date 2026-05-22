import { gql } from "graphql-tag";
import { verifyToken } from "../utils/auth.js";
import { createLoaders } from "../graphql/loader/index.js";

/**
 * Helper to execute GraphQL mutations/queries for testing
 * Uses Apollo Server's test client directly
 */
export async function executeGraphQL(
  server,
  query,
  variables = {},
  token = null,
) {
  const headers = {};
  let user = null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    const decoded = verifyToken(token);
    if (decoded) {
      user = {
        userId: decoded.userId,
        role: decoded.role,
      };
    }
  }
  const result = (
    await server.executeOperation(
      {
        query,
        variables,
      },
      {
        contextValue: {
          user,
          loaders: createLoaders(),
        },
      },
    )
  ).body.singleResult;

  return result;
}

/**
 * Register test helper
 */
export const registerMutation = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      user {
        id
        username
        email
        role
      }
      token
    }
  }
`;

/**
 * Login test helper
 */
export const loginMutation = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        username
        email
        role
      }
      token
    }
  }
`;

/**
 * Get current user query (via bearer token in context)
 */
export const currentUserQuery = gql`
  query CurrentUser {
    users {
      id
      username
      email
      role
    }
  }
`;

/**
 * Create genre mutation
 */
export const createGenreMutation = gql`
  mutation CreateGenre($input: CreateGenreInput!) {
    createGenre(input: $input) {
      id
      name
      slug
      description
    }
  }
`;

/**
 * Create movie mutation
 */
export const createMovieMutation = gql`
  mutation CreateMovie($input: CreateMovieInput!) {
    createMovie(input: $input) {
      id
      title
      description
      genres {
        id
        name
      }
    }
  }
`;

/**
 * Create rating mutation
 */
export const createRatingMutation = gql`
  mutation CreateRating($movieId: ID!, $rating: Int!) {
    createRating(movieId: $movieId, rating: $rating) {
      id
      rating
      user {
        id
        username
      }
      movie {
        id
        title
      }
    }
  }
`;

/**
 * Create comment mutation
 */
export const createCommentMutation = gql`
  mutation CreateComment($movieId: ID!, $content: String!) {
    createComment(movieId: $movieId, content: $content) {
      id
      content
      user {
        id
        username
      }
      movie {
        id
        title
      }
      createdAt
    }
  }
`;

/**
 * Update comment mutation
 */
export const updateCommentMutation = gql`
  mutation UpdateComment($commentId: ID!, $content: String!) {
    updateComment(commentId: $commentId, content: $content) {
      id
      content
      updatedAt
    }
  }
`;

/**
 * Delete comment mutation
 */
export const deleteCommentMutation = gql`
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId)
  }
`;

/**
 * Get all users query
 */
export const getUsersQuery = gql`
  query GetUsers {
    users {
      id
      username
      email
      role
    }
  }
`;

/**
 * Get all movies query
 */
export const getMoviesQuery = gql`
  query GetMovies {
    movies {
      id
      title
      description
      genres {
        id
        name
      }
    }
  }
`;
