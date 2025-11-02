import api from './api';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      data
    );
    return response.data.data;
  },

  login: async (data: LoginData) => {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      data
    );
    return response.data.data;
  },

  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refreshToken });
  },

  getCurrentUser: async () => {
    const response = await api.get<{ success: boolean; data: { user: any } }>('/auth/me');
    return response.data.data.user;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },
};

export default authService;
