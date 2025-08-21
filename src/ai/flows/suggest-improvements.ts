'use server';
/**
 * @fileOverview This file contains the Genkit flow for providing banner improvement suggestions.
 *
 * - getBannerImprovementSuggestions - A function that generates suggestions for improving a banner design.
 * - BannerImprovementInput - The input type for the getBannerImprovementSuggestions function.
 * - BannerImprovementOutput - The return type for the getBannerImprovementSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BannerImprovementInputSchema = z.object({
  bannerDescription: z
    .string()
    .describe('A detailed description of the banner style.'),
  bannerText: z.string().describe('The specific text displayed on the banner.'),
  bannerResolution: z.string().describe('The resolution of the banner.'),
  generatedBanner: z
    .string()
    .describe(
      'The generated banner image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type BannerImprovementInput = z.infer<typeof BannerImprovementInputSchema>;

const BannerImprovementOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions for improving the banner design.'),
});
export type BannerImprovementOutput = z.infer<typeof BannerImprovementOutputSchema>;

export async function getBannerImprovementSuggestions(
  input: BannerImprovementInput
): Promise<BannerImprovementOutput> {
  return bannerImprovementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'bannerImprovementPrompt',
  input: {schema: BannerImprovementInputSchema},
  output: {schema: BannerImprovementOutputSchema},
  prompt: `You are an expert banner design consultant. Given the following information about a generated banner, provide suggestions on how to improve its design.

Banner Description: {{{bannerDescription}}}
Banner Text: {{{bannerText}}}
Banner Resolution: {{{bannerResolution}}}
Generated Banner: {{media url=generatedBanner}}

Suggestions:`,
});

const bannerImprovementFlow = ai.defineFlow(
  {
    name: 'bannerImprovementFlow',
    inputSchema: BannerImprovementInputSchema,
    outputSchema: BannerImprovementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
