import { gql } from "graphql-tag";

const typeDefs = gql`
  enum Role {
    user
    admin
  }

  type User {
    id: ID!
    numerical_id: Int!
    username: String!
    email: String!
    password: String
    avatar: String
    role: Role!
    isActive: Boolean
    recommendations(limit: Int = 10): [Recommendation!]
    createdAt: String!
    updatedAt: String!
  }

  type MovieRating {
    average: Float
    count: Int
  }

  type Genre {
    id: ID!
    name: String!
    slug: String!
    description: String
    thumbnail: String
    isActive: Boolean
  }

  type Movie {
    id: ID!
    movielensId: String!
    tmdbId: Int!
    title: String!
    description: String
    releaseDate: String
    releaseYear: Int
    genres: [Genre!]!
    isPremium: Boolean
    rating: MovieRating
    viewCount: Int
    isFeatured: Boolean
    duration: Int
    videoUrl: String
    poster: String
    backdrop: String
    trailer: String
    similarMovies(limit: Int = 10): [SimilarMovie!]
    createdAt: String!
    updatedAt: String!
  }

  type Rating {
    id: ID!
    user: User!
    movie: Movie!
    rating: Int!
    likes: [User!]
    isApproved: Boolean
    isSpoiler: Boolean
    createdAt: String!
    updatedAt: String!
  }

  type WatchHistory {
    id: ID!
    user: User!
    movie: Movie!
    watchedTime: Int!
    duration: Int!
    isFinished: Boolean
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    user: User!
    movie: Movie!
    content: String!
    createdAt: String!
    updatedAt: String!
    likes: [User!]
    isSpoiler: Boolean
  }

  type Recommendation {
    id: ID!
    movie: Movie!
    score: Float
  }

  type SimilarMovie {
    id: ID!
    title: String!
    poster: String
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  # Input types
  input CreateMovieInput {
    title: String!
    description: String!
    releaseDate: String
    genres: [ID!]!
    duration: Int
    videoUrl: String
    poster: String
    backdrop: String
    trailer: String
    isPremium: Boolean
  }

  input UpdateMovieInput {
    title: String
    description: String
    releaseDate: String
    genres: [ID!]
    duration: Int
    videoUrl: String
    poster: String
    backdrop: String
    trailer: String
    isPremium: Boolean
    isFeatured: Boolean
  }

  input UpdateUserInput {
    username: String
    avatar: String
    role: Role
  }

  input CreateGenreInput {
    name: String!
    slug: String!
    description: String
  }

  input UpdateGenreInput {
    name: String
    slug: String
    description: String
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    movies(
      page: Int
      limit: Int
      category: String
      year: String
      searchQuery: String
    ): [Movie]
    movie(id: ID!): Movie
    genres: [Genre!]!
    ratings(movieId: ID!): [Rating!]!
    watchHistories: [WatchHistory!]!
    myWatchHistory: [WatchHistory!]!
    comments(movieId: ID!): [Comment!]!
    trendingMovies(limit: Int = 10): [Movie!]!
    featuredMovies(limit: Int = 10): [Movie!]!
    topRatedMovies(limit: Int = 10): [Movie!]!
  }

  type Mutation {
    # Auth mutations
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!

    # Movie mutations (admin only)
    createMovie(input: CreateMovieInput!): Movie!
    updateMovie(id: ID!, input: UpdateMovieInput!): Movie!
    deleteMovie(id: ID!): Boolean!

    # User mutations
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    # Rating mutations (user only)
    createRating(movieId: ID!, rating: Int!): Rating!
    updateRating(ratingId: ID!, rating: Int!): Rating!
    deleteRating(ratingId: ID!): Boolean!

    # Comment mutations (user only)
    createComment(movieId: ID!, content: String!): Comment!
    updateComment(commentId: ID!, content: String!): Comment!
    deleteComment(commentId: ID!): Boolean!

    # Genre mutations (admin only)
    createGenre(input: CreateGenreInput!): Genre!
    updateGenre(id: ID!, input: UpdateGenreInput!): Genre!
    deleteGenre(id: ID!): Boolean!
  }
`;

export default typeDefs;
