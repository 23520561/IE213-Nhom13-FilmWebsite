import { gql } from "apollo-server";

const typeDefs = gql`
  enum Role {
    USER
    ADMIN
  }
  type User {
    id: ID!
    username: String!
    email: String!
    password: String!
    avatar: String
    role: Role!
    isActive: Boolean
    recommendations(limit: Int = 10): [Recommendation!]
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
  }
  type Rating {
    id: ID!
    user: User!
    movie: Movie!
    rating: Int!
    likes: [User!]
    isApproved: Boolean
    isSpoiler: Boolean
  }
  type WatchHistory {
    id: ID!
    user: User!
    movie: Movie!
    watchedTime: Int!
    duration: Int!
    isFinished: Boolean
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
    score: Float!
  }
  type SimilarMovie {
    id: ID!
    title: String!
    poster: String
  }
  type Query {
    users: [User!]!
    user(id: ID!): User
    movies(
      page: Int = 1
      limit: Int = 10
      genre: String
      search: String
    ): [Movie!]!
    movie(id: ID!): Movie
    genres: [Genre!]!
    ratings: [Rating!]!
    watchHistories: [WatchHistory!]!
    myWatchHistory: [WatchHistory!]!
    comments: [Comment!]!
    trendingMovies(limit: Int = 10): [Movie!]!
    featuredMovies(limit: Int = 10): [Movie!]!
    topRatedMovies(limit: Int = 10): [Movie!]!
  }
`;

export default typeDefs;
