
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
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid input.');
  }
  
  const { description, bannerText, resolution } = validatedFields.data;

  console.log("Attempting to generate banner...");

  const bannerResult = await generateBanner({
    description,
    bannerText,
    resolution
  });

  if (!bannerResult || !bannerResult.bannerImage) {
    throw new Error('Banner generation failed.');
  }

  try {
    const bannerData = {
      description,
      bannerText,
      resolution,
      imageUrl: bannerResult.bannerImage,
      suggestions: bannerResult.improvementSuggestions,
      createdAt: serverTimestamp(),
    };

    console.log("Saving banner to Firestore...");
    await addDoc(collection(db, 'banners'), bannerData);
    console.log("Banner saved successfully.");
    
    return {
        imageUrl: bannerResult.bannerImage,
        suggestions: bannerResult.improvementSuggestions,
    };
  } catch (error) {
    console.error('Error saving banner to Firestore:', error);
    // Still return the result to the user, even if DB save fails.
    return {
        imageUrl: bannerResult.bannerImage,
        suggestions: bannerResult.improvementSuggestions,
    };
  }
}
