
'use server';

/**
 * @fileOverview Generates a banner image based on a description, text, and resolution, and provides improvement suggestions.
 *
 * - generateBanner - A function that generates a banner image and suggestions.
 * - GenerateBannerInput - The input type for the generateBanner function.
 * - GenerateBannerOutput - The return type for the generateBanner function.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateBannerInputSchema = z.object({
  description: z.string().describe('A detailed description of the banner style.'),
  bannerText: z.string().describe('The specific text to be displayed on the banner.'),
  resolution: z.string().describe('The desired resolution of the banner (e.g., 1920x1080).'),
});

export type GenerateBannerInput = z.infer<typeof GenerateBannerInputSchema>;

const GenerateBannerOutputSchema = z.object({
  bannerImage: z.string().describe('The generated banner image as a data URI.'),
  improvementSuggestions: z
    .string()
    .describe('Suggestions for improving the banner design.'),
});

export type GenerateBannerOutput = z.infer<typeof GenerateBannerOutputSchema>;

type FlowOptions = {
    apiKey?: string;
}

export async function generateBanner(input: GenerateBannerInput, options?: FlowOptions): Promise<GenerateBannerOutput> {
  const ai = genkit({
    plugins: [
        googleAI({apiKey: options?.apiKey})
    ]
  });

  const generateBannerAndSuggestionsPrompt = ai.definePrompt({
    name: 'generateBannerAndSuggestionsPrompt',
    input: {schema: GenerateBannerInputSchema},
    output: {schema: GenerateBannerOutputSchema},
    prompt: `You are an expert graphic designer. Your task is to generate a banner image and then provide suggestions for how to improve it.

First, generate a banner image with the following specifications:
- Description: "{{description}}"
- Text: "{{bannerText}}"
- Resolution: {{resolution}}

After generating the image, provide a list of suggestions to improve the banner's design, typography, color scheme, and overall impact.

The output must be a JSON object with two keys: "bannerImage" (the data URI of the generated image) and "improvementSuggestions" (a string containing your suggestions).
`,
    // Note: We are not using the 'output.schema' to directly generate the image and text in one go with a multimodal model,
    // as that can be less reliable. Instead, we'll call the image generation model first, then the text model for suggestions.
    // The prompt above is a conceptual guide for the flow's logic.
  });


  const generateBannerFlow = ai.defineFlow(
    {
      name: 'generateBannerFlow',
      inputSchema: GenerateBannerInputSchema,
      outputSchema: GenerateBannerOutputSchema,
    },
    async (input) => {
      // Step 1: Generate the banner image.
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Generate a banner image. Style: "${input.description}". Prominently display this text: "${input.bannerText}". Resolution: ${input.resolution}.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Failed to generate banner image.');
      }
      
      const bannerImageUri = media.url;

      // Step 2: Generate improvement suggestions based on the original request and the generated image.
      const { text } = await ai.generate({
          model: 'googleai/gemini-2.0-flash',
          prompt: `You are an expert design consultant. A banner was just created based on the user's request.
          
          User's Request:
          - Description: "${input.description}"
          - Text: "${input.bannerText}"
          
          Here is the generated banner: {{media url=bannerImage}}

          Please provide 3-4 actionable suggestions to improve the banner's design. Focus on aspects like layout, color harmony, typography, and imagery. Present the suggestions as a bulleted or numbered list.`,
          media: { bannerImage: { url: bannerImageUri } }
      });


      const finalOutput: GenerateBannerOutput = {
        bannerImage: bannerImageUri,
        improvementSuggestions: text,
      };

      return finalOutput;
    }
  );

  return generateBannerFlow(input);
}
