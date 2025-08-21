
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
    const testResult = await testApiKey({ apiKey });
    if (!testResult.ok) {
        console.warn(`API key test failed for a key. Trying next key.`);
        return null;
    }

    console.log("API Key is valid, proceeding with banner generation.");

    const result = await generateBanner({
      description: values.description,
      bannerText: values.bannerText,
      resolution: values.resolution,
    }, { apiKey });

    if (!result.bannerImage) {
      console.error('Failed to generate banner image with a key.');
      return null;
    }
    
    return {
      imageUrl: result.bannerImage,
      suggestions: result.improvementSuggestions,
    };
  } catch (error) {
    console.warn(`Banner generation failed with a key. Trying next key.`, error);
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
  ];

  let bannerResult: BannerResult | null = null;

  for (const key of apiKeys) {
    if (key) {
        bannerResult = await tryGenerateBannerWithKey(validatedFields.data, key);
        if (bannerResult) {
          break; 
        }
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

    await addDoc(collection(db, 'banners'), bannerData);
    
    return bannerResult;
  } catch (error) {
    console.error('Error saving banner to Firestore:', error);
    throw new Error('An error occurred while saving the banner. Please try again.');
  }
}
