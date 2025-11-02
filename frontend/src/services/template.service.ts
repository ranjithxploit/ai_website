import api from './api';

export interface Template {
  id: string;
  originalName: string;
  fileType: 'pdf' | 'docx';
  sections: {
    name: string;
    placeholder: string;
    required: boolean;
  }[];
  pageCount: number;
  metadata: {
    uploadedAt: string;
    lastUsed?: string;
    timesUsed: number;
  };
  createdAt: string;
}

export const templateService = {
  uploadTemplate: async (file: File) => {
    const formData = new FormData();
    formData.append('template', file);

    const response = await api.post<{ success: boolean; data: { template: Template } }>(
      '/templates/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.template;
  },

  getTemplates: async () => {
    const response = await api.get<{ success: boolean; data: { templates: Template[]; count: number } }>(
      '/templates'
    );
    return response.data.data;
  },

  getTemplate: async (id: string) => {
    const response = await api.get<{ success: boolean; data: { template: Template } }>(
      `/templates/${id}`
    );
    return response.data.data.template;
  },

  deleteTemplate: async (id: string) => {
    await api.delete(`/templates/${id}`);
  },
};

export default templateService;
