
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Sparkles, Loader2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateImage } from "@/lib/actions";

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type GenerationResult = {
  imageUrls: string[];
};

export default function ImageGenerationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "banner.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the image. Please try again.",
      });
    }
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const generationResult = await generateImage({
        prompt: values.prompt,
      });
      setResult(generationResult);
    } catch (error) {
      console.error("Error during image generation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
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
          AI Banner Generator
        </h1>
        <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
          Describe the banner you want to create. We'll generate 3 options for
          you!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Create Your Banner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A futuristic cityscape at sunset for a tech conference banner"
                          className="resize-y min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
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
                      Generate Banners
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="w-full">
          {isLoading && (
            <div className="w-full aspect-video flex items-center justify-center p-4 border rounded-lg bg-muted/40">
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Generating your banners...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a moment.
                </p>
              </div>
            </div>
          )}

          {result && !isLoading && (
             <div className="flex flex-col gap-4">
              {result.imageUrls.map((url, index) => (
                <div key={index} className="relative group w-full aspect-video">
                  <Image
                    src={url}
                    alt={`Generated Banner ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDownload(url)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !result && (
            <div className="w-full aspect-video flex items-center justify-center p-4 border rounded-lg bg-muted/40">
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <p>Your generated banners will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
