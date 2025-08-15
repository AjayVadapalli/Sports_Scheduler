export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'player';
  created_at: string;
}

export interface Sport {
  id: number;
  name: string;
  description: string;
  max_players: number;
  created_at: string;
  created_by: number;
}

export interface Session {
  id: number;
  sport_id: number;
  sport_name?: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  team_a: string;
  team_b: string;
  max_participants: number;
  current_participants: number;
  created_by: number;
  created_by_name?: string;
  status: 'active' | 'cancelled';
  cancellation_reason?: string;
  created_at: string;
  participants?: string[];
}

export interface SessionParticipant {
  id: number;
  session_id: number;
  user_id: number;
  joined_at: string;
  user?: User;
}

export interface Report {
  total_sessions: string;
  completed_sessions: string;
  cancelled_sessions: string;
  upcoming_sessions: string;
  total_participants: string;
  total_sports: string;
}

export interface SportPopularity {
  name: string;
  count: string;
}

export interface SessionsByDate {
  date: string;
  count: string;
}

export interface DashboardStats {
  totalSessions: number;
  upcomingSessions: number;
  joinedSessions: number;
  totalSports: number;
}

export interface RecentSession {
  id: number;
  title: string;
  sport_name: string;
  venue: string;
  date: string;
  time: string;
  current_participants: number;
  max_participants: number;
  created_by_name: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface SessionFormData {
  sport_id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  team_a: string;
  team_b: string;
  max_participants: number;
}

export interface SportFormData {
  name: string;
  description: string;
  max_players: number;
}

export interface UserSession {
  id: number;
  title: string;
  sport_name: string;
  venue: string;
  date: string;
  time: string;
  current_participants: number;
  max_participants: number;
  status: 'active' | 'cancelled';
  cancellation_reason?: string;
  created_by: number;
  participants?: string[];
  description?: string;
  team_a?: string;
  team_b?: string;
}