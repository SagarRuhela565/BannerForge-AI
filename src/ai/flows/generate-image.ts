'use server';
/**
 * @fileOverview A flow for generating images using Gemini 2.0 Flash Preview.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<string[]> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.array(z.string()),
  },
  async ({ prompt }) => {
    const finalPrompt = `Create a banner for the following text: ${prompt}.
    The banner should be visually striking and suitable for social media advertising, branding, event promotion, and communication.
    The banner should have a clear space for text to be added later.
    Do not include any text in the image.`;

    // Request 3 images
    const imagePromises = Array(3)
      .fill(null)
      .map(() =>
        ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: finalPrompt,
          config: {
            responseModalities: ['IMAGE'],
          },
        })
      );

    const results = await Promise.all(imagePromises);

    // Extract image URLs
    const imageUrls = results.map((result) => {
      const imageUrl = result.media?.url;
      if (!imageUrl) {
        throw new Error('No image was generated for one of the requests.');
      }
      return imageUrl;
    });

    return imageUrls;
  }
);
