import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI client singleton
 * Always use gemini-1.5-flash model (fastest and free tier)
 * Import from here ONLY - never initialize GoogleGenerativeAI elsewhere
 */
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get the Gemini 1.5 Flash model instance
 */
export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};
