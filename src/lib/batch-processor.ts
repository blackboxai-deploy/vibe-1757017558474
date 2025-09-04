import { MedicalImage, ImageBatch, ProcessingStatus } from '@/types/medical';
import { AIClient } from './ai-client';

export class BatchProcessor {
  static readonly BATCH_SIZE = 20;
  
  static createBatches(images: MedicalImage[]): ImageBatch[] {
    const batches: ImageBatch[] = [];
    
    for (let i = 0; i < images.length; i += this.BATCH_SIZE) {
      const batchImages = images.slice(i, i + this.BATCH_SIZE);
      
      batches.push({
        id: `batch_${Date.now()}_${Math.floor(i / this.BATCH_SIZE)}`,
        images: batchImages,
        status: 'pending',
        createdAt: new Date()
      });
    }
    
    return batches;
  }
  
  static async processBatch(
    batch: ImageBatch,
    systemPrompt?: string,
    _onProgress?: (status: ProcessingStatus) => void
  ): Promise<ImageBatch> {
    try {
      // Update batch status
      batch.status = 'processing';
      
      // Filter images that have base64 data
      const processableImages = batch.images.filter(img => img.base64Data);
      
      if (processableImages.length === 0) {
        throw new Error('No processable images in batch');
      }
      
      // Extract base64 data
      const base64Images = processableImages.map(img => img.base64Data!);
      
      // Create user prompt with context about the images
      const imageInfo = processableImages.map((img, index) => {
        let info = `Image ${index + 1}: ${img.originalName}`;
        if (img.metadata) {
          if (img.metadata.modality) info += ` (${img.metadata.modality})`;
          if (img.metadata.bodyPart) info += ` - ${img.metadata.bodyPart}`;
          if (img.metadata.studyDescription) info += ` - ${img.metadata.studyDescription}`;
        }
        return info;
      }).join('\n');
      
      const userPrompt = `Please analyze the following medical images:

${imageInfo}

Provide a comprehensive diagnostic analysis focusing on:
1. Key findings for each image
2. Overall clinical impression
3. Recommendations for further evaluation if needed
4. Any urgent or critical findings

Please maintain professional medical terminology and provide detailed observations.`;

      // Analyze images with AI
      const aiClient = new AIClient(systemPrompt);
      const aiResponse = await aiClient.analyzeImages(base64Images, userPrompt);
      
      // Update batch with results
      batch.aiResponse = JSON.stringify(aiResponse);
      batch.status = 'completed';
      batch.completedAt = new Date();
      
      return batch;
    } catch (error) {
      console.error('Error processing batch:', error);
      batch.status = 'failed';
      batch.error = error instanceof Error ? error.message : 'Unknown error occurred';
      batch.completedAt = new Date();
      
      return batch;
    }
  }
  
  static async processAllBatches(
    batches: ImageBatch[],
    systemPrompt?: string,
    onProgress?: (status: ProcessingStatus) => void
  ): Promise<ImageBatch[]> {
    const results: ImageBatch[] = [];
    const totalBatches = batches.length;
    const totalImages = batches.reduce((sum, batch) => sum + batch.images.length, 0);
    let processedImages = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Update progress
      if (onProgress) {
        onProgress({
          totalImages,
          processedImages,
          currentBatch: i + 1,
          totalBatches,
          status: 'processing',
          progress: Math.floor((processedImages / totalImages) * 100)
        });
      }
      
      try {
        // Process batch with delay between batches to avoid rate limiting
        if (i > 0) {
          await this.delay(1000); // 1 second delay between batches
        }
        
        const processedBatch = await this.processBatch(batch, systemPrompt);
        results.push(processedBatch);
        
        // Update processed count
        processedImages += batch.images.length;
        
        // Update progress
        if (onProgress) {
          onProgress({
            totalImages,
            processedImages,
            currentBatch: i + 1,
            totalBatches,
            status: 'processing',
            progress: Math.floor((processedImages / totalImages) * 100)
          });
        }
        
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error);
        
        // Mark batch as failed but continue with others
        batch.status = 'failed';
        batch.error = error instanceof Error ? error.message : 'Unknown error occurred';
        batch.completedAt = new Date();
        results.push(batch);
        
        processedImages += batch.images.length;
      }
    }
    
    // Final progress update
    if (onProgress) {
      onProgress({
        totalImages,
        processedImages,
        currentBatch: totalBatches,
        totalBatches,
        status: 'completed',
        progress: 100
      });
    }
    
    return results;
  }
  
  static calculateOverallProgress(batches: ImageBatch[]): ProcessingStatus {
    const totalImages = batches.reduce((sum, batch) => sum + batch.images.length, 0);
    const completedBatches = batches.filter(batch => batch.status === 'completed').length;
    const failedBatches = batches.filter(batch => batch.status === 'failed').length;
    const processingBatches = batches.filter(batch => batch.status === 'processing').length;
    
    const processedImages = batches
      .filter(batch => batch.status === 'completed' || batch.status === 'failed')
      .reduce((sum, batch) => sum + batch.images.length, 0);
    
    let status: ProcessingStatus['status'] = 'processing';
    if (completedBatches + failedBatches === batches.length) {
      status = failedBatches === batches.length ? 'failed' : 'completed';
    }
    
    return {
      totalImages,
      processedImages,
      currentBatch: completedBatches + failedBatches + Math.min(processingBatches, 1),
      totalBatches: batches.length,
      status,
      progress: Math.floor((processedImages / totalImages) * 100)
    };
  }
  
  static getSuccessfulBatches(batches: ImageBatch[]): ImageBatch[] {
    return batches.filter(batch => batch.status === 'completed' && batch.aiResponse);
  }
  
  static getFailedBatches(batches: ImageBatch[]): ImageBatch[] {
    return batches.filter(batch => batch.status === 'failed');
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}