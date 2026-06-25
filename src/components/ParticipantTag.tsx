import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Camera, Download, User, Calendar, MapPin, Mail, Phone, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface ParticipantTagData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  denomination?: string | null;
  programTitle: string;
  startDate?: string;
  endDate?: string;
  location?: string | null;
  participantCode: string;
  photoUrl?: string | null;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const ParticipantTag = ({ data }: { data: ParticipantTagData }) => {
  const tagRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(data.photoUrl ?? null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast({ title: "Unsupported format", description: "Please upload a JPG, PNG, or WEBP image.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `participant-photos/${data.participantCode}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("program-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("program-images").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updateError } = await supabase
        .from("program_registrations")
        .update({ photo_url: publicUrl })
        .eq("participant_code", data.participantCode);
      if (updateError) throw updateError;

      setPhoto(publicUrl);
      toast({ title: "Photo saved", description: "Your tag photo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Could not save photo.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!tagRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(tagRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${data.name.replace(/\s+/g, "-").toLowerCase()}-ybfi-tag.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast({ title: "Download failed", description: "Could not generate the tag image. Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const dateRange = data.startDate
    ? `${format(new Date(data.startDate), "MMM d")}${data.endDate ? ` – ${format(new Date(data.endDate), "MMM d, yyyy")}` : ""}`
    : "";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* The downloadable tag */}
      <div
        ref={tagRef}
        className="relative w-[340px] overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-2xl"
      >
        {/* decorative accents */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-secondary/20 blur-2xl" />

        {/* header */}
        <div className="relative flex items-center justify-between px-6 pt-5">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
            YBFI
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
            Participant
          </span>
        </div>

        <p className="relative px-6 pt-1 text-center text-sm font-medium text-primary-foreground/90 line-clamp-2">
          {data.programTitle}
        </p>

        {/* photo */}
        <div className="relative mt-4 flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-secondary bg-primary-foreground/10 shadow-lg">
            {photo ? (
              <img src={photo} alt={data.name} crossOrigin="anonymous" className="h-full w-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-primary-foreground/60" />
            )}
          </div>
        </div>

        {/* name */}
        <h3 className="relative mt-3 px-6 text-center font-serif text-2xl font-bold leading-tight">
          {data.name}
        </h3>

        {/* details */}
        <div className="relative mt-4 space-y-2 px-7 text-xs">
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <Mail className="h-3.5 w-3.5 shrink-0 text-secondary" />
            <span className="truncate">{data.email}</span>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/90">
            <Phone className="h-3.5 w-3.5 shrink-0 text-secondary" />
            <span>{data.phone}</span>
          </div>
          {(data.gender || data.denomination) && (
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <User className="h-3.5 w-3.5 shrink-0 text-secondary" />
              <span className="truncate">
                {[data.gender, data.denomination].filter(Boolean).join(" • ")}
              </span>
            </div>
          )}
          {dateRange && (
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-secondary" />
              <span>{dateRange}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-secondary" />
              <span className="truncate">{data.location}</span>
            </div>
          )}
        </div>

        {/* unique code */}
        <div className="relative mx-6 mt-5 mb-6 rounded-xl bg-primary-foreground/10 px-4 py-3 text-center backdrop-blur-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-secondary">
            Participant ID
          </p>
          <p className="mt-1 font-mono text-lg font-bold tracking-widest">
            {data.participantCode}
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="flex w-[340px] gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhoto}
        />
        <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Camera className="mr-1 h-4 w-4" />}
          {uploading ? "Uploading..." : photo ? "Change Photo" : "Add Photo"}
        </Button>
        <Button className="flex-1" onClick={handleDownload} disabled={downloading}>
          <Download className="mr-1 h-4 w-4" />
          {downloading ? "Saving..." : "Download Tag"}
        </Button>
      </div>
    </div>
  );
};

export default ParticipantTag;
