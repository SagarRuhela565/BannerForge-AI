
'use server';
/**
 * @fileOverview A flow for generating banner prompt suggestions.
 *
 * - generatePromptSuggestions - A function that generates prompt suggestions.
 * - GeneratePromptSuggestionsInput - The input type for the function.
 */

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';

const GeneratePromptSuggestionsInputSchema = z.object({
  bannerText: z.string().describe('The simple text for the banner.'),
});
export type GeneratePromptSuggestionsInput = z.infer<typeof GeneratePromptSuggestionsInputSchema>;

export async function generatePromptSuggestions(input: GeneratePromptSuggestionsInput): Promise<string[]> {
  return generatePromptSuggestionsFlow(input);
}

const promptSuggestionPrompt = ai.definePrompt({
  name: 'promptSuggestionPrompt',
  model: googleAI('gemini-2.5-flash'),
  input: { schema: GeneratePromptSuggestionsInputSchema },
  output: { schema: z.object({ prompts: z.array(z.string()) }) },
  prompt: `You are a world-class expert at writing "mega-prompts" for generative AI image models. Your task is to take a user's simple banner text and generate 3 extremely detailed and descriptive prompts that will produce a high-quality, professional banner.

Each prompt must be a complete recipe, clearly defining all the elements needed for the banner. It should cover:
- **Aesthetic**: The overall look and feel (e.g., vibrant, contemporary, minimalist, corporate).
- **Subject/Imagery**: A clear description of the main visuals, people, objects, or scenes.
- **Composition**: Where elements are placed (e.g., on the left, in the background, bottom right).
- **Color Palette**: The specific colors to be used for backgrounds, text, and accents.
- **Typography**: Describe the style of the font (e.g., big, bold, clean, sans-serif), but do NOT include the actual text to be rendered. The prompt should ask for space for a headline, tagline, etc.

Here is a perfect example of a detailed prompt:
"
"
Design a high-quality, professional, and vibrant educational admission banner with a dynamic, youth-focused, and contemporary aesthetic. The banner should feature a deep purple gradient background that feels both professional and energetic.
A diverse, confident-looking student with a bright smile, wearing a modern, casual outfit, should be walking forward on the left side, carrying a backpack and a stack of books.
The dominant headline, 'Enroll in B.Com tomorrow', should be in a big, bold, clean white font, positioned prominently. Below it, in a smaller white font, is the tagline 'Your Gateway Into a Dynamic Career'.
To the right of the student, a collection of clean, minimalist line-art icons—including a graduation cap, open books, and a university building—should be arranged vertically. Each icon should be clearly labeled with the following information in a readable white font:
9 UG Programs
70 Departments
PG & PhD options
Placement opportunities with top companies (TCS, Amazon, etc.).
A bold, rectangular 'Apply Now' button with rounded corners and a bright, eye-catching yellow color should be prominently placed at the bottom of the banner. The overall composition should be clean, balanced, and energetic, with a modern feel that appeals directly to students."
"

Now, based on the user's banner text below, generate 3 similarly detailed prompts.

User's banner text: {{{bannerText}}}

Return your 3 suggestions in a JSON object with a single key "prompts" which is an array of strings. Do not include any other commentary or explanation.`,
});

const generatePromptSuggestionsFlow = ai.defineFlow(
  {
    name: 'generatePromptSuggestionsFlow',
    inputSchema: GeneratePromptSuggestionsInputSchema,
    outputSchema: z.array(z.string()),
  },
  async (input) => {
    const { output } = await promptSuggestionPrompt(input);
    if (!output?.prompts) {
      return [];
    }
    return output.prompts;
  }
);
