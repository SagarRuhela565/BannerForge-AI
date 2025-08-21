
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Image as ImageIcon, Lightbulb, Loader2, Library } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateAndSaveBanner } from "@/lib/actions";

const formSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must not be longer than 500 characters."
  }),
  bannerText: z.string().min(1, {
    message: "Banner text is required.",
  }).max(100, {
    message: "Banner text must not be longer than 100 characters."
  }),
  resolution: z.string({
    required_error: "Please select a resolution.",
  }),
});

type BannerFormValues = z.infer<typeof formSchema>;

type BannerResult = {
  imageUrl: string;
  suggestions: string;
};

export default function BannerForgePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BannerResult | null>(null);
  const { toast } = useToast();

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      bannerText: "",
      resolution: "1920x1080",
    },
  });

  async function onSubmit(values: BannerFormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const bannerResult = await generateAndSaveBanner(values);
      setResult(bannerResult);
    } catch (error) {
      console.error("Error during banner generation:", error);
      const errorMessage = error instanceof Error ? error.message : "There was a problem with your request. Please try again.";
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
      <div className="flex items-start justify-between mb-12">
        <div className="text-center w-full">
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-accent text-transparent bg-clip-text">
            BannerForge AI
          </h1>
          <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
            Craft the perfect banner in seconds. Describe your vision, and let our AI bring it to life with stunning visuals and expert suggestions.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/gallery">
            <Library />
            View Gallery
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Create Your Banner
            </CardTitle>
            <CardDescription className="font-body">
              Fill out the details below to generate your custom banner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Style Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., A minimalist design with a pastel color palette, geometric shapes, and a futuristic feel."
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
                  name="bannerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Grand Opening Sale"
                          className="resize-y"
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
                          <SelectItem value="1920x1080">1920x1080 (16:9)</SelectItem>
                          <SelectItem value="1280x720">1280x720 (16:9)</SelectItem>
                          <SelectItem value="1080x1080">1080x1080 (1:1)</SelectItem>
                          <SelectItem value="1080x1350">1080x1350 (4:5)</SelectItem>
                          <SelectItem value="1200x628">1200x628 (Facebook)</SelectItem>
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
                      Forge Banner
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Generating...</CardTitle>
                <CardDescription>Our AI is crafting your masterpiece. Please wait.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </CardContent>
            </Card>
          )}

          {result && !isLoading && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-primary" />
                    Your Banner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative w-full overflow-hidden rounded-lg border">
                    <Image
                      src={result.imageUrl}
                      alt="Generated Banner"
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint="banner design"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-primary" />
                    Improvement Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap font-body">
                    {result.suggestions}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
