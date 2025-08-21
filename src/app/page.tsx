
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Sparkles, Loader2, Download, Upload, X as XIcon } from "lucide-react";

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
import { Input } from "@/components/ui/input";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  bannerText: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type GenerationResult = {
  imageUrls: string[];
};

export default function ImageGenerationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      bannerText: "",
      images: [],
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (files.length + imagePreviews.length > MAX_FILES) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: `You can only upload a maximum of ${MAX_FILES} images.`,
      });
      return;
    }

    const newPreviews: string[] = [];
    const newImageData: string[] = form.getValues("images") || [];

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `"${file.name}" is larger than the 4MB limit.`,
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if(dataUrl) {
          newPreviews.push(dataUrl);
          newImageData.push(dataUrl);
          if (newImageData.length === (form.getValues("images")?.length || 0) + files.length) {
            setImagePreviews(current => [...current, ...newPreviews]);
            form.setValue("images", newImageData);
          }
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    const newImageData = [...(form.getValues("images") || [])];

    newPreviews.splice(index, 1);
    newImageData.splice(index, 1);

    setImagePreviews(newPreviews);
    form.setValue("images", newImageData);
  };

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
        bannerText: values.bannerText,
        images: values.images,
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
          Describe the banner you want to create. Upload up to 3 reference images for inspiration. We'll generate 3 options for you!
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

                <FormField
                  control={form.control}
                  name="bannerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Text (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 'Innovate. Create. Inspire.'"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="images"
                  render={() => (
                    <FormItem>
                      <FormLabel>Reference Images (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative border-dashed border-2 border-muted rounded-lg p-4 text-center">
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Drag & drop or click to upload
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Up to {MAX_FILES} images, 4MB each.
                          </p>
                          <Input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/png, image/jpeg, image/webp"
                            multiple
                            onChange={handleFileChange}
                            disabled={imagePreviews.length >= MAX_FILES}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={src}
                          alt={`Reference image ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-auto object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
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
