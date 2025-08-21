'use server';

/**
 * @fileOverview Generates a banner image based on a description, text, and resolution.
 *
 * - generateBanner - A function that generates a banner image.
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
  progress: z.string().describe('Progress summary of the banner generation.'),
});

export type GenerateBannerOutput = z.infer<typeof GenerateBannerOutputSchema>;

export async function generateBanner(input: GenerateBannerInput): Promise<GenerateBannerOutput> {
  return generateBannerFlow(input);
}

const generateBannerPrompt = ai.definePrompt({
  name: 'generateBannerPrompt',
  input: {schema: GenerateBannerInputSchema},
  output: {schema: GenerateBannerOutputSchema},
  prompt: `You are an expert banner designer. Please create a banner image based on the following description, text, and resolution. Also provide suggestions to improve the banner.

Description: {{{description}}}
Text: {{{bannerText}}}
Resolution: {{{resolution}}}

{{#each this}}
  {{#if bannerImage}}
  Progress: Banner generated
  Suggestions: Here are some improvement suggestions: {{{improvementSuggestions}}}
  {{/if}}
{{/each}}

`,
});

const improveBannerPrompt = ai.definePrompt({
  name: 'improveBannerPrompt',
  input: {schema: GenerateBannerOutputSchema},
  output: {schema: z.object({improvementSuggestions: z.string()})},
  prompt: `You are an expert consultant on how to improve banners. Given the generated banner and the original description, what suggestions do you have to improve it?

Description: {{{description}}}
Text: {{{bannerText}}}
Resolution: {{{resolution}}}
Generated Banner: {{media url=bannerImage}}

Suggestions:`, 
})

const generateBannerFlow = ai.defineFlow(
  {
    name: 'generateBannerFlow',
    inputSchema: GenerateBannerInputSchema,
    outputSchema: GenerateBannerOutputSchema,
  },
  async input => {
    // Generate the banner image
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a banner image with the following description: ${input.description}, text: ${input.bannerText}, resolution: ${input.resolution}.`, // Simple prompt for image generation
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Failed to generate banner image.');
    }

    // Prepare initial output with the generated banner image
    const initialOutput: GenerateBannerOutput = {
      bannerImage: media.url,
      improvementSuggestions: '', // Initialize as empty, will be populated later
      progress: 'Banner image generated.',
    };

    const description = input.description;
    const bannerText = input.bannerText;
    const resolution = input.resolution;

    const {output: improvementOutput} = await improveBannerPrompt({
        ...initialOutput,
        description,
        bannerText,
        resolution,
    })

    // Call the improveBannerPrompt to get improvement suggestions
    // Update the output with the improvement suggestions
    const finalOutput: GenerateBannerOutput = {
      ...initialOutput,
      improvementSuggestions: improvementOutput!.improvementSuggestions,
    };

    return finalOutput;
  }
);
