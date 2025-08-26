
'use server';

import { z } from 'zod';
import { generateImage as generateImageFlow, GenerateImageInput } from '@/ai/flows/generate-image';
import { generatePromptSuggestions as generatePromptSuggestionsFlow, GeneratePromptSuggestionsInput } from '@/ai/flows/generate-prompt-suggestions';

const generateFormSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  // images: z.array(z.string()).optional(),
  // logo: z.string().optional(),
  // bannerText: z.string().optional(),
});


export async function generateImage(values: z.infer<typeof generateFormSchema>): Promise<string[]> {
  const validatedFields = generateFormSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid input provided.');
  }

  const { prompt } = validatedFields.data;

  try {
    const flowInput: GenerateImageInput = { prompt };
    const imageUrls = await generateImageFlow(flowInput);

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('Image generation failed to produce an output.');
    }

    return imageUrls;

  } catch (error) {
    console.error(`Fatal error during image generation:`, error);
    throw new Error('Failed to generate image due to a server error.');
  }
}

const suggestionFormSchema = z.object({
  bannerText: z.string().min(3, { message: "Banner text must be at least 3 characters." }),
});

export async function generatePromptSuggestions(values: z.infer<typeof suggestionFormSchema>): Promise<string[]> {
  const validatedFields = suggestionFormSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid input for prompt suggestion.');
  }

  const { bannerText } = validatedFields.data;

  try {
    const flowInput: GeneratePromptSuggestionsInput = { bannerText };
    const suggestions = await generatePromptSuggestionsFlow(flowInput);
    
    if (!suggestions || suggestions.length === 0) {
      throw new Error('Prompt suggestion failed to produce an output.');
    }

    return suggestions;
  } catch (error) {
    console.error(`Fatal error during prompt suggestion:`, error);
    throw new Error('Failed to generate prompt suggestions due to a server error.');
  }
}
