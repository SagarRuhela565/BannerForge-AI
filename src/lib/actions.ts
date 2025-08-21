
'use server';

import { z } from 'zod';
import { generateSuggestions } from '@/ai/flows/generate-banner';
import { ai } from '@/ai/genkit';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from './firebase';

const formSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500),
  bannerText: z.string().min(1, 'Banner text is required.').max(100),
  resolution: z.string(),
});

const refineFormSchema = formSchema.extend({
    refinement: z.string().min(5).max(500),
});

export type BannerResult = {
  imageUrl: string;
  suggestions: string;
};


async function generateBanner(description: string, bannerText: string, resolution: string, refinement?: string): Promise<BannerResult> {
  console.log('Starting banner generation process...');

  try {
      // Step 1: Generate suggestions using the reliable text model.
      const suggestionsResult = await generateSuggestions({ description, bannerText, refinement });
      if (!suggestionsResult || !suggestionsResult.improvementSuggestions) {
          throw new Error('Failed to generate suggestions.');
      }
      console.log('Suggestions generated.');

      // Step 2: Generate the image using the dedicated image model.
      let imagePrompt = `Create a high-quality banner image with the text "${bannerText}". The style should be: "${description}". The resolution must be ${resolution}.`;
      if (refinement) {
        imagePrompt += ` Please apply this refinement: "${refinement}"`;
      }
      
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
      console.log('Image generated.');

      const bannerImageUrl = media.url;
      const bannerSuggestions = suggestionsResult.improvementSuggestions;

      try {
        await addDoc(collection(db, "banners"), {
          description,
          bannerText,
          resolution,
          imageUrl: bannerImageUrl,
          suggestions: bannerSuggestions,
          createdAt: serverTimestamp(),
        });
        console.log("Banner saved to Firestore");
      } catch (error) {
        console.error("Error saving banner to Firestore:", error);
        // We don't throw here, as the banner was still generated successfully.
        // The user can still see the result.
      }
      
      return {
          imageUrl: bannerImageUrl,
          suggestions: bannerSuggestions,
      };

  } catch (error) {
    console.error(`Fatal error during banner generation flow:`, error);
    // Re-throw the error to be caught by the client.
    throw new Error('Failed to generate banner due to a server error.');
  }
}

export async function generateAndSaveBanner(values: z.infer<typeof formSchema>): Promise<BannerResult> {
    const validatedFields = formSchema.safeParse(values);

    if (!validatedFields.success) {
        console.error('Invalid input fields:', validatedFields.error);
        throw new Error('Invalid input.');
    }
    const { description, bannerText, resolution } = validatedFields.data;
    return generateBanner(description, bannerText, resolution);
}

export async function refineBanner(values: z.infer<typeof refineFormSchema>): Promise<BannerResult> {
    const validatedFields = refineFormSchema.safe_parse(values);
    
    if (!validatedFields.success) {
        console.error('Invalid input fields for refinement:', validatedFields.error);
        throw new Error('Invalid input for refinement.');
    }
    const { description, bannerText, resolution, refinement } = validatedFields.data;
    return generateBanner(description, bannerText, resolution, refinement);
}
