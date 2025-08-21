
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
  bannerText: z.string().optional().describe('The text to include in the banner.'),
  images: z.array(z.string()).optional().describe('Optional array of base64 encoded image data URIs to use as inspiration.'),
  logo: z.string().optional().describe('Optional base64 encoded logo data URI to include in the banner.'),
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
  async ({ prompt, bannerText, images, logo }) => {
    let finalPrompt = `A website banner of ${prompt}`;
    if (bannerText) {
      finalPrompt += ` with the text "${bannerText}" prominently displayed.`;
    }
    if (logo) {
      finalPrompt += ` Include the attached logo.`;
    }
    
    const promptParts: (string | { media: { url: string } })[] = [finalPrompt];
    if (logo) {
      promptParts.push({ media: { url: logo } });
    }
    if (images && images.length > 0) {
      images.forEach(url => {
        promptParts.push({ media: { url } });
      });
    }

    const imagePromises = Array(3).fill(null).map(() => 
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: promptParts,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    );

    const results = await Promise.all(imagePromises);

    const imageUrls = results.map(result => {
      if (!result.media?.url) {
        throw new Error('No image was generated for one of the requests.');
      }
      return result.media.url;
    });

    return imageUrls;
  }
);
