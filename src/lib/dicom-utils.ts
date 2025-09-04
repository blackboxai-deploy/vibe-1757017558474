import { DicomMetadata, MedicalImage } from '@/types/medical';

/**
 * Check if a file is a DICOM file based on its content
 */
export function isDicomFile(buffer: any): boolean {
  try {
    // Simple check for DICOM magic number at offset 128
    if (buffer.length < 132) return false;
    
    const bytes = new Uint8Array(buffer);
    const dicmString = String.fromCharCode(...bytes.slice(128, 132));
    return dicmString === 'DICM';
  } catch (error) {
    return false;
  }
}

/**
 * Extract metadata from DICOM file (simplified version)
 */
export function extractDicomMetadata(buffer: any): DicomMetadata {
  try {
    // Simplified metadata extraction - in real implementation would use dicom-parser
    return {
      patientName: 'Unknown',
      patientId: 'AUTO-GENERATED',
      studyDate: new Date().toISOString().split('T')[0],
      studyTime: new Date().toISOString().split('T')[1].split('.')[0],
      modality: 'Unknown',
    };
  } catch (error) {
    console.error('Error extracting DICOM metadata:', error);
    return {};
  }
}

/**
 * Extract pixel data from DICOM file (simplified version)
 */
export function extractPixelData(buffer: any): {
  pixelData: Uint8Array;
  width: number;
  height: number;
  samplesPerPixel: number;
  photometricInterpretation: string;
} | null {
  try {
    // Simplified implementation - would need proper DICOM parsing in real use
    return {
      pixelData: new Uint8Array(512 * 512), // Dummy data
      width: 512,
      height: 512,
      samplesPerPixel: 1,
      photometricInterpretation: 'MONOCHROME2',
    };
  } catch (error) {
    console.error('Error extracting pixel data:', error);
    return null;
  }
}

/**
 * Validate medical image file
 */
export function validateMedicalImage(file: File): {
  isValid: boolean;
  error?: string;
  fileType: MedicalImage['fileType'];
} {
  const validExtensions = ['.dcm', '.dicom', '.png', '.jpg', '.jpeg', '.bmp', '.tiff'];
  const maxSize = 100 * 1024 * 1024; // 100MB per file
  
  const extension = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => extension.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      isValid: false,
      error: 'Invalid file type. Supported formats: DICOM, PNG, JPG, JPEG, BMP, TIFF',
      fileType: 'PNG',
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 100MB per file',
      fileType: 'PNG',
    };
  }
  
  let fileType: MedicalImage['fileType'] = 'PNG';
  if (extension.endsWith('.dcm') || extension.endsWith('.dicom')) {
    fileType = 'DICOM';
  } else if (extension.endsWith('.jpg') || extension.endsWith('.jpeg')) {
    fileType = 'JPEG';
  } else if (extension.endsWith('.png')) {
    fileType = 'PNG';
  } else if (extension.endsWith('.bmp')) {
    fileType = 'BMP';
  } else if (extension.endsWith('.tiff')) {
    fileType = 'TIFF';
  }
  
  return {
    isValid: true,
    fileType,
  };
}

/**
 * Generate unique filename for processed images
 */
export function generateImageFileName(originalName: string, suffix: string = 'processed'): string {
  const timestamp = Date.now();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${sanitizedName}_${suffix}_${timestamp}.png`;
}