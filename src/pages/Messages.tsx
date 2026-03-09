import { useEffect, useState, useRef, useCallback } from "react";
import { Music, Lock, Plus, Sparkles, Play, Loader2, Trash2, Mic, MicOff, Search, Square } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import dayOneTakeover from "@/assets/audio/day-1-takeover.mp3";
import dayTwoFaith from "@/assets/audio/day-2-faith-seminar.mp3";
import dayThreeGospel from "@/assets/audio/day-3-gospel-seminar.mp3";

type Message = {
  id: string;
  title: string;
  audio_url: string;
  date: string;
  speaker: string | null;
  is_voice_note: boolean;
};

const ITEMS_PER_PAGE = 10;

const audioMap: Record<string, string> = {
  "day-1-takeover.mp3": dayOneTakeover,
  "day-2-faith-seminar.mp3": dayTwoFaith,
  "day-3-gospel-seminar.mp3": dayThreeGospel,
};

/* ─── Admin Password Gate ─── */
function AdminPasswordGate({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  const verify = async () => {
    setVerifying(true);
    try {
      const { data } = await supabase.functions.invoke("verify-admin-password", {
        body: { password, action: "messages_gallery" },
      });
      if (data?.valid) {
        onAuthenticated();
        toast({ title: "Access granted" });
      } else {
        toast({ title: "Invalid password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Enter password to continue</span>
      </div>
      <Input
        type="password"
        placeholder="Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !verifying && verify()}
        className="border-border/50"
      />
      <Button onClick={verify} className="w-full" disabled={verifying}>
        {verifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {verifying ? "Verifying..." : "Verify"}
      </Button>
    </div>
  );
}

/* ─── Add Message Dialog ─── */
function AddMessageDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setSpeaker("");
    setDate("");
    setFile(null);
    setAuthed(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAdd = async () => {
    if (uploading) return;
    if (!title || !date || !file) {
      toast({ title: "Please fill all fields and select an audio file", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("messages")
        .upload(fileName, file, { upsert: false, contentType: file.type });
      if (upErr) {
        toast({ title: "Upload error", description: upErr.message, variant: "destructive" });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("messages").getPublicUrl(fileName);
      const { error } = await supabase.from("messages").insert([
        { title, date, audio_url: publicUrl, speaker: speaker || null, is_voice_note: false },
      ]);
      if (error) {
        toast({ title: "Error adding message", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Message added successfully" });
        reset();
        setOpen(false);
        onAdded();
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
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
        {!authed ? (
          <AdminPasswordGate onAuthenticated={() => setAuthed(true)} />
        ) : (
          <div className="space-y-4">
            <Input placeholder="Message Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border-border/50" />
            <Input placeholder="Speaker / Preacher Name" value={speaker} onChange={(e) => setSpeaker(e.target.value)} className="border-border/50" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-border/50" />
            <Input ref={fileRef} type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-border/50" />
            <Button onClick={handleAdd} className="w-full" disabled={uploading}>
              {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {uploading ? "Uploading..." : "Add Message"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Record Voice Note Dialog ─── */
function RecordVoiceNoteDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const reset = () => {
    setTitle("");
    setSpeaker("");
    setRecording(false);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAuthed(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((p) => p + 1), 1000);
    } catch {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to record.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSave = async () => {
    if (!title || !audioBlob) {
      toast({ title: "Please add a title and record audio", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const fileName = `${Date.now()}-voice-note.webm`;
      const { error: upErr } = await supabase.storage
        .from("messages")
        .upload(fileName, audioBlob, { upsert: false, contentType: "audio/webm" });
      if (upErr) {
        toast({ title: "Upload error", description: upErr.message, variant: "destructive" });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("messages").getPublicUrl(fileName);
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("messages").insert([
        { title, date: today, audio_url: publicUrl, speaker: speaker || null, is_voice_note: true },
      ]);
      if (error) {
        toast({ title: "Error saving voice note", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Voice note saved!" });
        reset();
        setOpen(false);
        onAdded();
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all">
          <Mic className="w-4 h-4" />
          Record Voice Note
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl">Record Voice Note</DialogTitle>
        </DialogHeader>
        {!authed ? (
          <AdminPasswordGate onAuthenticated={() => setAuthed(true)} />
        ) : (
          <div className="space-y-4">
            <Input placeholder="Voice Note Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border-border/50" />
            <Input placeholder="Speaker / Preacher Name" value={speaker} onChange={(e) => setSpeaker(e.target.value)} className="border-border/50" />

            {/* Recording controls */}
            <div className="flex flex-col items-center gap-4 py-4">
              {recording ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-lg font-mono font-semibold text-destructive">{formatTime(elapsed)}</span>
                  </div>
                  <Button variant="outline" onClick={stopRecording} className="gap-2 border-destructive text-destructive hover:bg-destructive/10">
                    <Square className="w-4 h-4" />
                    Stop Recording
                  </Button>
                </>
              ) : audioBlob ? (
                <>
                  <audio controls src={audioUrl!} className="w-full rounded-lg" />
                  <Button variant="outline" onClick={() => { setAudioBlob(null); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null); }} className="text-sm">
                    Re-record
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={startRecording} className="gap-2 border-destructive text-destructive hover:bg-destructive/10">
                  <Mic className="w-5 h-5" />
                  Start Recording
                </Button>
              )}
            </div>

            <Button onClick={handleSave} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={saving || !audioBlob}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {saving ? "Saving..." : "Save Voice Note"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Delete Dialog ─── */
function DeleteMessageDialog({
  message,
  onDeleted,
}: {
  message: Message;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data } = await supabase.functions.invoke("verify-admin-password", {
        body: { password, action: "messages_gallery" },
      });
      if (!data?.valid) {
        toast({ title: "Invalid password", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("messages").delete().eq("id", message.id);
      if (error) {
        toast({ title: "Error deleting", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Message deleted" });
        setOpen(false);
        onDeleted();
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPassword(""); }}>
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !deleting && handleDelete()}
          className="border-border/50"
        />
        <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="w-full">
          {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Message Card ─── */
function MessageCard({ message, index, onDeleted }: { message: Message; index: number; onDeleted: () => void }) {
  const isVoice = message.is_voice_note;

  return (
    <Card
      className={`group glass-card border-border/50 hover:shadow-elegant hover:border-primary/20 transition-all duration-500 animate-fade-in overflow-hidden ${
        isVoice ? "border-l-4 border-l-destructive/60" : ""
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-elegant group-hover:scale-105 transition-transform ${
              isVoice
                ? "bg-gradient-to-br from-destructive to-destructive/70"
                : "bg-gradient-to-br from-primary to-accent"
            }`}
          >
            {isVoice ? (
              <Mic className="w-6 h-6 text-destructive-foreground" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {message.title}
                </h3>
                {message.speaker && (
                  <p className="text-sm text-muted-foreground">{message.speaker}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isVoice && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                    Voice Note
                  </span>
                )}
                <span className="text-sm text-muted-foreground whitespace-nowrap px-3 py-1 bg-muted/50 rounded-full">
                  {message.date}
                </span>
                <DeleteMessageDialog message={message} onDeleted={onDeleted} />
              </div>
            </div>
            <audio controls className="w-full rounded-lg mt-2" preload="metadata">
              <source src={message.audio_url} type={isVoice ? "audio/webm" : "audio/mpeg"} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [speakerFilter, setSpeakerFilter] = useState("");

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, title, audio_url, date, speaker, is_voice_note")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMessages(
        data.map((msg) => ({
          ...msg,
          audio_url: audioMap[msg.audio_url] || msg.audio_url,
          is_voice_note: msg.is_voice_note ?? false,
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filtered = speakerFilter
    ? messages.filter(
        (m) =>
          m.speaker?.toLowerCase().includes(speakerFilter.toLowerCase()) ||
          m.title.toLowerCase().includes(speakerFilter.toLowerCase())
      )
    : messages;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [speakerFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Audio Messages
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
                Life Changing <span className="text-gradient">Messages</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Seminars and Trainings
              </p>
              <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Words of encouragement and wisdom for young builders
              </p>
            </div>
          </div>
        </section>

        {/* Messages Section */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Actions bar */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by speaker or title..."
                  value={speakerFilter}
                  onChange={(e) => setSpeakerFilter(e.target.value)}
                  className="pl-10 border-border/50"
                />
              </div>
              <div className="flex gap-2">
                <RecordVoiceNoteDialog onAdded={fetchMessages} />
                <AddMessageDialog onAdded={fetchMessages} />
              </div>
            </div>

            {paginated.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <Music className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  {speakerFilter ? "No messages match your filter." : "No messages yet. Add the first one!"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {paginated.map((message, index) => (
                    <MessageCard key={message.id} message={message} index={index} onDeleted={fetchMessages} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className={safePage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === safePage}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={safePage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;
