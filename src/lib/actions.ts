
'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const formSchema = z.object({
  prompt: z.string().min(10),
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
    const { media } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce an output.');
    }

    return {
      imageUrl: media.url,
    };

  } catch (error) {
    console.error(`Fatal error during image generation:`, error);
    throw new Error('Failed to generate image due to a server error.');
  }
}
