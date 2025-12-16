import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PenLine, ArrowLeft, MessageCircle, Sparkles, Send, Calendar, User } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  author_name: string;
  created_at: string;
}

interface Comment {
  id: string;
  name: string;
  comment: string;
  created_at: string;
}

const Blog = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    authorName: "",
    image: null as File | null,
  });
  const [newComment, setNewComment] = useState({ name: "", comment: "" });
  const [createPassword, setCreatePassword] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Auto-fill user details when logged in
  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (user?.email) return user.email.split('@')[0];
    return "";
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
      const subscription = supabase
        .channel("blog_comments_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "blog_comments",
            filter: `post_id=eq.${selectedPost.id}`,
          },
          () => {
            fetchComments(selectedPost.id);
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedPost]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error fetching posts", variant: "destructive" });
    } else {
      setPosts(data || []);
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Error fetching comments", variant: "destructive" });
    } else {
      setComments(data || []);
    }
  };

  const verifyCreatePassword = async (password: string) => {
    const { data } = await supabase.functions.invoke(
      "verify-admin-password",
      {
        body: { password, action: "blog_create" },
      }
    );
    return data?.valid || false;
  };

  const convertToJpg = async (file: File): Promise<Blob> => {
    try {
      if ("createImageBitmap" in window) {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");
        ctx.drawImage(bitmap, 0, 0);
        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob((b) => res(b), "image/jpeg", 0.95)
        );
        if (!blob) throw new Error("Failed to convert image");
        return blob;
      }
    } catch (e) {
      // Fallback
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image"));
            }
          },
          "image/jpeg",
          0.95
        );
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error("Failed to decode image"));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content || !newPost.authorName) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    const isValid = await verifyCreatePassword(createPassword);
    if (!isValid) {
      toast({ title: "Invalid password", variant: "destructive" });
      return;
    }

    let imageUrl = null;
    if (newPost.image) {
      const ext = newPost.image.name.split(".").pop()?.toLowerCase() || "";
      const isJpeg =
        newPost.image.type === "image/jpeg" || ext === "jpg" || ext === "jpeg";
      if (
        newPost.image.type === "image/heic" ||
        newPost.image.type === "image/heif"
      ) {
        toast({
          title: "Unsupported image format",
          description: "Please upload a JPG, PNG, or WebP image.",
          variant: "destructive",
        });
        return;
      }
      const baseFileName = newPost.image.name.replace(/\.[^/.]+$/, "");
      const fileName = `blog/${Date.now()}-${baseFileName}.jpg`;
      const blobToUpload = isJpeg
        ? newPost.image
        : await convertToJpg(newPost.image);
      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, blobToUpload, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (uploadError) {
        toast({ title: "Error uploading image", variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage
        .from("gallery")
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("blog_posts").insert({
      title: newPost.title,
      content: newPost.content,
      author_name: newPost.authorName,
      image_url: imageUrl,
    });

    if (error) {
      toast({ title: "Error creating post", variant: "destructive" });
    } else {
      toast({ title: "Post created successfully" });
      setNewPost({ title: "", content: "", authorName: "", image: null });
      setCreatePassword("");
      setIsCreateDialogOpen(false);
      fetchPosts();
    }
  };

  const handleAddComment = async () => {
    const commenterName = user ? getUserDisplayName() : newComment.name;
    if (!selectedPost || !commenterName || !newComment.comment) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("blog_comments").insert({
      post_id: selectedPost.id,
      name: commenterName,
      comment: newComment.comment,
    });
    if (error) {
      toast({ title: "Error adding comment", variant: "destructive" });
    } else {
      toast({ title: "Comment added" });
      setNewComment({ name: "", comment: "" });
      fetchComments(selectedPost.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        {!selectedPost && (
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                    <Sparkles className="w-4 h-4" />
                    Insights & Inspiration
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
                    Our <span className="text-gradient">Blog</span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    Discover articles, teachings, and insights for spiritual growth
                  </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2 shadow-elegant hover:shadow-gold transition-all animate-fade-in" style={{ animationDelay: '0.3s' }}>
                      <PenLine className="h-5 w-5" />
                      Create Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-border/50">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Create New Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Post Title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        className="border-border/50"
                      />
                      <Textarea
                        placeholder="Content"
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        rows={8}
                        className="border-border/50"
                      />
                      <Input
                        placeholder="Author Name"
                        value={newPost.authorName}
                        onChange={(e) => setNewPost({ ...newPost, authorName: e.target.value })}
                        className="border-border/50"
                      />
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setNewPost({ ...newPost, image: e.target.files?.[0] || null })}
                        className="border-border/50"
                      />
                      <Input
                        type="password"
                        placeholder="Enter password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreatePost()}
                        className="border-border/50"
                      />
                      <Button onClick={handleCreatePost} className="w-full">
                        Create Post
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="py-12 container mx-auto px-4">
          {selectedPost ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <Button variant="outline" onClick={() => setSelectedPost(null)} className="gap-2 hover:shadow-md transition-all">
                <ArrowLeft className="w-4 h-4" />
                Back to Posts
              </Button>
              
              <Card className="glass-card border-border/50 overflow-hidden">
                {selectedPost.image_url && (
                  <div className="relative h-64 md:h-96 overflow-hidden">
                    <img
                      src={selectedPost.image_url}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                )}
                <CardHeader className="relative">
                  <CardTitle className="text-2xl md:text-3xl">{selectedPost.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedPost.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedPost.created_at), "PPP")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">{selectedPost.content}</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Comments ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {comments.map((comment, index) => (
                    <div 
                      key={comment.id} 
                      className="border-b border-border/50 pb-4 last:border-0 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{comment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "PPP")}
                          </p>
                        </div>
                      </div>
                      <p className="text-foreground/80 ml-10">{comment.comment}</p>
                    </div>
                  ))}
                  
                  <div className="space-y-4 mt-8 pt-6 border-t border-border/50">
                    <h3 className="font-semibold text-lg">Add a Comment</h3>
                    {user ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm">Commenting as <strong>{getUserDisplayName()}</strong></span>
                      </div>
                    ) : (
                      <Input
                        placeholder="Your Name"
                        value={newComment.name}
                        onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                        className="border-border/50"
                      />
                    )}
                    <Textarea
                      placeholder="Your Comment"
                      value={newComment.comment}
                      onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                      rows={4}
                      className="border-border/50"
                    />
                    <Button onClick={handleAddComment} className="gap-2">
                      <Send className="w-4 h-4" />
                      Submit Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-16 glass-card rounded-2xl max-w-xl mx-auto">
                  <PenLine className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No blog posts yet. Create the first one!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => (
                    <Card
                      key={post.id}
                      className="group glass-card border-border/50 cursor-pointer hover:shadow-elegant transition-all duration-500 animate-fade-in overflow-hidden"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setSelectedPost(post)}
                    >
                      {post.image_url && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{post.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{post.author_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), "PPP")}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-3 text-foreground/70">{post.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;