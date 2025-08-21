
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
  refinement: z.string().min(5, 'Suggestion must be at least 5 characters.').max(500),
});

export type BannerResult = {
  imageUrl: string;
  suggestions: string;
};

// This is a shared utility function to avoid code duplication
async function generateAndSaveBannerInternal(
    values: z.infer<typeof formSchema> & { refinement?: string }
): Promise<BannerResult> {
    const { description, bannerText, resolution, refinement } = values;

    console.log('Starting banner generation process with input:', values);

    try {
        const suggestionsResult = await generateSuggestions({ description, bannerText, refinement });
        if (!suggestionsResult || !suggestionsResult.improvementSuggestions) {
            throw new Error('Failed to generate suggestions.');
        }
        console.log('Suggestions generated.');

        const imagePrompt = `Create a high-quality banner image with the text "${bannerText}". The style should be: "${description}". ${
            refinement ? `Refinement suggestion: "${refinement}".` : ''
        } The resolution must be ${resolution}.`;

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
                refinement: refinement || null,
            });
            console.log("Banner saved to Firestore");
        } catch (error) {
            console.error("Error saving banner to Firestore:", error);
            // We don't throw here, as the banner was still generated successfully.
            // The user can still see the result, but we should log this server-side.
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
      console.error('Invalid input fields for generate:', validatedFields.error);
      throw new Error('Invalid input.');
  }
  
  return generateAndSaveBannerInternal(validatedFields.data);
}

export async function refineAndSaveBanner(values: z.infer<typeof refineFormSchema>): Promise<BannerResult> {
  const validatedFields = refineFormSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Invalid input fields for refine:', validatedFields.error);
    throw new Error('Invalid input for refinement.');
  }

  return generateAndSaveBannerInternal(validatedFields.data);
}

