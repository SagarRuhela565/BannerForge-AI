import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // This key will be used as a fallback if no other key is provided
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash-latest',
  // Use a fallback model for stability.
  textModel: 'googleai/gemini-1.5-flash-latest',
});
