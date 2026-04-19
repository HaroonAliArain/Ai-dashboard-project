import { toast } from 'sonner';

export function handleAIError(error: any) {
  console.error("AI Error:", error);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('quota') || errorMessage.includes('429')) {
    toast.error('AI Quota Exhausted', {
      description: 'You have reached the free tier limit for Gemini 3.1 Flash. Please try again in a few minutes or tomorrow.',
      duration: 6000,
    });
    return;
  }
  
  if (errorMessage.includes('api key') || errorMessage.includes('API_KEY')) {
    toast.error('Configuration Error', {
      description: 'The Gemini API key is missing or invalid. Please check your system environment.',
    });
    return;
  }

  if (errorMessage.includes('safety') || errorMessage.includes('finishReason: SAFETY')) {
    toast.warning('Safety Intervention', {
      description: 'The AI declined to generate a response due to safety filters. Please rephrase your request.',
    });
    return;
  }

  toast.error('Intelligence Link Error', {
    description: 'We encountered an unexpected issue connecting to the Gemini neural network.',
  });
}
