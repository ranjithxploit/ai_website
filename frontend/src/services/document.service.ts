import api from './api';

export type FormatStyle = 'bullets' | 'bullets-paragraph' | 'paragraph';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Topic {
  name: string;
  style: FormatStyle;
}

export interface GenerateDocumentData {
  templateId: string;
  topics: Topic[];
  requestedPages: number;
}

export interface Document {
  id: string;
  userId: string;
  templateId: {
    id: string;
    originalName: string;
    fileType: string;
  };
  topics: Topic[];
  requestedPages: number;
  status: DocumentStatus;
  generatedContent?: {
    sectionName: string;
    content: string;
    wordCount: number;
  }[];
  filenameDocx?: string;
  filenamePdf?: string;
  metadata: {
    totalWordCount: number;
    generationTimeMs: number;
    error?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export const documentService = {
  generateDocument: async (data: GenerateDocumentData) => {
    const response = await api.post<{ success: boolean; data: { documentId: string; status: string } }>(
      '/generate',
      data
    );
    return response.data.data;
  },

  getDocument: async (id: string) => {
    const response = await api.get<{ success: boolean; data: { document: Document } }>(
      `/generate/${id}`
    );
    return response.data.data.document;
  },

  downloadDocument: async (id: string, format: 'docx' | 'pdf') => {
    const response = await api.get(`/generate/${id}/download/${format}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `assignment.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default documentService;
