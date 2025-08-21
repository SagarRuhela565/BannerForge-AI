
'use server';

/**
 * @fileOverview Generates a banner image based on a description, text, and resolution, and provides improvement suggestions.
 *
 * - generateBanner - A function that generates a banner image and suggestions.
 * - GenerateBannerInput - The input type for the generateBanner function.
 * - GenerateBannerOutput - The return type for the generateBanner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBannerInputSchema = z.object({
  description: z.string().describe('A detailed description of the banner style.'),
  bannerText: z.string().describe('The specific text to be displayed on the banner.'),
  resolution: z.string().describe('The desired resolution of the banner (e.g., 1920x1080).'),
});

export type GenerateBannerInput = z.infer<typeof GenerateBannerInputSchema>;

const GenerateBannerOutputSchema = z.object({
  bannerImage: z.string().describe('The generated banner image as a data URI.'),
  improvementSuggestions: z
    .string()
    .describe('Suggestions for improving the banner design.'),
});

export type GenerateBannerOutput = z.infer<typeof GenerateBannerOutputSchema>;

export async function generateBanner(input: GenerateBannerInput): Promise<GenerateBannerOutput> {
  return generateBannerFlow(input);
}

const generateBannerFlow = ai.defineFlow(
  {
    name: 'generateBannerFlow',
    inputSchema: GenerateBannerInputSchema,
    outputSchema: GenerateBannerOutputSchema,
  },
  async (input) => {
    
    const [imageResult, suggestionsResult] = await Promise.allSettled([
      // Generate Image
      ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a banner image. Style: "${input.description}". Prominently display this text: "${input.bannerText}". Resolution: ${input.resolution}.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
      // Generate Suggestions
      ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are an expert design consultant. A banner was requested with the following details:
        
        User's Request:
        - Description: "${input.description}"
        - Text: "${input.bannerText}"
        
        Please provide 3-4 actionable suggestions to improve a banner created from this request. Focus on aspects like layout, color harmony, typography, and imagery. Present the suggestions as a bulleted or numbered list.`,
      })
    ]);

    if (imageResult.status === 'rejected' || !imageResult.value.media?.url) {
      throw new Error('Failed to generate banner image.');
    }
    
    const bannerImageUri = imageResult.value.media.url;
    
    // Suggestions are optional, so we can proceed even if it fails
    const improvementSuggestions = suggestionsResult.status === 'fulfilled' 
      ? suggestionsResult.value.text 
      : 'Could not generate suggestions at this time.';

    return {
      bannerImage: bannerImageUri,
      improvementSuggestions: improvementSuggestions,
    };
  }
);
