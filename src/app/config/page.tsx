'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AIClient } from '@/lib/ai-client';

export default function ConfigPage() {
  const [systemPrompt, setSystemPrompt] = useState<string>(AIClient.getDefaultSystemPrompt());
  const [saved, setSaved] = useState(false);

  const saveConfiguration = () => {
    // In a real application, this would save to a database or local storage
    localStorage.setItem('customSystemPrompt', systemPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetToDefault = () => {
    setSystemPrompt(AIClient.getDefaultSystemPrompt());
    localStorage.removeItem('customSystemPrompt');
  };

  const loadSavedPrompt = () => {
    const saved = localStorage.getItem('customSystemPrompt');
    if (saved) {
      setSystemPrompt(saved);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            System Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Customize AI diagnostic prompts and system parameters for specialized medical analysis
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>AI System Prompt Configuration</CardTitle>
                <CardDescription>
                  Customize the system prompt that guides the AI's medical image analysis. 
                  This prompt defines the AI's role, expertise, and output format.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="system-prompt" className="text-base font-medium">
                    Medical AI System Prompt
                  </Label>
                  <Textarea
                    id="system-prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[400px] mt-2 text-sm"
                    placeholder="Enter custom system prompt for AI medical analysis..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Character count: {systemPrompt.length}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={saveConfiguration} className="bg-green-600 hover:bg-green-700 text-white">
                    Save Configuration
                  </Button>
                  <Button onClick={resetToDefault} variant="outline">
                    Reset to Default
                  </Button>
                  <Button onClick={loadSavedPrompt} variant="outline">
                    Load Saved Prompt
                  </Button>
                </div>

                {saved && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <AlertDescription>
                      Configuration saved successfully! Your custom prompt will be used for future analyses.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* System Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Current AI model and system configuration details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      AI Model Configuration
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Primary Model:</span>
                        <Badge>Claude Sonnet 4</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">API Provider:</span>
                        <Badge variant="outline">OpenRouter</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Batch Size:</span>
                        <span className="font-medium">20 images</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Images:</span>
                        <span className="font-medium">200 per session</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">DICOM Support:</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Processing Capabilities
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Image Formats:</span>
                        <span className="font-medium">DICOM, PNG, JPEG, BMP, TIFF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">DICOM Conversion:</span>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">Automatic</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Report Export:</span>
                        <Badge variant="outline">PDF</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parallel Processing:</span>
                        <Badge variant="default" className="bg-purple-100 text-purple-800">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Guidelines */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Prompt Guidelines</CardTitle>
                <CardDescription>
                  Best practices for creating effective medical AI prompts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Essential Components
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Define AI role (radiologist, specialist)</li>
                    <li>• Specify expertise level and experience</li>
                    <li>• List required output sections</li>
                    <li>• Include safety disclaimers</li>
                    <li>• Specify medical terminology usage</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Output Structure
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Findings section</li>
                    <li>• Clinical impressions</li>
                    <li>• Recommendations</li>
                    <li>• Key observations</li>
                    <li>• Technical notes</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Safety Considerations
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Include AI limitations disclaimer</li>
                    <li>• Emphasize professional review need</li>
                    <li>• Flag urgent findings clearly</li>
                    <li>• Maintain diagnostic uncertainty</li>
                    <li>• Recommend clinical correlation</li>
                  </ul>
                </div>

                <Separator />

                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription className="text-xs">
                    <strong>Important:</strong> Custom prompts should maintain medical ethics standards and 
                    clearly communicate AI limitations. Always include appropriate disclaimers about 
                    the need for professional medical review.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Specialty Templates</CardTitle>
                <CardDescription>
                  Pre-configured prompts for medical specialties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => setSystemPrompt(
                    `You are an expert chest radiologist specializing in thoracic imaging. 
Focus on lung parenchyma, pleural spaces, cardiac silhouette, mediastinum, and chest wall.
Identify pneumonia, pneumothorax, pleural effusions, masses, and cardiac abnormalities.
Provide structured findings with clinical severity assessment.`
                  )}
                >
                  Chest Radiology
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => setSystemPrompt(
                    `You are a musculoskeletal radiologist with expertise in orthopedic imaging.
Analyze bone structure, joint spaces, soft tissues, and alignment.
Identify fractures, degenerative changes, inflammatory conditions, and tumors.
Provide detailed anatomical descriptions and injury severity assessment.`
                  )}
                >
                  Musculoskeletal
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => setSystemPrompt(
                    `You are a neuroradiologist specializing in brain and spine imaging.
Focus on brain parenchyma, ventricular system, vascular structures, and spinal anatomy.
Identify strokes, tumors, hemorrhages, degenerative changes, and congenital anomalies.
Provide neuroanatomical localization and clinical correlation.`
                  )}
                >
                  Neuroradiology
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => setSystemPrompt(AIClient.getDefaultSystemPrompt())}
                >
                  General Radiology (Default)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Return to Dashboard
          </Button>
          <Button onClick={() => window.location.href = '/upload'} className="bg-blue-600 hover:bg-blue-700 text-white">
            Start Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}