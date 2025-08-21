
'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from './firebase';

const formSchema = z.object({
  description: z.string().min(10).max(500),
  bannerText: z.string().min(1).max(100),
  resolution: z.string(),
});

export type BannerResult = {
  imageUrl: string;
  suggestions: string;
};

export async function generateAndSaveBanner(values: z.infer<typeof formSchema>): Promise<BannerResult> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Invalid input fields for banner generation:', validatedFields.error);
    throw new Error('Invalid input provided.');
  }

  const { description, bannerText, resolution } = validatedFields.data;

  try {
    const imagePrompt = `Create a high-quality banner with the text "${bannerText}". The desired style is: "${description}". The resolution must be ${resolution}.`;
    const bannerSuggestions = "Design suggestions feature is currently under development.";

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: imagePrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce an output.');
    }
    const bannerImageUrl = media.url;

    try {
      await addDoc(collection(db, "banners"), {
        description,
        bannerText,
        resolution,
        imageUrl: bannerImageUrl,
        suggestions: bannerSuggestions,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving banner to Firestore:", error);
    }

    return {
      imageUrl: bannerImageUrl,
      suggestions: bannerSuggestions,
    };

  } catch (error) {
    console.error(`Fatal error during banner generation flow:`, error);
    throw new Error('Failed to generate banner due to a server error. Please check the logs.');
  }
}
