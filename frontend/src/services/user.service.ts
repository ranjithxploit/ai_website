import api from './api';

export interface HistoryDocument {
  id: string;
  templateId: {
    originalName: string;
  };
  topics: any[];
  requestedPages: number;
  status: string;
  metadata: {
    totalWordCount: number;
    generationTimeMs: number;
  };
  createdAt: string;
  completedAt?: string;
}

export interface UserStats {
  totalDocuments: number;
  totalWords: number;
  byStatus: {
    completed?: number;
    failed?: number;
    processing?: number;
    pending?: number;
  };
}

export const userService = {
  getHistory: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<{
      success: boolean;
      data: {
        documents: HistoryDocument[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(`/users/history?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get<{ success: boolean; data: UserStats }>('/users/stats');
    return response.data.data;
  },
};

export default userService;
