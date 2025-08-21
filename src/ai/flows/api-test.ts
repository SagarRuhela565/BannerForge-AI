'use server';

/**
 * @fileOverview A simple flow to test if a Google AI API key is working.
 *
 * - testApiKey - A function that tests a Google AI API key.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

type FlowOptions = {
    apiKey?: string;
}

export async function testApiKey(options?: FlowOptions): Promise<{ok: boolean}> {
  const ai = genkit({
    plugins: [
        googleAI({apiKey: options?.apiKey})
    ]
  });

  const testApiKeyFlow = ai.defineFlow(
    {
      name: 'testApiKeyFlow',
    },
    async () => {
      try {
        await ai.generate({
          prompt: "Hello",
          model: 'googleai/gemini-2.0-flash',
          config: {
            maxOutputTokens: 10,
          },
        });
        return { ok: true };
      } catch (e) {
        console.warn('API key test failed.', e);
        return { ok: false };
      }
    }
  );

  return testApiKeyFlow();
}
