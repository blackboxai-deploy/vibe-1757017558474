'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MedicalImage, ProcessingStatus } from '@/types/medical';
import { AIClient } from '@/lib/ai-client';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface UploadState {
  images: MedicalImage[];
  isUploading: boolean;
  isProcessing: boolean;
  uploadProgress: number;
  processingStatus?: ProcessingStatus;
  error?: string;
  success?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>({
    images: [],
    isUploading: false,
    isProcessing: false,
    uploadProgress: 0
  });
  const [systemPrompt, setSystemPrompt] = useState<string>(AIClient.getDefaultSystemPrompt());
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    if (files.length > 200) {
      setUploadState(prev => ({
        ...prev,
        error: 'Maximum 200 files allowed. Please select fewer files.'
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: undefined,
      uploadProgress: 0
    }));

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      setUploadState(prev => ({
        ...prev,
        images: data.images,
        isUploading: false,
        uploadProgress: 100,
        success: `Successfully uploaded ${data.processedFiles} files`
      }));

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
    }
  };

  const processImages = async () => {
    if (uploadState.images.length === 0) {
      setUploadState(prev => ({
        ...prev,
        error: 'No images to process'
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      isProcessing: true,
      error: undefined,
      processingStatus: {
        totalImages: prev.images.length,
        processedImages: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(prev.images.length / 20),
        status: 'processing',
        progress: 0
      }
    }));

    try {
      // Process images in batches
      const response = await fetch('/api/process-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: uploadState.images,
          systemPrompt: systemPrompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();

      // Generate final report
      const reportResponse = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: uploadState.images,
          batches: data.processedBatches,
          patientInfo: {
            name: 'Patient',
            id: 'AUTO-GENERATED',
            studyDate: new Date().toISOString().split('T')[0],
            modality: 'Multiple'
          },
          exportFormat: 'PDF'
        }),
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(errorData.error || 'Report generation failed');
      }

      const reportData = await reportResponse.json();

      setUploadState(prev => ({
        ...prev,
        isProcessing: false,
        processingStatus: {
          ...prev.processingStatus!,
          status: 'completed',
          progress: 100
        },
        success: `Processing completed! ${data.successfulBatches}/${data.totalBatches} batches successful`
      }));

      // Store report data for navigation
      sessionStorage.setItem('diagnosticReport', JSON.stringify(reportData));

      // Navigate to reports page after a short delay
      setTimeout(() => {
        router.push('/reports');
      }, 2000);

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isProcessing: false,
        processingStatus: prev.processingStatus ? {
          ...prev.processingStatus,
          status: 'failed'
        } : undefined,
        error: error instanceof Error ? error.message : 'Processing failed'
      }));
    }
  };

  const resetUpload = () => {
    setUploadState({
      images: [],
      isUploading: false,
      isProcessing: false,
      uploadProgress: 0
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Medical Image Upload & Processing
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload up to 200 medical images for AI diagnostic analysis
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Image Upload</CardTitle>
                <CardDescription>
                  Drag and drop medical images or click to select files. DICOM files will be automatically converted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  } ${
                    uploadState.isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded"></div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Drop medical images here
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        or click to select files (max 200 files)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".dcm,.dicom,.png,.jpg,.jpeg,.bmp,.tiff,.tif"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadState.isUploading}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        disabled={uploadState.isUploading}
                      >
                        Select Files
                      </Button>
                    </label>
                  </div>
                </div>

                {uploadState.isUploading && (
                  <div className="mt-4">
                    <Progress value={uploadState.uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-600 mt-2">Uploading files...</p>
                  </div>
                )}

                {uploadState.images.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Uploaded Images ({uploadState.images.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {uploadState.images.slice(0, 20).map((image) => (
                        <div key={image.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {image.originalName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(image.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={image.isDicom ? 'default' : 'secondary'}>
                              {image.fileType}
                            </Badge>
                            {image.convertedPath && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                Converted
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {uploadState.images.length > 20 && (
                        <div className="col-span-2 text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ... and {uploadState.images.length - 20} more files
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {uploadState.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Control</CardTitle>
                  <CardDescription>
                    Start AI analysis of uploaded medical images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={processImages}
                      disabled={uploadState.isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {uploadState.isProcessing ? 'Processing Images...' : 'Start AI Analysis'}
                    </Button>
                    
                    {uploadState.processingStatus && (
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Processing Progress</span>
                            <span>{uploadState.processingStatus.progress}%</span>
                          </div>
                          <Progress value={uploadState.processingStatus.progress} className="w-full" />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Batch {uploadState.processingStatus.currentBatch} of {uploadState.processingStatus.totalBatches}</p>
                          <p>Images processed: {uploadState.processingStatus.processedImages} / {uploadState.processingStatus.totalImages}</p>
                          <p>Status: {uploadState.processingStatus.status.toUpperCase()}</p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={resetUpload}
                      variant="outline"
                      className="w-full"
                      disabled={uploadState.isProcessing}
                    >
                      Reset Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* System Prompt Configuration */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>AI System Configuration</CardTitle>
                <CardDescription>
                  Customize the AI diagnostic prompt for specialized analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="system-prompt">System Prompt</Label>
                    <Textarea
                      id="system-prompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="min-h-[300px] text-sm"
                      placeholder="Enter custom system prompt for AI analysis..."
                    />
                  </div>
                  <Button
                    onClick={() => setSystemPrompt(AIClient.getDefaultSystemPrompt())}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Messages */}
        {uploadState.error && (
          <Alert className="mt-6 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{uploadState.error}</AlertDescription>
          </Alert>
        )}

        {uploadState.success && (
          <Alert className="mt-6 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{uploadState.success}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}