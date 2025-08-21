
'use server';

import { z } from 'zod';
import { generateImage as generateImageFlow, GenerateImageInput } from '@/ai/flows/generate-image';

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
});

export type GenerationResult = {
  imageUrl: string;
};

export async function generateImage(values: z.infer<typeof formSchema>): Promise<GenerationResult> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid input provided.');
  }

  const { prompt } = validatedFields.data;

  try {
    const flowInput: GenerateImageInput = { prompt };
    const imageUrl = await generateImageFlow(flowInput);

    if (!imageUrl) {
      throw new Error('Image generation failed to produce an output.');
    }

    return {
      imageUrl: imageUrl,
    };

  } catch (error) {
    console.error(`Fatal error during image generation:`, error);
    throw new Error('Failed to generate image due to a server error.');
  }
}
