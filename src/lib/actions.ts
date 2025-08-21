
'use server';

import { z } from 'zod';
import { generateImage as generateImageFlow, GenerateImageInput } from '@/ai/flows/generate-image';

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  bannerText: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type GenerationResult = {
  imageUrls: string[];
};

export async function generateImage(values: z.infer<typeof formSchema>): Promise<GenerationResult> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid input provided.');
  }

  const { prompt, bannerText, images } = validatedFields.data;

  try {
    const flowInput: GenerateImageInput = { prompt, bannerText, images };
    const imageUrls = await generateImageFlow(flowInput);

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('Image generation failed to produce an output.');
    }

    return {
      imageUrls: imageUrls,
    };

  } catch (error) {
    console.error(`Fatal error during image generation:`, error);
    throw new Error('Failed to generate image due to a server error.');
  }
}
