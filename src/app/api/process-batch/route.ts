import { NextRequest, NextResponse } from 'next/server';
import { BatchProcessor } from '@/lib/batch-processor';
import { MedicalImage } from '@/types/medical';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, systemPrompt } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided for processing' },
        { status: 400 }
      );
    }

    // Validate images have required base64 data
    const validImages = images.filter((img: MedicalImage) => img.base64Data);
    
    if (validImages.length === 0) {
      return NextResponse.json(
        { error: 'No valid images with base64 data found' },
        { status: 400 }
      );
    }

    // Create batches
    const batches = BatchProcessor.createBatches(validImages);
    
    if (batches.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create processing batches' },
        { status: 400 }
      );
    }

    // Process all batches
    const processedBatches = await BatchProcessor.processAllBatches(
      batches,
      systemPrompt
    );

    // Calculate overall status
    const status = BatchProcessor.calculateOverallProgress(processedBatches);
    const successfulBatches = BatchProcessor.getSuccessfulBatches(processedBatches);
    const failedBatches = BatchProcessor.getFailedBatches(processedBatches);

    return NextResponse.json({
      success: true,
      totalImages: validImages.length,
      totalBatches: batches.length,
      processedBatches: processedBatches,
      successfulBatches: successfulBatches.length,
      failedBatches: failedBatches.length,
      status: status,
      message: `Processing completed: ${successfulBatches.length}/${batches.length} batches successful`
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image batches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // In a real application, you would fetch this from a database
    // For now, return a mock response
    return NextResponse.json({
      batchId,
      status: 'This endpoint would return batch status from database',
      message: 'Batch status endpoint - implement with database integration'
    });

  } catch (error) {
    console.error('Get batch status error:', error);
    return NextResponse.json(
      { error: 'Failed to get batch status' },
      { status: 500 }
    );
  }
}