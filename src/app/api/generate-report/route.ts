import { NextRequest, NextResponse } from 'next/server';
import { BatchProcessor } from '@/lib/batch-processor';
import { MedicalImage, ImageBatch, DiagnosticReport } from '@/types/medical';

export const runtime = 'nodejs';
export const maxDuration = 900; // 15 minutes timeout for full report generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, patientInfo, systemPrompt } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided for report generation' },
        { status: 400 }
      );
    }

    // Validate images have base64 data (exclude DICOM placeholders)
    const validImages = images.filter((img: MedicalImage) => 
      img.base64Data && img.base64Data !== 'DICOM_PLACEHOLDER'
    );
    
    if (validImages.length === 0) {
      return NextResponse.json(
        { error: 'No valid images with base64 data found. Please ensure non-DICOM images are uploaded or DICOM files are converted.' },
        { status: 400 }
      );
    }

    // Create batches
    const batches = BatchProcessor.createBatches(validImages);
    
    // Process all images in batches
    const processedBatches = await BatchProcessor.processAllBatches(batches, systemPrompt);
    
    // Generate comprehensive report text
    const reportText = generateComprehensiveReport(processedBatches, patientInfo);

    // Calculate statistics
    const successfulBatches = processedBatches.filter(batch => batch.status === 'completed');
    const failedBatches = processedBatches.filter(batch => batch.status === 'failed');
    
    const stats = {
      totalImages: validImages.length,
      totalBatches: processedBatches.length,
      successfulBatches: successfulBatches.length,
      failedBatches: failedBatches.length,
      successRate: processedBatches.length > 0 ? Math.round((successfulBatches.length / processedBatches.length) * 100) : 0
    };

    // Create diagnostic report object
    const report: DiagnosticReport = {
      id: `report_${Date.now()}`,
      patientInfo: patientInfo || {},
      totalImages: validImages.length,
      batches: processedBatches,
      status: failedBatches.length === 0 ? 'completed' : 'completed',
      findings: reportText,
      recommendations: 'Please review all findings with a qualified medical professional.',
      createdAt: new Date(),
      completedAt: new Date(),
      generatedBy: 'AI-Assisted Radiology Platform'
    };

    return NextResponse.json({
      success: true,
      report: report,
      reportText: reportText,
      batches: processedBatches,
      statistics: stats,
      formattedReport: {
        summary: `Analysis of ${validImages.length} medical images completed`,
        findings: reportText,
        recommendations: 'Please consult with a qualified medical professional for interpretation',
        metadata: `Generated on ${new Date().toLocaleString()}`
      },
      message: `Report generated successfully: ${stats.successfulBatches}/${stats.totalBatches} batches processed`
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate diagnostic report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateComprehensiveReport(
  batches: ImageBatch[],
  patientInfo?: { name?: string; id?: string; studyDate?: string; modality?: string }
): string {
  const successfulBatches = batches.filter(batch => batch.status === 'completed' && batch.aiResponse);
  const failedBatches = batches.filter(batch => batch.status === 'failed');
  
  let report = `# COMPREHENSIVE RADIOLOGY REPORT\n\n`;
  
  if (patientInfo) {
    report += `## PATIENT INFORMATION\n`;
    if (patientInfo.name) report += `Patient Name: ${patientInfo.name}\n`;
    if (patientInfo.id) report += `Patient ID: ${patientInfo.id}\n`;
    if (patientInfo.studyDate) report += `Study Date: ${patientInfo.studyDate}\n`;
    if (patientInfo.modality) report += `Modality: ${patientInfo.modality}\n`;
    report += `\n`;
  }

  report += `## STUDY SUMMARY\n`;
  report += `Total Images Analyzed: ${batches.reduce((sum, batch) => sum + batch.images.length, 0)}\n`;
  report += `Successful Batches: ${successfulBatches.length}\n`;
  report += `Failed Batches: ${failedBatches.length}\n`;
  report += `Analysis Date: ${new Date().toLocaleDateString()}\n\n`;

  if (successfulBatches.length > 0) {
    report += `## CONSOLIDATED FINDINGS\n\n`;
    
    successfulBatches.forEach((batch, index) => {
      try {
        const aiResponse = JSON.parse(batch.aiResponse!);
        
        report += `### Batch ${index + 1} Analysis (${batch.images.length} images)\n`;
        if (aiResponse.findings) {
          report += `**Findings:** ${aiResponse.findings}\n\n`;
        }
      } catch (error) {
        report += `### Batch ${index + 1} Analysis (${batch.images.length} images)\n`;
        report += `Error parsing AI response: ${error}\n\n`;
      }
    });
  }

  if (failedBatches.length > 0) {
    report += `## PROCESSING ERRORS\n`;
    failedBatches.forEach((batch) => {
      report += `Batch: ${batch.error || 'Unknown error'}\n`;
    });
    report += `\n`;
  }

  report += `## IMPORTANT DISCLAIMER\n`;
  report += `This report was generated using AI-assisted analysis and should always be reviewed by qualified medical professionals.\n\n`;
  report += `Generated by AI-Assisted Radiology Platform on ${new Date().toLocaleString()}\n`;

  return report;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      reportId,
      status: 'This endpoint would return report from database',
      message: 'Report retrieval endpoint - implement with database integration'
    });

  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}