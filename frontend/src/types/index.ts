// Kullanıcı ile ilgili type'lar
export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  score: number;
  createdAt: Date;
}

// Maç ile ilgili type'lar
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: Date;
  description?: string;
  matchResult?: BetType; // Maç sonucu: 'home', 'draw', 'away'
  isFinished: boolean;
  createdAt: Date;
  // Bahis puanları
  homeWinPoints: number;
  drawPoints: number;
  awayWinPoints: number;
}

// Tahmin ile ilgili type'lar
export type BetType = 'home' | 'draw' | 'away';

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  betType: BetType;
  points?: number;
  createdAt: Date;
}

// Ödül sistemi
export interface Prize {
  id: string;
  name: string;
  targetScore: number;
  winnerId?: string;
  isActive: boolean;
  createdAt: Date;
}

// Auth context için
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

// Form ile ilgili type'lar
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
}

export interface MatchFormData {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  description?: string;
  homeWinPoints: number;
  drawPoints: number;
  awayWinPoints: number;
}

export interface PredictionFormData {
  betType: BetType;
}

export interface ResultFormData {
  matchResult: BetType;
}

// Haftalık sıralama sistemi
export interface WeeklyRanking {
  id: string;
  week: number;
  year: number;
  weekStartDate: Date;
  weekEndDate: Date;
  rankings: WeeklyUserRanking[];
  isCompleted: boolean;
  createdAt: Date;
}

export interface WeeklyUserRanking {
  userId: string;
  userName: string;
  weeklyScore: number;
  position: number;
  rewardGiven: boolean;
}

// Ödül sistemi
export interface UserReward {
  id: string;
  userId: string;
  rewardType: RewardType;
  title: string;
  description: string;
  weeklyRankingId?: string;
  position?: number; // 1, 2, 3 için haftalık sıralama ödülü
  givenBy: string; // Admin user ID
  receivedAt: Date;
}

export type RewardType = 'weekly_first' | 'weekly_second' | 'weekly_third' | 'special' | 'achievement';

// Sosyal özellikler
export interface ProfileComment {
  id: number;
  commenter_id: number;
  commenter_username: string;
  profile_user_id: number;
  comment_text: string;
  created_at: string;
} 