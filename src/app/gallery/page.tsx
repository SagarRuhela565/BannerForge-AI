
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

type Banner = {
  id: string;
  description: string;
  bannerText: string;
  resolution: string;
  imageUrl: string;
  createdAt: any;
};

export default function GalleryPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bannersCollection = collection(db, "banners");
        const q = query(bannersCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const bannersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Banner[];
        setBanners(bannersData);
      } catch (err) {
        console.error("Error fetching banners:", err);
        setError("Failed to load the gallery. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-accent text-transparent bg-clip-text">
              Banner Gallery
            </h1>
            <p className="mt-2 text-lg text-foreground/80">
              A collection of your masterpiece banners.
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && banners.length === 0 && (
         <div className="text-center text-foreground/80">
          <p>Your gallery is empty. Go ahead and create your first banner!</p>
        </div>
      )}

      {!isLoading && !error && banners.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video relative w-full overflow-hidden">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.bannerText}
                    fill
                    className="object-cover"
                  />
                </div>
                 <div className="p-4">
                  <h3 className="font-bold truncate" title={banner.bannerText}>{banner.bannerText}</h3>
                  <p className="text-sm text-muted-foreground truncate" title={banner.description}>{banner.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(banner.createdAt?.toDate()).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
