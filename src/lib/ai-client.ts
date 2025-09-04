import { AIAnalysisResponse } from '@/types/report';

const AI_ENDPOINT = 'https://oi-server.onrender.com/chat/completions';
const AI_MODEL = 'openrouter/anthropic/claude-sonnet-4';

const DEFAULT_SYSTEM_PROMPT = `You are an expert radiologist AI assistant specializing in medical image analysis. Your role is to provide detailed, professional diagnostic observations based on medical images provided.

GUIDELINES:
- Provide clear, medical-grade observations using appropriate medical terminology
- Structure your analysis with findings, impressions, and recommendations
- Be thorough but concise in your assessments
- Always note any limitations or areas requiring further evaluation
- Use a professional tone suitable for medical documentation
- Focus on observable pathology and anatomical structures

RESPONSE FORMAT:
Provide your analysis in the following structured format:
- CLINICAL FINDINGS: Detailed observations of what you see in the images
- IMPRESSIONS: Your clinical interpretation of the findings
- RECOMMENDATIONS: Suggested next steps or follow-up actions
- TECHNICAL NOTES: Any technical observations about image quality or acquisition

Remember: This is an AI-assisted analysis and should always be reviewed by qualified medical professionals.`;

export class AIClient {
  private systemPrompt: string;

  constructor(customSystemPrompt?: string) {
    this.systemPrompt = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
  }

  /**
   * Analyze a batch of medical images using AI
   */
  async analyzeImages(images: string[], customPrompt?: string): Promise<AIAnalysisResponse> {
    try {
      const userPrompt = customPrompt || 'Please analyze these medical images and provide a comprehensive diagnostic assessment.';

      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...images.map(imageBase64 => ({
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }))
          ]
        }
      ];

      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'CustomerId': 'cus_RuCkUD5gposwKc',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer xxx'
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';

      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('Error in AI image analysis:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseAIResponse(response: string): AIAnalysisResponse {
    return {
      findings: response || 'No specific findings extracted from response.',
      recommendations: 'Please consult with a qualified radiologist for interpretation.',
      confidence: 0.8,
      keyObservations: [],
      technicalNotes: undefined
    };
  }

  updateSystemPrompt(newPrompt: string): void {
    this.systemPrompt = newPrompt;
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  static getDefaultSystemPrompt(): string {
    return DEFAULT_SYSTEM_PROMPT;
  }
}