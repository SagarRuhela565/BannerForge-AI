
'use server';

import { z } from 'zod';
import { generateSuggestions } from '@/ai/flows/generate-banner';
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

  console.log('Starting banner generation process with:', values);

  try {
    // Step 1: Generate design suggestions first.
    const suggestionsResult = await generateSuggestions({ description, bannerText });
    if (!suggestionsResult || !suggestionsResult.improvementSuggestions) {
      throw new Error('Failed to generate suggestions.');
    }
    const bannerSuggestions = suggestionsResult.improvementSuggestions;
    console.log('Successfully generated suggestions.');

    // Step 2: Create a more detailed image prompt using the suggestions.
    const imagePrompt = `Create a high-quality banner with the text "${bannerText}". The desired style is: "${description}". The resolution must be ${resolution}. For inspiration, consider these design suggestions: ${bannerSuggestions}`;

    // Step 3: Generate the image.
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
    console.log('Successfully generated image.');

    // Step 4: Save the complete banner record to Firestore.
    try {
      await addDoc(collection(db, "banners"), {
        description,
        bannerText,
        resolution,
        imageUrl: bannerImageUrl,
        suggestions: bannerSuggestions,
        createdAt: serverTimestamp(),
      });
      console.log("Successfully saved banner to Firestore.");
    } catch (error) {
      console.error("Error saving banner to Firestore:", error);
      // We don't re-throw here because the core task (generation) succeeded.
      // The user still gets their banner, but we log the persistence error.
    }

    // Step 5: Return the result to the client.
    return {
      imageUrl: bannerImageUrl,
      suggestions: bannerSuggestions,
    };

  } catch (error) {
    console.error(`Fatal error during banner generation flow:`, error);
    // Re-throw a user-friendly error to be caught by the client.
    throw new Error('An unexpected error occurred on the server during banner generation.');
  }
}
