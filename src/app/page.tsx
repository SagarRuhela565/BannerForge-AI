
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateImage } from "@/lib/actions";

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  resolution: z.string({
    required_error: "Please select a resolution.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type GenerationResult = {
  imageUrl: string;
};

export default function ImageGenerationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      resolution: "16:9",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const generationResult = await generateImage({
        prompt: values.prompt,
        resolution: values.resolution,
      });
      setResult(generationResult);
    } catch (error) {
      console.error("Error during image generation:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center w-full mb-12">
        <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">
          Text-to-Image Generation
        </h1>
        <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
          Describe the image you want to create.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Create Your Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A majestic lion wearing a crown, photorealistic, 4k"
                          className="resize-y min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolution</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a resolution" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1:1">Square (1:1)</SelectItem>
                          <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                          <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Generating your image...</p>
              <p className="text-sm text-muted-foreground">This may take a moment.</p>
            </div>
          )}

          {result && !isLoading && (
            <Image
              src={result.imageUrl}
              alt="Generated Image"
              width={1024}
              height={576}
              className="relative w-full h-auto rounded-lg border object-cover"
            />
          )}
        </div>
      </div>
    </main>
  );
}
