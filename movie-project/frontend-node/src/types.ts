export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  category: string; // Hành Động, Viễn Tưởng, Tâm Lý, Cổ Trang, Hoạt Hình V.v.
  country: string; // Mỹ, Hàn Quốc, Nhật Bản, Trung Quốc, Việt Nam
  year: number;
  duration: number; // Phút
  director: string;
  actors: string[];
  imdb: number;
  quality: "HD" | "Full HD" | "4K";
  language: "Vietsub" | "Thuyết Minh" | "Lồng Tiếng";
  poster: string;
  backdrop: string;
  synopsis: string;
  videoUrl: string;
  views: number;
  isTrending: boolean;
  isNew: boolean;
  ratingCount?: number;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  country: string;
  year: string;
}

export interface Profile {
  name: string;
  email: string;
  avatarUrl?: string;
  resolutionPreference?: string;
  autoNextEpisode?: boolean;
  smartSubtitles?: boolean;
  role?: string;
}
