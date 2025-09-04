export interface AIAnalysisRequest {
  images: string[]; // base64 encoded images
  systemPrompt: string;
  userPrompt: string;
}

export interface AIAnalysisResponse {
  findings: string;
  recommendations: string;
  confidence: number;
  keyObservations: string[];
  technicalNotes?: string;
}

export interface ReportSection {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category: 'finding' | 'recommendation' | 'observation' | 'technical';
}

export interface ReportTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  sections: string[];
  isDefault: boolean;
}

export interface ExportOptions {
  format: 'PDF' | 'HTML';
  includeImages: boolean;
  includeMetadata: boolean;
  templateId?: string;
}