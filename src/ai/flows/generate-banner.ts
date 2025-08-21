
'use server';

/**
 * @fileOverview Generates improvement suggestions for a banner based on a description and text.
 *
 * - generateSuggestions - A function that generates design suggestions.
 * - GenerateSuggestionsInput - The input type for the generateSuggestions function.
 * - GenerateSuggestionsOutput - The return type for the generateSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSuggestionsInputSchema = z.object({
  description: z.string().describe('A detailed description of the banner style.'),
  bannerText: z.string().describe('The specific text to be displayed on the banner.'),
});
export type GenerateSuggestionsInput = z.infer<typeof GenerateSuggestionsInputSchema>;

const GenerateSuggestionsOutputSchema = z.object({
  improvementSuggestions: z
    .string()
    .describe('Suggestions for improving the banner design, formatted as a bulleted or numbered list.'),
});
export type GenerateSuggestionsOutput = z.infer<typeof GenerateSuggestionsOutputSchema>;


export async function generateSuggestions(input: GenerateSuggestionsInput): Promise<GenerateSuggestionsOutput> {
  return suggestionsFlow(input);
}

const suggestionsPrompt = ai.definePrompt({
    name: 'suggestionsPrompt',
    input: { schema: GenerateSuggestionsInputSchema },
    output: { schema: GenerateSuggestionsOutputSchema },

    prompt: `You are an expert design consultant.
      
      Your task is to provide expert design feedback based on the user's request.
      
      **Request Details:**
      - **Style Description:** "{{description}}"
      - **Banner Text:** "{{bannerText}}"

      **Instructions:**
      1.  **Provide Suggestions:** Provide 3-4 actionable suggestions for improving a banner with the above details. Focus on aspects like layout, color harmony, typography, and imagery.
      2.  **Format Output:** Present the suggestions as a bulleted or numbered list. Your response must only contain the list.
      `,
});


const suggestionsFlow = ai.defineFlow(
  {
    name: 'suggestionsFlow',
    inputSchema: GenerateSuggestionsInputSchema,
    outputSchema: GenerateSuggestionsOutputSchema,
  },
  async (input) => {
    
    const result = await suggestionsPrompt(input);
    const output = result.output;

    if (!output) {
      throw new Error('Suggestion generation failed to produce an output.');
    }
    
    return output;
  }
);
