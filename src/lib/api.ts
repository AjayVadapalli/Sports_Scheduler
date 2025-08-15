const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Auth endpoints
  async signUp(email: string, password: string, name: string, role: 'admin' | 'player' = 'player') {
    const response = await this.request<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async signIn(email: string, password: string) {
    const response = await this.request<any>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  signOut() {
    this.setToken(null);
  }

  // Sports endpoints
  async getSports() {
    return this.request<any[]>('/sports');
  }

  async createSport(data: { name: string; description: string; max_players: number }) {
    return this.request<any>('/sports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSport(id: string, data: { name: string; description: string; max_players: number }) {
    return this.request<any>(`/sports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Sessions endpoints
  async getSessions() {
    return this.request<any[]>('/sessions');
  }

  async createSession(data: any) {
    return this.request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSession(sessionId: string, reason: string) {
    return this.request<any>(`/sessions/${sessionId}`, {
      method: 'DELETE',
      body: JSON.stringify({ deletion_reason: reason }),
    });
  }

  async joinSession(sessionId: string) {
    return this.request<any>(`/sessions/${sessionId}/join`, {
      method: 'POST',
    });
  }

  async leaveSession(sessionId: string) {
    return this.request<any>(`/sessions/${sessionId}/leave`, {
      method: 'DELETE',
    });
  }

  async cancelSession(sessionId: string, cancellation_reason: string) {
    return this.request<any>(`/sessions/${sessionId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ cancellation_reason }),
    });
  }

  async getMyCreatedSessions() {
    return this.request<any[]>('/sessions/my-created');
  }

  async getMyJoinedSessions() {
    return this.request<any[]>('/sessions/my-joined');
  }

  // Reports endpoints
  async getStats(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request<any>(`/reports/stats?${params.toString()}`);
  }

  async getSportPopularity(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request<any[]>(`/reports/sport-popularity?${params.toString()}`);
  }

  async getSessionsByDate(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request<any[]>(`/reports/sessions-by-date?${params.toString()}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);