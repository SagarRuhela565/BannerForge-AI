
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
    // Step 1: Generate the banner image.
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a banner image. Style: "${input.description}". Prominently display this text: "${input.bannerText}". Resolution: ${input.resolution}.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Failed to generate banner image.');
    }
    
    const bannerImageUri = media.url;

    // Step 2: Generate improvement suggestions based on the original request.
    // Note: We don't pass the generated image back in for suggestions to simplify the flow and reduce potential errors.
    // The suggestions will be based on the user's original creative direction.
    const { text } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are an expert design consultant. A banner was requested with the following details:
        
        User's Request:
        - Description: "${input.description}"
        - Text: "${input.bannerText}"
        
        Please provide 3-4 actionable suggestions to improve a banner created from this request. Focus on aspects like layout, color harmony, typography, and imagery. Present the suggestions as a bulleted or numbered list.`,
    });


    const finalOutput: GenerateBannerOutput = {
      bannerImage: bannerImageUri,
      improvementSuggestions: text,
    };

    return finalOutput;
  }
);
