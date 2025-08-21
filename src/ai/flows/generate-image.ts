'use server';
/**
 * @fileOverview A flow for generating images using Gemini.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
  aspectRatio: z.string().optional().describe('The aspect ratio of the image to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<string> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.string(),
  },
  async ({ prompt, aspectRatio }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      prompt: prompt,
      config: {
        responseMimeType: 'image/png',
        aspectRatio: aspectRatio,
      },
    });

    if (!media?.url) {
      throw new Error('No image was generated.');
    }

    return media.url;
  }
);
