import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';
import { 
  isDicomFile, 
  extractDicomMetadata, 
  validateMedicalImage 
} from '@/lib/dicom-utils';
import { MedicalImage } from '@/types/medical';
import sharp from 'sharp';

// Configure for file uploads
export const runtime = 'nodejs';

function getFileType(filename: string): MedicalImage['fileType'] {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png': return 'PNG';
    case 'jpg':
    case 'jpeg': return 'JPEG';
    case 'bmp': return 'BMP';
    case 'tiff':
    case 'tif': return 'TIFF';
    case 'dcm':
    case 'dicom': return 'DICOM';
    default: return 'PNG';
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Validate total number of files
    if (files.length > 200) {
      return NextResponse.json(
        { error: 'Maximum 200 files allowed per upload' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const processedImages: MedicalImage[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file
        const validation = validateMedicalImage(file);
        if (!validation.isValid) {
          errors.push(`File ${file.name}: ${validation.error}`);
          continue;
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${i}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filepath = path.join(uploadDir, filename);
        
        // Save original file
        await fs.writeFile(filepath, buffer);
        
        // Check if it's a DICOM file
        const isDicom = isDicomFile(buffer) || validation.fileType === 'DICOM';
        
        let convertedPath: string | undefined;
        let base64Data: string | undefined;
        let metadata = {};
        
        if (isDicom) {
          // Parse DICOM metadata
          metadata = extractDicomMetadata(buffer);
          
          // For DICOM files, we'll convert them in a separate endpoint
          // For now, just mark them for conversion
        } else {
          // For non-DICOM images, generate base64 using Sharp
          try {
            const processedBuffer = await sharp(buffer)
              .png()
              .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
              .toBuffer();
            
            base64Data = processedBuffer.toString('base64');
          } catch (error) {
            console.error('Failed to process image with Sharp:', error);
            // Fallback to original buffer
            base64Data = buffer.toString('base64');
          }
        }

        const medicalImage: MedicalImage = {
          id: `img_${timestamp}_${i}`,
          originalName: file.name,
          fileName: filename,
          filePath: `/uploads/${filename}`,
          fileType: validation.fileType,
          fileSize: buffer.length,
          isDicom: isDicom,
          convertedPath: convertedPath,
          base64Data: base64Data,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          uploadedAt: new Date(),
          processed: false
        };

        processedImages.push(medicalImage);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push(`File ${file.name}: Processing error`);
      }
    }

    if (processedImages.length === 0) {
      return NextResponse.json(
        { error: 'No files could be processed successfully', errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${processedImages.length} files`,
      images: processedImages,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalFiles: files.length,
        successful: processedImages.length,
        failed: errors.length,
        dicomFiles: processedImages.filter(img => img.isDicom).length,
        regularImages: processedImages.filter(img => !img.isDicom).length
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process uploads' },
      { status: 500 }
    );
  }
}