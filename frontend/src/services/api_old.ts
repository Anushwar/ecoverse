/**
 * EcoVerse API Client - Enhanced with Real Dataset Integration
 * Handles all API calls to the backend with Gemini AI and dataset analysis
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: string;
  email: string;
  name: string;
  profile: {
    location: string;
    household_size: number;
    lifestyle: string;
  };
  settings: {
    notifications: boolean;
    data_sharing: boolean;
    units: string;
    currency: string;
  };
  created_at: string;
}

export interface Activity {
  id: string;
  category: string;
  type: string;
  amount: number;
  unit: string;
  carbon_emission: number;
  date: string;
  location?: string;
  confidence?: number;
  source: string;
}

export interface CreateActivityRequest {
  category: string;
  type: string;
  amount: number;
  unit: string;
  date?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  total_emissions: number;
  daily_average: number;
  weekly_trend: string;
  top_category: string;
  insights_count: number;
  recommendations_count: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: {
    carbon_reduction: number;
    cost: number;
    difficulty: string;
    timeframe: string;
  };
  confidence: number;
  reasoning: string;
  status: string;
}

export interface Insight {
  id: string;
  title: string;
  message: string;
  data: Record<string, any>;
  severity: string;
  type: string;
  created_at: string;
  read: boolean;
}

export interface DatasetInsight {
  title: string;
  description: string;
  data: Record<string, any>;
  confidence: number;
  source: string;
  type: string;
}

export interface AnalysisResponse {
  insights: Insight[];
  recommendations: Recommendation[];
  gemini_insight: {
    summary: string;
    recommendations: string[];
    insights: string;
    source: string;
  };
  dataset_insights: DatasetInsight[];
}

class ApiClient {
  private baseUrl: string;
  private userId: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Initialize with demo user ID for testing
    this.userId = "demo-user";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.userId}`,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // User management
  async createUser(userData: {
    email: string;
    name: string;
    location: string;
    household_size: number;
    lifestyle: string;
  }): Promise<User> {
    return this.request<User>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/users/me");
  }

  // Activity management  
  async addActivity(activityData: CreateActivityRequest): Promise<Activity & { calculation_result: any }> {
    return this.request<Activity & { calculation_result: any }>("/activities", {
      method: "POST",
      body: JSON.stringify(activityData),
    });
  }

  async getActivities(limit: number = 50): Promise<Activity[]> {
    return this.request<Activity[]>(`/activities?limit=${limit}`);
  }

  // Dashboard data
  async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>("/dashboard");
  }

  // AI Analysis with Gemini and Datasets
  async analyzeFootprint(question?: string, timeframe: string = "30d"): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>("/analyze", {
      method: "POST",
      body: JSON.stringify({
        question,
        timeframe,
      }),
    });
  }

  // Personal insights and recommendations
  async getInsights(limit: number = 20): Promise<Insight[]> {
    return this.request<Insight[]>(`/insights?limit=${limit}`);
  }

  async getRecommendations(limit: number = 20): Promise<Recommendation[]> {
    return this.request<Recommendation[]>(`/recommendations?limit=${limit}`);
  }

  // Dataset insights
  async getDatasetSummary(): Promise<{
    datasets: Record<string, any>;
    total_insights: number;
    insight_categories: string[];
    citations: Record<string, string>;
  }> {
    return this.request("/datasets/summary");
  }

  async getDatasetInsights(): Promise<Record<string, DatasetInsight[]>> {
    return this.request("/datasets/insights");
  }

  // Health check
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>("/health");
  }

  // App info with dataset information
  async getAppInfo(): Promise<{
    message: string;
    version: string;
    features: string[];
    datasets_loaded: string[];
    dataset_info: Record<string, string>;
  }> {
    return this.request("/");
  }

  // Utility method to get user ID
  getUserId(): string | null {
    return this.userId;
  }

  // Set user ID (for authentication in real implementation)
  setUserId(userId: string): void {
    this.userId = userId;
  }
}

export const api = new ApiClient();

  async analyzeFootprint(
    question?: string,
    timeframe: string = "30d"
  ): Promise<any> {
    return this.request("/analyze", {
      method: "POST",
      body: JSON.stringify({
        user_id: this.userId,
        question,
        timeframe,
      }),
    });
  }

  // Dataset-related endpoints
  async getDatasetSummary(): Promise<any> {
    return this.request("/datasets/summary");
  }

  async getDatasetInsights(): Promise<any> {
    return this.request(`/datasets/insights/${this.userId}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request("/health");
  }

  // Set user ID (for demo purposes)
  setUserId(userId: string) {
    this.userId = userId;
  }

  getUserId(): string | null {
    return this.userId;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper functions for common operations
export const api = {
  // Activities
  addActivity: (data: CreateActivityRequest) => apiClient.addActivity(data),
  getActivities: () => apiClient.getActivities(),

  // Dashboard
  getDashboard: () => apiClient.getDashboardData(),

  // AI features
  getInsights: () => apiClient.getInsights(),
  getRecommendations: () => apiClient.getRecommendations(),
  analyzeFootprint: (question?: string) => apiClient.analyzeFootprint(question),

  // Datasets
  getDatasetSummary: () => apiClient.getDatasetSummary(),
  getDatasetInsights: () => apiClient.getDatasetInsights(),

  // Health
  health: () => apiClient.healthCheck(),
};
export default apiClient;
