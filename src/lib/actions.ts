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

  try {
    const result = await generateBanner({
      description,
      bannerText,
      resolution,
    });

    if (!result.bannerImage) {
      throw new Error('Failed to generate banner image.');
    }

    const bannerData = {
      description,
      bannerText,
      resolution,
      imageUrl: result.bannerImage,
      suggestions: result.improvementSuggestions,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'banners'), bannerData);
    
    return {
      imageUrl: result.bannerImage,
      suggestions: result.improvementSuggestions,
    };
  } catch (error) {
    console.error('Error in generateAndSaveBanner:', error);
    // It's better to throw a more generic error to the client
    throw new Error('An error occurred while generating the banner. Please try again.');
  }
}
