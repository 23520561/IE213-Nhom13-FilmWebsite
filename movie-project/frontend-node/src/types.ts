// Types synchronized with backend GraphQL schema (see backend/graphql/typeDefs/index.js)

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  isActive?: boolean;
}

export interface MovieRating {
  average?: number;
  count?: number;
}

export interface Movie {
  id: string;
  movielensId?: string;
  tmdbId?: number;
  title: string;
  description?: string; // backend 'description'
  originalTitle?: string;
  category?: string;
  releaseDate?: string;
  releaseYear?: number;
  year?: number; // legacy frontend alias
  duration?: number;
  director?: string;
  actors?: string[];
  imdb?: number;
  isPremium?: boolean;
  // allow flexible values from UI forms/data
  quality?: string;
  synopsis?: string;
  poster?: string;
  backdrop?: string;
  trailer?: string;
  videoUrl?: string;
  views?: number; // frontend uses 'views' but backend exposes 'viewCount'
  viewCount?: number;
  isTrending?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  rating?: MovieRating;
  ratingCount?: number;
  genres?: Genre[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  numerical_id?: number;
  username?: string;
  email?: string;
  avatar?: string;
  role?: string; // 'user' | 'admin'
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  name?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

export interface Rating {
  id: string;
  user: User;
  movie: Movie;
  rating: number;
  likes?: User[];
  isApproved?: boolean;
  isSpoiler?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  user?: User;
  movie?: Movie;
  // legacy frontend fields used in components
  author?: string;
  avatar?: string;
  content: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  // frontend expects a numeric likes count in several places
  likes?: number;
  isSpoiler?: boolean;
}

export interface Recommendation {
  id: string;
  movie: Movie;
  score?: number;
}

export interface SimilarMovie {
  id: string;
  title: string;
  poster?: string;
}

export interface WatchHistory {
  id: string;
  user: User;
  movie: Movie;
  watchedTime: number;
  duration: number;
  isFinished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  year: string;
}
