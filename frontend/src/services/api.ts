const API_BASE_URL = 'http://localhost:5000/api';

// API response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[]; // Backend validation errors
}

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('token');
};

// HTTP client with auth
const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<ApiResponse> => {
  const token = getToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || 'API request failed' 
      };
    }

    // Backend zaten doğru formatta response döndürüyor
    if (data.success !== undefined) {
      // Backend'den zaten ApiResponse formatında geliyorsa direkt dön
      return data;
    } else {
      // Eski format için backward compatibility
      return { 
        success: true, 
        data: data,
        message: data.message 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data?.token) {
      setToken(response.data.token);
    }
    
    return response;
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse> => {
    const response = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data?.token) {
      setToken(response.data.token);
    }
    
    return response;
  },

  logout: (): void => {
    removeToken();
  },

  getProfile: async (): Promise<ApiResponse> => {
    return apiClient('/users/profile');
  },
};

// Matches API
export const matchesAPI = {
  getActiveMatches: async (): Promise<ApiResponse> => {
    return apiClient('/matches/active');
  },

  getAllMatches: async (): Promise<ApiResponse> => {
    return apiClient('/matches');
  },

  createMatch: async (matchData: {
    home_team: string;
    away_team: string;
    match_date: string;
    league: string;
    home_points?: number;
    away_points?: number;
    draw_points?: number;
  }): Promise<ApiResponse> => {
    return apiClient('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  },

  setMatchResult: async (matchId: number, result: string): Promise<ApiResponse> => {
    return apiClient(`/matches/${matchId}/result`, {
      method: 'PUT',
      body: JSON.stringify({ result }),
    });
  },

  deleteMatch: async (matchId: number): Promise<ApiResponse> => {
    return apiClient(`/matches/${matchId}`, {
      method: 'DELETE',
    });
  },
};

// Predictions API
export const predictionsAPI = {
  createPrediction: async (predictionData: {
    match_id: number;
    selected_team: string;
  }): Promise<ApiResponse> => {
    return apiClient('/predictions', {
      method: 'POST',
      body: JSON.stringify(predictionData),
    });
  },

  getMyPredictions: async (): Promise<ApiResponse> => {
    return apiClient('/predictions/my');
  },

  getUserPredictions: async (username: string): Promise<ApiResponse> => {
    return apiClient(`/predictions/user/${username}`);
  },
};

// Users API
export const usersAPI = {
  getLeaderboard: async (): Promise<ApiResponse> => {
    return apiClient('/users/leaderboard');
  },

  getProfile: async (): Promise<ApiResponse> => {
    return apiClient('/users/profile');
  },

  getUserProfile: async (username: string): Promise<ApiResponse> => {
    return apiClient(`/users/profile/${username}`);
  },

  getAllUsers: async (): Promise<ApiResponse> => {
    return apiClient('/users');
  },

  getStats: async (): Promise<ApiResponse> => {
    return apiClient('/users/stats');
  },

  getUserStats: async (username: string): Promise<ApiResponse> => {
    return apiClient(`/users/stats/${username}`);
  },

  deleteUser: async (userId: number): Promise<ApiResponse> => {
    return apiClient(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Awards API
export const awardsAPI = {
  getWeeklyRankings: async (): Promise<ApiResponse> => {
    return apiClient('/awards/weekly-rankings');
  },

  giveAward: async (awardData: {
    user_id: number;
    week_start: string;
    week_end: string;
    position: number;
    reward_code?: string;
    description?: string;
  }): Promise<ApiResponse> => {
    return apiClient('/awards/give-award', {
      method: 'POST',
      body: JSON.stringify(awardData),
    });
  },

  getMyAwards: async (): Promise<ApiResponse> => {
    return apiClient('/awards/my-awards');
  },

  getAllAwards: async (): Promise<ApiResponse> => {
    return apiClient('/awards/all');
  },
};

// Social API (Profile comments)
export const socialAPI = {
  // Profile comments
  addComment: async (username: string, commentText: string): Promise<ApiResponse> => {
    return apiClient(`/social/profile/${username}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text: commentText }),
    });
  },

  getComments: async (username: string): Promise<ApiResponse> => {
    return apiClient(`/social/profile/${username}/comments`);
  },

  deleteComment: async (commentId: number): Promise<ApiResponse> => {
    return apiClient(`/social/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// Export token functions
export { getToken, setToken, removeToken }; 