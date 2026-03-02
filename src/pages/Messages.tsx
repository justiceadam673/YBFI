import { useEffect, useState, useRef } from "react";
import { Music, Lock, Plus, Sparkles, Play, Loader2, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import dayOneTakeover from "@/assets/audio/day-1-takeover.mp3";
import dayTwoFaith from "@/assets/audio/day-2-faith-seminar.mp3";
import dayThreeGospel from "@/assets/audio/day-3-gospel-seminar.mp3";

const Messages = () => {
  const [messages, setMessages] = useState<
    Array<{ id: string; title: string; audio_url: string; date: string }>
  >([]);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [newMessage, setNewMessage] = useState({ title: "", date: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePasswordDialog, setDeletePasswordDialog] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const audioMap: Record<string, string> = {
    "day-1-takeover.mp3": dayOneTakeover,
    "day-2-faith-seminar.mp3": dayTwoFaith,
    "day-3-gospel-seminar.mp3": dayThreeGospel,
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, title, audio_url, date")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const messagesWithLocalAudio = data.map((msg) => ({
        ...msg,
        audio_url: audioMap[msg.audio_url] || msg.audio_url,
      }));
      setMessages(messagesWithLocalAudio);
    }
  };

  const resetFormState = () => {
    setNewMessage({ title: "", date: "" });
    setAudioFile(null);
    setAdminPassword("");
    setIsAuthenticated(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDialogChange = (open: boolean) => {
    setIsAdminDialogOpen(open);
    if (!open) resetFormState();
  };

  const verifyPassword = async () => {
    setIsVerifying(true);
    try {
      const { data } = await supabase.functions.invoke("verify-admin-password", {
        body: { password: adminPassword, action: "messages_gallery" },
      });

      if (data?.valid) {
        setIsAuthenticated(true);
        toast({ title: "Access granted" });
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Verify error:", err);
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    setDeletingId(id);
    try {
      const { data } = await supabase.functions.invoke("verify-admin-password", {
        body: { password: deletePassword, action: "messages_gallery" },
      });
      if (!data?.valid) {
        toast({ title: "Invalid password", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) {
        toast({ title: "Error deleting message", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Message deleted" });
        setDeletePasswordDialog(null);
        setDeletePassword("");
        fetchMessages();
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddMessage = async () => {
    if (isUploading) return;

    if (!newMessage.title || !newMessage.date || !audioFile) {
      toast({ title: "Please fill all fields and select an audio file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    console.log("[Messages] Starting upload...", { title: newMessage.title, fileName: audioFile.name });

    try {
      const fileName = `${Date.now()}-${audioFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(fileName, audioFile, { upsert: false, contentType: audioFile.type });

      if (uploadError) {
        console.error("[Messages] Storage upload error:", uploadError);
        toast({ title: "Error uploading file", description: uploadError.message || JSON.stringify(uploadError), variant: "destructive" });
        return;
      }

      console.log("[Messages] Upload success, getting public URL...");
      const { data: { publicUrl } } = supabase.storage.from("messages").getPublicUrl(fileName);

      const { error } = await supabase.from("messages").insert([
        { title: newMessage.title, date: newMessage.date, audio_url: publicUrl },
      ]);

      if (error) {
        console.error("[Messages] DB insert error:", error);
        toast({ title: "Error adding message", description: error.message || JSON.stringify(error), variant: "destructive" });
      } else {
        console.log("[Messages] Message added successfully");
        toast({ title: "Message added successfully" });
        resetFormState();
        setIsAdminDialogOpen(false);
        fetchMessages();
      }
    } catch (err: any) {
      console.error("[Messages] Unexpected error:", err);
      toast({ title: "Something went wrong", description: err.message || String(err), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Audio Messages
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
                Life Changing <span className="text-gradient">Messages</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Seminars and Trainings
              </p>
              <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Words of encouragement and wisdom for young builders
              </p>
            </div>
          </div>
        </section>

        {/* Messages Section */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-end">
              <Dialog open={isAdminDialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 hover:shadow-elegant transition-all">
                    <Plus className="w-4 h-4" />
                    Add Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-border/50">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Add New Message</DialogTitle>
                  </DialogHeader>
                  {!isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Enter password to continue
                        </span>
                      </div>
                      <Input
                        type="password"
                        placeholder="Admin Password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !isVerifying && verifyPassword()}
                        className="border-border/50"
                      />
                      <Button type="button" onClick={verifyPassword} className="w-full" disabled={isVerifying}>
                        {isVerifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {isVerifying ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        placeholder="Message Title"
                        value={newMessage.title}
                        onChange={(e) => setNewMessage((prev) => ({ ...prev, title: e.target.value }))}
                        className="border-border/50"
                      />
                      <Input
                        type="date"
                        value={newMessage.date}
                        onChange={(e) => setNewMessage((prev) => ({ ...prev, date: e.target.value }))}
                        className="border-border/50"
                      />
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        className="border-border/50"
                      />
                      <Button type="button" onClick={handleAddMessage} className="w-full" disabled={isUploading}>
                        {isUploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {isUploading ? "Uploading..." : "Add Message"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <Music className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No messages yet. Add the first one!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <Card
                    key={message.id}
                    className="group glass-card border-border/50 hover:shadow-elegant hover:border-primary/20 transition-all duration-500 animate-fade-in overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-elegant group-hover:scale-105 transition-transform">
                          <Play className="w-6 h-6 text-primary-foreground ml-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                            <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">{message.title}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap px-3 py-1 bg-muted/50 rounded-full">
                                {message.date}
                              </span>
                              <Dialog open={deletePasswordDialog === message.id} onOpenChange={(open) => {
                                setDeletePasswordDialog(open ? message.id : null);
                                if (!open) setDeletePassword("");
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Delete Message</DialogTitle>
                                  </DialogHeader>
                                  <p className="text-sm text-muted-foreground">Enter admin password to delete "{message.title}"</p>
                                  <Input
                                    type="password"
                                    placeholder="Admin Password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !deletingId && handleDeleteMessage(message.id)}
                                    className="border-border/50"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => handleDeleteMessage(message.id)}
                                    disabled={deletingId === message.id}
                                    className="w-full"
                                  >
                                    {deletingId === message.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {deletingId === message.id ? "Deleting..." : "Delete"}
                                  </Button>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          <audio controls className="w-full rounded-lg" preload="metadata">
                            <source src={message.audio_url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;
