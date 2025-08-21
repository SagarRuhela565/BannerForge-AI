
'use server';

import { z } from 'zod';
import { generateBanner } from '@/ai/flows/generate-banner';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters.').max(500),
  bannerText: z.string().min(1, 'Banner text is required.').max(100),
  resolution: z.string(),
});

export type BannerResult = {
  imageUrl: string;
  suggestions: string;
};


export async function generateAndSaveBanner(values: z.infer<typeof formSchema>): Promise<BannerResult> {
  console.log('Starting banner generation process...');
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    console.error('Invalid input fields:', validatedFields.error);
    throw new Error('Invalid input.');
  }
  
  const { description, bannerText, resolution } = validatedFields.data;
  
  console.log('Input validated. Calling generateBanner flow...');

  try {
      const bannerResult = await generateBanner({
        description,
        bannerText,
        resolution
      });

      if (!bannerResult || !bannerResult.bannerImage) {
        console.error('Banner generation returned an empty result.');
        throw new Error('Banner generation failed.');
      }
      
      console.log("Banner generated successfully. Saving to Firestore...");
      
      try {
        const bannerData = {
          description,
          bannerText,
          resolution,
          imageUrl: bannerResult.bannerImage,
          suggestions: bannerResult.improvementSuggestions,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'banners'), bannerData);
        console.log("Banner saved successfully to Firestore.");
      } catch (dbError) {
        console.error('Error saving banner to Firestore:', dbError);
        // Do not block user, just log the error. The banner is still generated.
      }
      
      return {
          imageUrl: bannerResult.bannerImage,
          suggestions: bannerResult.improvementSuggestions,
      };

  } catch (error) {
    console.error(`Fatal error during banner generation flow:`, error);
    // Re-throw the error to be caught by the client.
    throw new Error('Failed to generate banner due to a server error.');
  }
}
