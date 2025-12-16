import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, BookOpen, Upload, MessageSquare, Star, Sparkles, Library, User } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url: string;
  file_url: string;
  created_at: string;
}

const Books = () => {
  const { user, profile } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [reviewingBook, setReviewingBook] = useState<Book | null>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const queryClient = useQueryClient();

  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (user?.email) return user.email.split('@')[0];
    return "";
  };

  const { data: books, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Book[];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", reviewingBook?.id],
    queryFn: async () => {
      if (!reviewingBook) return [];
      const { data, error } = await supabase
        .from("book_reviews")
        .select("*")
        .eq("book_id", reviewingBook.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!reviewingBook,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!coverImage || !bookFile) {
        throw new Error("Please select both cover image and book file");
      }

      const coverExt = coverImage.name.split(".").pop();
      const coverPath = `${crypto.randomUUID()}.${coverExt}`;
      const { error: coverError } = await supabase.storage
        .from("book-covers")
        .upload(coverPath, coverImage);

      if (coverError) throw coverError;

      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from("book-covers")
        .getPublicUrl(coverPath);

      const fileExt = bookFile.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      const { error: fileError } = await supabase.storage
        .from("book-files")
        .upload(filePath, bookFile);

      if (fileError) throw fileError;

      const { data: { publicUrl: fileUrl } } = supabase.storage
        .from("book-files")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("books").insert({
        title,
        author,
        description: "",
        cover_image_url: coverUrl,
        file_url: fileUrl,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Book uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setIsUploadOpen(false);
      setTitle("");
      setAuthor("");
      setCoverImage(null);
      setBookFile(null);
      setCoverPreview("");
      setIsAuthenticated(false);
      setPassword("");
    },
    onError: (error) => {
      toast.error("Failed to upload book: " + error.message);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const reviewerName = user ? getUserDisplayName() : reviewName;
      if (!reviewingBook || !reviewerName || !reviewText) {
        throw new Error("Please fill in all fields");
      }

      const { error } = await supabase.from("book_reviews").insert({
        book_id: reviewingBook.id,
        user_name: reviewerName,
        review: reviewText,
        rating: reviewRating,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["reviews", reviewingBook?.id] });
      setReviewName("");
      setReviewText("");
      setReviewRating(5);
    },
    onError: (error) => {
      toast.error("Failed to submit review: " + error.message);
    },
  });

  const handlePasswordCheck = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-password', {
        body: { password, action: 'books_upload' }
      });
      
      if (error) throw error;
      
      if (data.valid) {
        setIsAuthenticated(true);
        toast.success("Access granted!");
      } else {
        toast.error("Incorrect password");
      }
    } catch (error) {
      toast.error("Failed to verify password");
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download book");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                  <Library className="w-4 h-4" />
                  Digital Library
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
                  Books <span className="text-gradient">Library</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  Download and read our collection of inspiring books
                </p>
              </div>
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 shadow-elegant hover:shadow-gold transition-all animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <Upload className="h-5 w-5" />
                    Upload Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-border/50">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Upload New Book</DialogTitle>
                  </DialogHeader>
                  {!isAuthenticated ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="password">Enter Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePasswordCheck()}
                          placeholder="Enter password to upload"
                          className="border-border/50"
                        />
                      </div>
                      <Button onClick={handlePasswordCheck} className="w-full">
                        Submit
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Book Title</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter book title"
                          className="border-border/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="Enter author name"
                          className="border-border/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cover">Cover Image</Label>
                        <Input
                          id="cover"
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="border-border/50"
                        />
                        {coverPreview && (
                          <img
                            src={coverPreview}
                            alt="Cover preview"
                            className="mt-2 w-32 h-48 object-cover rounded-lg shadow-elegant"
                          />
                        )}
                      </div>
                      <div>
                        <Label htmlFor="file">Book File (PDF)</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                          className="border-border/50"
                        />
                      </div>
                      <Button
                        onClick={() => uploadMutation.mutate()}
                        disabled={uploadMutation.isPending || !title || !author || !coverImage || !bookFile}
                        className="w-full"
                      >
                        {uploadMutation.isPending ? "Uploading..." : "Upload Book"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Books Grid */}
        <section className="py-12 container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading books...</p>
            </div>
          ) : books && books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book, index) => (
                <Card 
                  key={book.id} 
                  className="group glass-card border-border/50 overflow-hidden hover:shadow-elegant transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{book.title}</CardTitle>
                    <CardDescription>by {book.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(book.file_url, book.title)}
                          className="flex-1 hover:shadow-md transition-all"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setReadingBook(book)}
                          className="flex-1"
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Read
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReviewingBook(book)}
                        className="w-full"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Reviews
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-card rounded-2xl">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                No books available yet. Upload the first book!
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
      
      {/* Reading Dialog */}
      <Dialog open={!!readingBook} onOpenChange={() => {
        setReadingBook(null);
        setPageNumber(1);
        setNumPages(null);
      }}>
        <DialogContent className="max-w-full sm:max-w-6xl h-[90vh] flex flex-col p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>{readingBook?.title}</DialogTitle>
            <DialogDescription>Read the book online</DialogDescription>
          </DialogHeader>
          {readingBook && (
            <div className="flex-1 overflow-auto flex flex-col items-center">
              <Document
                file={readingBook.file_url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                className="flex flex-col items-center"
              >
                <Page 
                  pageNumber={pageNumber} 
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="max-w-full"
                />
              </Document>
              {numPages && (
                <div className="flex items-center gap-4 mt-4 sticky bottom-0 bg-background p-4 border-t border-border/50 rounded-t-xl shadow-elegant">
                  <Button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium">
                    Page {pageNumber} of {numPages}
                  </span>
                  <Button
                    onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                    disabled={pageNumber >= numPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reviews Dialog */}
      <Dialog open={!!reviewingBook} onOpenChange={() => {
        setReviewingBook(null);
        setReviewName("");
        setReviewText("");
        setReviewRating(5);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl">Reviews for {reviewingBook?.title}</DialogTitle>
            <DialogDescription>
              Read what others think and share your own review
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add Review Form */}
            <div className="border border-border/50 rounded-xl p-6 space-y-4 bg-muted/20">
              <h3 className="font-semibold text-lg">Write a Review</h3>
              <div>
                <Label htmlFor="reviewName">Your Name</Label>
                {user ? (
                  <div className="flex items-center gap-2 p-3 mt-2 rounded-lg bg-primary/5 border border-primary/20">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm">Reviewing as <strong>{getUserDisplayName()}</strong></span>
                  </div>
                ) : (
                  <Input
                    id="reviewName"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Enter your name"
                    className="border-border/50"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="flex gap-1 items-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= reviewRating
                            ? "fill-accent text-accent"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-muted-foreground">
                    {reviewRating} star{reviewRating !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="reviewText">Your Review</Label>
                <Textarea
                  id="reviewText"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  rows={4}
                  className="border-border/50"
                />
              </div>
              <Button
                onClick={() => reviewMutation.mutate()}
                disabled={reviewMutation.isPending || (!user && !reviewName) || !reviewText}
                className="w-full"
              >
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>

            {/* Display Reviews */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                All Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
              </h3>
              {reviews && reviews.length > 0 ? (
                reviews.map((review: any) => (
                  <div key={review.id} className="border border-border/50 rounded-xl p-4 space-y-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{review.user_name}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (review.rating || 0)
                                ? "fill-accent text-accent"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-foreground/80">{review.review}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No reviews yet. Be the first to review this book!
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Books;