import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY is missing in environment variables.");
  process.exit(1);
}

let ai;

try {
  ai = genkit({
    plugins: [
      googleAI({
        apiKey: process.env.GEMINI_API_KEY,
      }),
    ],
    model: 'googleai/gemini-2.5-pro',
    textModel: 'googleai/gemini-2.5-pro',
  });

  console.log("✅ Gemini API setup successful.");
} catch (error) {
  console.error("❌ Failed to initialize Gemini API:", error.message);
}

export { ai };
