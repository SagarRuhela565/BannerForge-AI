'use server';

/**
 * @fileOverview Generates a banner image based on a description, text, and resolution.
 *
 * - generateBanner - A function that generates a banner image.
 * - GenerateBannerInput - The input type for the generateBanner function.
 * - GenerateBannerOutput - The return type for the generateBanner function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
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

type FlowOptions = {
    apiKey?: string;
}

export async function generateBanner(input: GenerateBannerInput, options?: FlowOptions): Promise<GenerateBannerOutput> {
  const ai = genkit({
    plugins: [
        googleAI({apiKey: options?.apiKey})
    ]
  });

  const improveBannerPrompt = ai.definePrompt({
    name: 'improveBannerPrompt',
    input: {schema: z.object({
      description: GenerateBannerInputSchema.shape.description,
      bannerText: GenerateBannerInputSchema.shape.bannerText,
      resolution: GenerateBannerInputSchema.shape.resolution,
      bannerImage: GenerateBannerOutputSchema.shape.bannerImage,
    })},
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
        prompt: `Generate a banner image with the following description: "${input.description}", with the text "${input.bannerText}" prominently displayed. The resolution should be ${input.resolution}.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Failed to generate banner image.');
      }

      const {output: improvementOutput} = await improveBannerPrompt({
          bannerImage: media.url,
          description: input.description,
          bannerText: input.bannerText,
          resolution: input.resolution,
      })

      // Update the output with the improvement suggestions
      const finalOutput: GenerateBannerOutput = {
        bannerImage: media.url,
        improvementSuggestions: improvementOutput!.improvementSuggestions,
      };

      return finalOutput;
    }
  );

  return generateBannerFlow(input);
}