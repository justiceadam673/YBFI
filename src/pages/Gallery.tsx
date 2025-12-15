import { useState, useEffect } from "react";
import { Lock, Plus, Image as ImageIcon, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import image1 from "@/assets/gallery/youth-outdoor-1.jpg";
import image2 from "@/assets/gallery/youth-outdoor-2.jpg";
import image3 from "@/assets/gallery/youth-outdoor-3.jpg";
import image4 from "@/assets/gallery/youth-indoor-1.jpg";
import image5 from "@/assets/gallery/speaker.jpg";
import image6 from "@/assets/gallery/mentoring.jpg";
import image7 from "@/assets/gallery/prayer.jpg";

const galleryImages = [
  { src: image1, alt: "Youth fellowship outdoor activity", title: "Community Gathering" },
  { src: image2, alt: "Young people celebrating together", title: "Unity & Joy" },
  { src: image3, alt: "Youth mentoring session", title: "Growing Together" },
  { src: image4, alt: "Indoor fellowship", title: "Fellowship Time" },
  { src: image5, alt: "Youth speaker sharing message", title: "Inspiring Messages" },
  { src: image6, alt: "One-on-one mentoring", title: "Personal Mentorship" },
  { src: image7, alt: "Youth in prayer", title: "Faith & Prayer" },
];

const Gallery = () => {
  const [dbImages, setDbImages] = useState<Array<{ id: string; image_url: string; title: string | null }>>([]);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newImage, setNewImage] = useState({ title: "", file: null as File | null });

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    const { data } = await supabase
      .from('gallery_images')
      .select('id, image_url, title')
      .order('created_at', { ascending: false });

    if (data) setDbImages(data);
  };

  const verifyPassword = async () => {
    const { data } = await supabase.functions.invoke('verify-admin-password', {
      body: { password: adminPassword, action: 'messages_gallery' }
    });

    if (data?.valid) {
      setIsAuthenticated(true);
      toast({ title: "Access granted" });
    } else {
      toast({ title: "Invalid password", variant: "destructive" });
    }
  };

  const convertToJpg = async (file: File): Promise<Blob> => {
    try {
      if ('createImageBitmap' in window) {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        ctx.drawImage(bitmap, 0, 0);
        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob((b) => res(b), 'image/jpeg', 0.95)
        );
        if (!blob) throw new Error('Failed to convert image');
        return blob;
      }
    } catch (e) {
      // Fallback below
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, 'image/jpeg', 0.95);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to decode image'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUploadImage = async () => {
    if (!newImage.file) {
      toast({ title: "Please select an image", variant: "destructive" });
      return;
    }

    try {
      const original = newImage.file;
      const ext = original.name.split('.').pop()?.toLowerCase() || '';
      const isJpeg = original.type === 'image/jpeg' || ext === 'jpg' || ext === 'jpeg';

      if (original.type === 'image/heic' || original.type === 'image/heif') {
        toast({
          title: "Unsupported image format",
          description: "Please upload a JPG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      const baseFileName = original.name.replace(/\.[^/.]+$/, "");
      const fileName = `${Date.now()}-${baseFileName}.jpg`;

      const blobToUpload = isJpeg ? original : await convertToJpg(original);

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, blobToUpload, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        toast({ title: "Error uploading image", variant: "destructive" });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('gallery_images')
        .insert([{ image_url: publicUrl, title: newImage.title || null }]);

      if (error) {
        toast({ title: "Error saving image", variant: "destructive" });
      } else {
        toast({ title: "Image uploaded successfully as JPG" });
        setNewImage({ title: "", file: null });
        setIsAdminDialogOpen(false);
        setIsAuthenticated(false);
        setAdminPassword("");
        fetchGalleryImages();
      }
    } catch (error) {
      console.error('Error converting image:', error);
      toast({ title: "Error converting image to JPG", variant: "destructive" });
    }
  };

  const allImages = [
    ...dbImages.map(img => ({ src: img.image_url, alt: img.title || "Gallery image", title: img.title || "Untitled" })),
    ...galleryImages
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Memories & Moments
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
                Our <span className="text-gradient">Gallery</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Moments of growth, fellowship, and community captured in time
              </p>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-12 container mx-auto px-4">
          <div className="mb-8 flex justify-end">
            <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 hover:shadow-elegant transition-all">
                  <Plus className="w-4 h-4" />
                  Upload Image
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-xl">Upload Gallery Image</DialogTitle>
                </DialogHeader>
                {!isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Enter password to continue</span>
                    </div>
                    <Input
                      type="password"
                      placeholder="Admin Password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
                      className="border-border/50"
                    />
                    <Button onClick={verifyPassword} className="w-full">Verify</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      placeholder="Image Title (optional)"
                      value={newImage.title}
                      onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                      className="border-border/50"
                    />
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setNewImage({ ...newImage, file: e.target.files?.[0] || null })}
                      className="border-border/50"
                    />
                    <Button onClick={handleUploadImage} className="w-full">Upload Image</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {allImages.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No images in the gallery yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allImages.map((image, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl shadow-elegant hover:shadow-gold transition-all duration-500 animate-fade-in aspect-square"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-6">
                    <h3 className="text-background font-bold text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{image.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;