
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
  images: z.array(z.string()).optional().describe('Optional array of base64 encoded image data URIs to use as inspiration.'),
  logo: z.string().optional().describe('Optional base64 encoded logo data URI to include in the banner.'),
  bannerText: z.string().optional().describe('A suggestion for the type of content that can be placed on the banner.'),
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
  async ({ prompt, images, logo, bannerText }) => {
    let finalPrompt = `Create a banner for the following text: ${prompt}.`;
    if (bannerText) {
      finalPrompt += ` ${bannerText}.`;
    }

    finalPrompt += ` The banner should be visually striking and suitable for social media advertising, branding, event promotion, and communication. The banner should have a clear space for text to be added later. Do not include any text in the image.`;

    const input: (string | { media: { url: string } })[] = [finalPrompt];

    if (logo) {
      input.push({ media: { url: logo } });
    }

    if (images && images.length > 0) {
      images.forEach((url) => {
        input.push({ media: { url } });
      });
    }

    const imagePromises = Array(3).fill(null).map(() =>
      ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        input,
        config: {
          responseModalities: ['IMAGE'],
        },
      })
    );

    const results = await Promise.all(imagePromises);

    const imageUrls = results.map((result, i) => {
      if (!result.media?.url) {
        throw new Error('No image was generated for one of the requests.');
      }
      return result.media.url;
    });

    return imageUrls;
  }
);
