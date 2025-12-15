import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Eye,
  Calendar,
  User,
  Book,
  Music,
  Sparkles,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Trash2,
  Edit,
  ImageIcon,
} from "lucide-react";

type VisionDream = {
  id: string;
  title: string;
  description: string;
  dreamer_name: string;
  category: string;
  status: string;
  date_received: string;
  scripture_reference: string | null;
  reflection_notes: string | null;
  background_image_url: string | null;
  audio_url: string | null;
  created_at: string;
};

const VisionsDreams = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVision, setSelectedVision] = useState<VisionDream | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dreamer_name: "",
    category: "dream",
    status: "waiting",
    date_received: new Date().toISOString().split("T")[0],
    scripture_reference: "",
    reflection_notes: "",
    background_image_url: "",
    audio_url: "",
  });

  const { data: visionsDreams, isLoading } = useQuery({
    queryKey: ["visions_dreams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visions_dreams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VisionDream[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newVision: Omit<VisionDream, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("visions_dreams")
        .insert([newVision])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visions_dreams"] });
      toast({
        title: "Vision/Dream Added",
        description: "Your vision or dream has been recorded successfully.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add vision/dream. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visions_dreams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visions_dreams"] });
      toast({
        title: "Deleted",
        description: "Vision/Dream has been removed.",
      });
      setIsViewDialogOpen(false);
      setSelectedVision(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dreamer_name: "",
      category: "dream",
      status: "waiting",
      date_received: new Date().toISOString().split("T")[0],
      scripture_reference: "",
      reflection_notes: "",
      background_image_url: "",
      audio_url: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      title: formData.title,
      description: formData.description,
      dreamer_name: formData.dreamer_name,
      category: formData.category,
      status: formData.status,
      date_received: formData.date_received,
      scripture_reference: formData.scripture_reference || null,
      reflection_notes: formData.reflection_notes || null,
      background_image_url: formData.background_image_url || null,
      audio_url: formData.audio_url || null,
    });
  };

  const openVisionDialog = (vision: VisionDream) => {
    setSelectedVision(vision);
    setIsViewDialogOpen(true);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isViewDialogOpen && selectedVision?.audio_url && audioRef.current) {
      audioRef.current.src = selectedVision.audio_url;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (!isViewDialogOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isViewDialogOpen, selectedVision]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const filteredVisions = visionsDreams?.filter((v) => {
    if (filterCategory !== "all" && v.category !== filterCategory) return false;
    if (filterStatus !== "all" && v.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === "vision" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Moon className="h-4 w-4" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <audio ref={audioRef} loop />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Visions & Dreams
            </h1>
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A sacred space to record and reflect on the revelations God has given us
          </p>
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="flex flex-wrap gap-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dream">Dreams</SelectItem>
                <SelectItem value="vision">Visions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                <Plus className="h-4 w-4" />
                Record New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Record a Vision or Dream
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Give it a meaningful title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dreamer_name">Dreamer/Visionary Name *</Label>
                    <Input
                      id="dreamer_name"
                      value={formData.dreamer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, dreamer_name: e.target.value })
                      }
                      placeholder="Who received this?"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Type</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dream">Dream</SelectItem>
                        <SelectItem value="vision">Vision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_received">Date Received</Label>
                    <Input
                      id="date_received"
                      type="date"
                      value={formData.date_received}
                      onChange={(e) =>
                        setFormData({ ...formData, date_received: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the vision or dream in detail..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scripture_reference">Scripture Reference</Label>
                  <Input
                    id="scripture_reference"
                    value={formData.scripture_reference}
                    onChange={(e) =>
                      setFormData({ ...formData, scripture_reference: e.target.value })
                    }
                    placeholder="e.g., Joel 2:28, Acts 2:17"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reflection_notes">Reflection Notes</Label>
                  <Textarea
                    id="reflection_notes"
                    value={formData.reflection_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, reflection_notes: e.target.value })
                    }
                    placeholder="Your thoughts, interpretations, or what God revealed..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="background_image_url" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Background Image URL
                    </Label>
                    <Input
                      id="background_image_url"
                      value={formData.background_image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, background_image_url: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audio_url" className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Background Music URL
                    </Label>
                    <Input
                      id="audio_url"
                      value={formData.audio_url}
                      onChange={(e) =>
                        setFormData({ ...formData, audio_url: e.target.value })
                      }
                      placeholder="https://example.com/music.mp3"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Vision/Dream"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Moon className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold text-blue-400">
                {visionsDreams?.filter((v) => v.category === "dream").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Dreams</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold text-yellow-400">
                {visionsDreams?.filter((v) => v.category === "vision").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Visions</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-green-400">
                {visionsDreams?.filter((v) => v.status === "fulfilled").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Fulfilled</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold text-purple-400">
                {visionsDreams?.filter((v) => v.status === "waiting").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredVisions && filteredVisions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisions.map((vision) => (
              <Card
                key={vision.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-border/50 hover:border-primary/50"
                onClick={() => openVisionDialog(vision)}
              >
                <div
                  className="h-40 bg-cover bg-center relative"
                  style={{
                    backgroundImage: vision.background_image_url
                      ? `url(${vision.background_image_url})`
                      : "linear-gradient(135deg, hsl(var(--primary)/0.3), hsl(var(--primary)/0.1))",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge
                      variant="outline"
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      {getCategoryIcon(vision.category)}
                      <span className="ml-1 capitalize">{vision.category}</span>
                    </Badge>
                    {vision.audio_url && (
                      <Badge
                        variant="outline"
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <Music className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className={getStatusColor(vision.status)}>
                      {vision.status === "in_progress"
                        ? "In Progress"
                        : vision.status.charAt(0).toUpperCase() +
                          vision.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                      {vision.title}
                    </h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {vision.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {vision.dreamer_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(vision.date_received).toLocaleDateString()}
                    </span>
                  </div>
                  {vision.scripture_reference && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <Book className="h-3 w-3" />
                      {vision.scripture_reference}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Visions or Dreams Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start recording the revelations God has given you
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Your First
            </Button>
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-hidden p-0"
            style={{
              backgroundImage: selectedVision?.background_image_url
                ? `url(${selectedVision.background_image_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
            <div className="relative z-10 p-6 max-h-[90vh] overflow-y-auto">
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl md:text-3xl flex items-center gap-3">
                    {selectedVision?.category === "vision" ? (
                      <Sun className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <Moon className="h-8 w-8 text-blue-400" />
                    )}
                    {selectedVision?.title}
                  </DialogTitle>
                  <Badge className={getStatusColor(selectedVision?.status || "waiting")}>
                    {selectedVision?.status === "in_progress"
                      ? "In Progress"
                      : (selectedVision?.status || "waiting").charAt(0).toUpperCase() +
                        (selectedVision?.status || "waiting").slice(1)}
                  </Badge>
                </div>
              </DialogHeader>

              {selectedVision?.audio_url && (
                <div className="flex items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg">
                  <Music className="h-5 w-5 text-primary" />
                  <span className="text-sm">Background Music</span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedVision?.dreamer_name}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {selectedVision &&
                      new Date(selectedVision.date_received).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  </span>
                </div>

                {selectedVision?.scripture_reference && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                      <Book className="h-4 w-4" />
                      Scripture Reference
                    </div>
                    <p className="text-foreground">{selectedVision.scripture_reference}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    The {selectedVision?.category === "vision" ? "Vision" : "Dream"}
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedVision?.description}
                  </p>
                </div>

                {selectedVision?.reflection_notes && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Reflection Notes
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedVision.reflection_notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      selectedVision && deleteMutation.mutate(selectedVision.id)
                    }
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default VisionsDreams;
