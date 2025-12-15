import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, BookOpen, Upload, MessageSquare, Star } from "lucide-react";
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

      // Upload cover image
      const coverExt = coverImage.name.split(".").pop();
      const coverPath = `${crypto.randomUUID()}.${coverExt}`;
      const { error: coverError } = await supabase.storage
        .from("book-covers")
        .upload(coverPath, coverImage);

      if (coverError) throw coverError;

      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from("book-covers")
        .getPublicUrl(coverPath);

      // Upload book file
      const fileExt = bookFile.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      const { error: fileError } = await supabase.storage
        .from("book-files")
        .upload(filePath, bookFile);

      if (fileError) throw fileError;

      const { data: { publicUrl: fileUrl } } = supabase.storage
        .from("book-files")
        .getPublicUrl(filePath);

      // Insert book record
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
      if (!reviewingBook || !reviewName || !reviewText) {
        throw new Error("Please fill in all fields");
      }

      const { error } = await supabase.from("book_reviews").insert({
        book_id: reviewingBook.id,
        user_name: reviewName,
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

  const handlePasswordCheck = () => {
    if (password === "BOOKS") {
      setIsAuthenticated(true);
      toast.success("Access granted!");
    } else {
      toast.error("Incorrect password");
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Books Library</h1>
            <p className="text-muted-foreground">Download and read our collection</p>
          </div>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New Book</DialogTitle>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Enter author name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cover">Cover Image</Label>
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                    />
                    {coverPreview && (
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="mt-2 w-32 h-48 object-cover rounded"
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

        {isLoading ? (
          <div className="text-center py-8">Loading books...</div>
        ) : books && books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {books.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-64 object-cover"
                />
                <CardHeader>
                  <CardTitle>{book.title}</CardTitle>
                  <CardDescription>by {book.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(book.file_url, book.title)}
                      className="flex-1"
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
                    className="w-full mt-2"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Reviews
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No books available yet. Upload the first book!
          </div>
        )}
      </main>
      <Footer />
      
      <Dialog open={!!readingBook} onOpenChange={() => {
        setReadingBook(null);
        setPageNumber(1);
        setNumPages(null);
      }}>
        <DialogContent className="max-w-full sm:max-w-6xl h-[90vh] flex flex-col p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>{readingBook?.title}</DialogTitle>
            <DialogDescription>
              Read the book online
            </DialogDescription>
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
                <div className="flex items-center gap-4 mt-4 sticky bottom-0 bg-background p-4 border-t">
                  <Button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
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

      <Dialog open={!!reviewingBook} onOpenChange={() => {
        setReviewingBook(null);
        setReviewName("");
        setReviewText("");
        setReviewRating(5);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reviews for {reviewingBook?.title}</DialogTitle>
            <DialogDescription>
              Read what others think and share your own review
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add Review Form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Write a Review</h3>
              <div>
                <Label htmlFor="reviewName">Your Name</Label>
                <Input
                  id="reviewName"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="flex gap-1 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= reviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
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
                />
              </div>
              <Button
                onClick={() => reviewMutation.mutate()}
                disabled={reviewMutation.isPending || !reviewName || !reviewText}
                className="w-full"
              >
                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>

            {/* Display Reviews */}
            <div className="space-y-4">
              <h3 className="font-semibold">
                All Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
              </h3>
              {reviews && reviews.length > 0 ? (
                reviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{review.user_name}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm">{review.review}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
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
