export interface DicomMetadata {
  patientName?: string;
  patientId?: string;
  studyDate?: string;
  studyTime?: string;
  modality?: string;
  bodyPart?: string;
  studyDescription?: string;
  seriesDescription?: string;
  institutionName?: string;
  physicianName?: string;
}

export interface MedicalImage {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: 'DICOM' | 'PNG' | 'JPEG' | 'JPG' | 'BMP' | 'TIFF';
  fileSize: number;
  isDicom: boolean;
  convertedPath?: string;
  base64Data?: string;
  metadata?: DicomMetadata;
  uploadedAt: Date;
  processed: boolean;
}

export interface ImageBatch {
  id: string;
  images: MedicalImage[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  aiResponse?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface DiagnosticReport {
  id: string;
  patientInfo: {
    name?: string;
    id?: string;
    studyDate?: string;
    modality?: string;
  };
  totalImages: number;
  batches: ImageBatch[];
  status: 'generating' | 'completed' | 'failed';
  findings: string;
  recommendations: string;
  createdAt: Date;
  completedAt?: Date;
  generatedBy: string;
}

export interface ProcessingStatus {
  totalImages: number;
  processedImages: number;
  currentBatch: number;
  totalBatches: number;
  status: 'uploading' | 'converting' | 'processing' | 'generating_report' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
}