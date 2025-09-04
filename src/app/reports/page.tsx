'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiagnosticReportData {
  report: {
    id: string;
    totalImages: number;
    status: string;
    createdAt: string;
    generatedBy: string;
    patientInfo: {
      name?: string;
      id?: string;
      studyDate?: string;
      modality?: string;
    };
  };
  formattedReport: {
    summary: string;
    findings: string;
    recommendations: string;
    metadata: string;
  };
  statistics: {
    totalImages: number;
    totalBatches: number;
    successfulBatches: number;
    failedBatches: number;
    successRate: number;
  };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<DiagnosticReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load report data from session storage
    try {
      const storedData = sessionStorage.getItem('diagnosticReport');
      if (storedData) {
        const data = JSON.parse(storedData);
        setReportData(data);
      } else {
        setError('No diagnostic report available. Please upload and process images first.');
      }
    } catch (err) {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToPDF = async () => {
    if (!reportData) return;
    
    // In a real implementation, this would call the export API
    alert('PDF export would be implemented here. The report data is ready for export.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading diagnostic report...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-200 bg-red-50 text-red-800 max-w-2xl mx-auto">
            <AlertDescription>
              {error || 'No diagnostic report available'}
            </AlertDescription>
          </Alert>
          <div className="text-center mt-8">
            <Button onClick={() => window.location.href = '/upload'}>
              Upload New Images
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Diagnostic Report
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                AI-generated medical imaging analysis results
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={exportToPDF} variant="outline">
                Export PDF
              </Button>
              <Button onClick={() => window.location.href = '/upload'}>
                New Analysis
              </Button>
            </div>
          </div>
        </header>

        {/* Report Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Report Overview</CardTitle>
              <Badge variant={reportData.report.status === 'completed' ? 'default' : 'secondary'}>
                {reportData.report.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>{reportData.formattedReport.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {reportData.statistics.totalImages}
                </div>
                <div className="text-sm text-gray-600">Total Images</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {reportData.statistics.successfulBatches}
                </div>
                <div className="text-sm text-gray-600">Successful Batches</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {reportData.statistics.successRate}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {reportData.statistics.totalBatches}
                </div>
                <div className="text-sm text-gray-600">Processing Batches</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Report Content */}
        <Tabs defaultValue="findings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="findings">Findings</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="metadata">Report Details</TabsTrigger>
          </TabsList>

          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle>Medical Findings</CardTitle>
                <CardDescription>
                  Detailed analysis results from AI examination of medical images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-6 rounded-lg font-sans leading-relaxed">
                    {reportData.formattedReport.findings}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>Clinical Recommendations</CardTitle>
                <CardDescription>
                  Suggested next steps and clinical considerations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-6 rounded-lg font-sans leading-relaxed">
                    {reportData.formattedReport.recommendations}
                  </pre>
                </div>
                <Separator className="my-6" />
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription>
                    <strong>Important Medical Disclaimer:</strong> This analysis was generated by AI and is intended for supplementary use only. 
                    All findings and recommendations should be reviewed and validated by a qualified radiologist or medical professional. 
                    AI analysis is not a substitute for professional medical diagnosis and clinical judgment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <CardTitle>Report Metadata</CardTitle>
                <CardDescription>
                  Technical details and patient information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Patient Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient Name:</span>
                        <span className="font-medium">{reportData.report.patientInfo.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient ID:</span>
                        <span className="font-medium">{reportData.report.patientInfo.id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Study Date:</span>
                        <span className="font-medium">{reportData.report.patientInfo.studyDate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modality:</span>
                        <span className="font-medium">{reportData.report.patientInfo.modality || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Report Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Report ID:</span>
                        <span className="font-medium font-mono text-xs">{reportData.report.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Generated:</span>
                        <span className="font-medium">{formatDate(reportData.report.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Generated By:</span>
                        <span className="font-medium">{reportData.report.generatedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={reportData.report.status === 'completed' ? 'default' : 'secondary'}>
                          {reportData.report.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Processing Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{reportData.statistics.totalImages}</div>
                      <div className="text-gray-600">Images Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{reportData.statistics.totalBatches}</div>
                      <div className="text-gray-600">Total Batches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{reportData.statistics.successfulBatches}</div>
                      <div className="text-gray-600">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{reportData.statistics.failedBatches}</div>
                      <div className="text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{reportData.statistics.successRate}%</div>
                      <div className="text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={() => window.location.href = '/upload'} className="bg-blue-600 hover:bg-blue-700 text-white">
            Analyze New Images
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}