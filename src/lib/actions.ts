
'use server';

import { z } from 'zod';
import { generateBanner } from '@/ai/flows/generate-banner';
import { testApiKey } from '@/ai/flows/api-test';
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

async function tryGenerateBannerWithKey(values: z.infer<typeof formSchema>, apiKey: string): Promise<BannerResult | null> {
  try {
    // First, a quick check to see if the key is valid with a simple text request.
    const testResult = await testApiKey({ apiKey });
    if (!testResult.ok) {
        console.warn(`API key test failed for a key. Trying next key.`);
        return null;
    }

    console.log("API Key is valid, proceeding with banner generation.");

    // If the key is valid, proceed with the more intensive banner generation.
    const result = await generateBanner({
      description: values.description,
      bannerText: values.bannerText,
      resolution: values.resolution,
    }, { apiKey });

    if (!result.bannerImage) {
      console.error('Failed to generate banner image with a key, even after a successful API key test.');
      return null;
    }
    
    return {
      imageUrl: result.bannerImage,
      suggestions: result.improvementSuggestions,
    };
  } catch (error) {
    // This catch block handles errors during either the test or the generation.
    console.warn(`Banner generation process failed with a key. Trying next key.`, error);
    return null;
  }
}

export async function generateAndSaveBanner(values: z.infer<typeof formSchema>): Promise<BannerResult> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error('Invalid input.');
  }

  const { description, bannerText, resolution } = validatedFields.data;

  const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter((key): key is string => Boolean(key)); // Filter out any undefined keys

  if (apiKeys.length === 0) {
    throw new Error('No API keys found. Please add at least one GEMINI_API_KEY to your environment variables.');
  }

  let bannerResult: BannerResult | null = null;

  for (const key of apiKeys) {
    console.log("Attempting to generate banner with a new key...");
    bannerResult = await tryGenerateBannerWithKey(validatedFields.data, key);
    if (bannerResult) {
      console.log("Successfully generated banner.");
      break; 
    }
  }

  if (!bannerResult) {
    throw new Error('All API keys failed or are invalid. Please check your keys and try again.');
  }

  try {
    const bannerData = {
      description,
      bannerText,
      resolution,
      imageUrl: bannerResult.imageUrl,
      suggestions: bannerResult.suggestions,
      createdAt: serverTimestamp(),
    };

    console.log("Saving banner to Firestore...");
    await addDoc(collection(db, 'banners'), bannerData);
    console.log("Banner saved successfully.");
    
    return bannerResult;
  } catch (error) {
    console.error('Error saving banner to Firestore:', error);
    // Still return the result to the user, even if DB save fails.
    // The user cares about the image, not the gallery persistence in this immediate moment.
    return bannerResult;
  }
}
