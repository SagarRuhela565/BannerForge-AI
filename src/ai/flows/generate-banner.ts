
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
    .describe('Suggestions for improving the banner design, formatted as a bulleted or numbered list.'),
});

export type GenerateBannerOutput = z.infer<typeof GenerateBannerOutputSchema>;

export async function generateBanner(input: GenerateBannerInput): Promise<GenerateBannerOutput> {
  return generateBannerFlow(input);
}

const bannerPrompt = ai.definePrompt({
    name: 'bannerPrompt',
    input: { schema: GenerateBannerInputSchema },
    output: { schema: GenerateBannerOutputSchema },

    prompt: `You are an expert design consultant and image generation specialist.
      
      Your task is to generate a banner image and provide expert design feedback based on the user's request.
      
      **Request Details:**
      - **Style Description:** "{{description}}"
      - **Banner Text:** "{{bannerText}}"
      - **Resolution:** {{resolution}}

      **Instructions:**
      1.  **Generate Image:** Create a high-quality banner image that prominently features the requested text ("{{bannerText}}") and adheres to the style description. The image resolution must be {{resolution}}.
      2.  **Provide Suggestions:** After generating the image, provide 3-4 actionable suggestions for improving the banner. Focus on aspects like layout, color harmony, typography, and imagery. Present the suggestions as a bulleted or numbered list.
      3.  **Format Output:** Return the generated image as a data URI and the suggestions as a string.
      `,
    
    // We must specify the image generation model here.
    config: {
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        responseModalities: ['TEXT', 'IMAGE'],
    }
});


const generateBannerFlow = ai.defineFlow(
  {
    name: 'generateBannerFlow',
    inputSchema: GenerateBannerInputSchema,
    outputSchema: GenerateBannerOutputSchema,
  },
  async (input) => {
    console.log('Generating banner with input:', input);
    
    const result = await bannerPrompt(input);
    const output = result.output;

    if (!output) {
      throw new Error('Banner generation failed to produce an output.');
    }
    
    console.log('Successfully generated banner and suggestions.');
    
    return output;
  }
);
