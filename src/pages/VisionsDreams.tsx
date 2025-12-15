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
  Upload,
  Wand2,
  Save,
  X,
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editAudioInputRef = useRef<HTMLInputElement>(null);

  // Upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSuggestingScripture, setIsSuggestingScripture] = useState(false);

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

  // Edit form states
  const [editFormData, setEditFormData] = useState({
    status: "",
    reflection_notes: "",
    scripture_reference: "",
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add vision/dream. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VisionDream> }) => {
      const { data, error } = await supabase
        .from("visions_dreams")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["visions_dreams"] });
      setSelectedVision(data as VisionDream);
      setIsEditMode(false);
      toast({
        title: "Updated",
        description: "Vision/Dream has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('visions-backgrounds')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visions-backgrounds')
        .getPublicUrl(filePath);

      if (isEdit) {
        setEditFormData({ ...editFormData, background_image_url: publicUrl });
      } else {
        setFormData({ ...formData, background_image_url: publicUrl });
      }
      toast({
        title: "Image uploaded",
        description: "Background image has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, or OGG audio file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAudio(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `audio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('visions-audio')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visions-audio')
        .getPublicUrl(filePath);

      if (isEdit) {
        setEditFormData({ ...editFormData, audio_url: publicUrl });
      } else {
        setFormData({ ...formData, audio_url: publicUrl });
      }
      toast({
        title: "Audio uploaded",
        description: "Background music has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const suggestScripture = async (description: string, title: string, category: string, isEdit = false) => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description first to get scripture suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsSuggestingScripture(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-scripture', {
        body: { description, title, category },
      });

      if (error) throw error;

      if (data?.scripture) {
        if (isEdit) {
          setEditFormData({ ...editFormData, scripture_reference: data.scripture });
        } else {
          setFormData({ ...formData, scripture_reference: data.scripture });
        }
        toast({
          title: "Scripture suggested",
          description: "AI has suggested relevant scripture references.",
        });
      }
    } catch (error) {
      console.error('Scripture suggestion error:', error);
      toast({
        title: "Suggestion failed",
        description: "Failed to get scripture suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSuggestingScripture(false);
    }
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

  const handleEditSubmit = () => {
    if (!selectedVision) return;
    updateMutation.mutate({
      id: selectedVision.id,
      updates: {
        status: editFormData.status,
        reflection_notes: editFormData.reflection_notes || null,
        scripture_reference: editFormData.scripture_reference || null,
        background_image_url: editFormData.background_image_url || null,
        audio_url: editFormData.audio_url || null,
      },
    });
  };

  const openVisionDialog = (vision: VisionDream) => {
    setSelectedVision(vision);
    setEditFormData({
      status: vision.status,
      reflection_notes: vision.reflection_notes || "",
      scripture_reference: vision.scripture_reference || "",
      background_image_url: vision.background_image_url || "",
      audio_url: vision.audio_url || "",
    });
    setIsViewDialogOpen(true);
    setIsEditMode(false);
    setIsPlaying(false);
  };

  const startEditMode = () => {
    if (selectedVision) {
      setEditFormData({
        status: selectedVision.status,
        reflection_notes: selectedVision.reflection_notes || "",
        scripture_reference: selectedVision.scripture_reference || "",
        background_image_url: selectedVision.background_image_url || "",
        audio_url: selectedVision.audio_url || "",
      });
      setIsEditMode(true);
    }
  };

  useEffect(() => {
    if (isViewDialogOpen && selectedVision?.audio_url && audioRef.current && !isEditMode) {
      audioRef.current.src = selectedVision.audio_url;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (!isViewDialogOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isViewDialogOpen, selectedVision, isEditMode]);

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
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Give it a meaningful title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dreamer_name">Dreamer/Visionary Name *</Label>
                    <Input
                      id="dreamer_name"
                      value={formData.dreamer_name}
                      onChange={(e) => setFormData({ ...formData, dreamer_name: e.target.value })}
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
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
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
                      onChange={(e) => setFormData({ ...formData, date_received: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the vision or dream in detail..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scripture_reference" className="flex items-center gap-2">
                    Scripture Reference
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => suggestScripture(formData.description, formData.title, formData.category)}
                      disabled={isSuggestingScripture || !formData.description.trim()}
                      className="ml-auto gap-1 text-xs"
                    >
                      {isSuggestingScripture ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Suggesting...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3 w-3" />
                          AI Suggest
                        </>
                      )}
                    </Button>
                  </Label>
                  <Input
                    id="scripture_reference"
                    value={formData.scripture_reference}
                    onChange={(e) => setFormData({ ...formData, scripture_reference: e.target.value })}
                    placeholder="e.g., Joel 2:28, Acts 2:17"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reflection_notes">Reflection Notes</Label>
                  <Textarea
                    id="reflection_notes"
                    value={formData.reflection_notes}
                    onChange={(e) => setFormData({ ...formData, reflection_notes: e.target.value })}
                    placeholder="Your thoughts, interpretations, or what God revealed..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Background Image
                    </Label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(e)}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex-1"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                    </div>
                    {formData.background_image_url && (
                      <div className="mt-2 relative">
                        <img
                          src={formData.background_image_url}
                          alt="Preview"
                          className="h-20 w-full object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => setFormData({ ...formData, background_image_url: "" })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Background Music
                    </Label>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                      onChange={(e) => handleAudioUpload(e)}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={isUploadingAudio}
                        className="flex-1"
                      >
                        {isUploadingAudio ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Audio
                          </>
                        )}
                      </Button>
                    </div>
                    {formData.audio_url && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Music className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground flex-1 truncate">
                          Audio uploaded
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setFormData({ ...formData, audio_url: "" })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={addMutation.isPending}>
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
                {visionsDreams?.filter((v) => v.status === "waiting" || v.status === "in_progress").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting</p>
            </CardContent>
          </Card>
        </div>

        {/* Vision/Dream Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredVisions && filteredVisions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisions.map((vision) => (
              <Card
                key={vision.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-primary/10 hover:border-primary/30"
                onClick={() => openVisionDialog(vision)}
              >
                <div className="relative h-40 overflow-hidden">
                  {vision.background_image_url ? (
                    <img
                      src={vision.background_image_url}
                      alt={vision.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      {vision.category === "vision" ? (
                        <Sun className="h-16 w-16 text-primary/40" />
                      ) : (
                        <Moon className="h-16 w-16 text-primary/40" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      {getCategoryIcon(vision.category)}
                      {vision.category}
                    </Badge>
                    {vision.audio_url && (
                      <Badge variant="secondary" className="gap-1">
                        <Music className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <Badge className={`absolute top-3 right-3 ${getStatusColor(vision.status)}`}>
                    {vision.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {vision.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {vision.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {vision.dreamer_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(vision.date_received).toLocaleDateString()}
                    </div>
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
            <h3 className="text-xl font-semibold mb-2">No visions or dreams yet</h3>
            <p className="text-muted-foreground mb-4">
              Start recording the revelations God has given you
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Record Your First Vision/Dream
            </Button>
          </div>
        )}

        {/* View/Edit Vision Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) setIsEditMode(false);
        }}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
            {selectedVision && (
              <div className="relative">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  {(isEditMode ? editFormData.background_image_url : selectedVision.background_image_url) ? (
                    <img
                      src={isEditMode ? editFormData.background_image_url : selectedVision.background_image_url!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-500/30 to-blue-500/30" />
                  )}
                  <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 max-h-[95vh] overflow-y-auto">
                  <DialogHeader className="mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="gap-1">
                            {getCategoryIcon(selectedVision.category)}
                            {selectedVision.category}
                          </Badge>
                          {isEditMode ? (
                            <Select
                              value={editFormData.status}
                              onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                            >
                              <SelectTrigger className="w-32 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="waiting">Waiting</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getStatusColor(selectedVision.status)}>
                              {selectedVision.status.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                        <DialogTitle className="text-2xl md:text-3xl">
                          {selectedVision.title}
                        </DialogTitle>
                      </div>
                      <div className="flex gap-2">
                        {isEditMode ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditMode(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleEditSubmit}
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={startEditMode}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(selectedVision.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Audio Controls */}
                  {!isEditMode && selectedVision.audio_url && (
                    <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlay}
                        className="hover:bg-primary/20"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <div className="flex-1 text-sm text-muted-foreground">
                        Background Music
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="hover:bg-primary/20"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                    </div>
                  )}

                  {/* Edit Mode Content */}
                  {isEditMode ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Scripture Reference
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => suggestScripture(selectedVision.description, selectedVision.title, selectedVision.category, true)}
                            disabled={isSuggestingScripture}
                            className="ml-auto gap-1 text-xs"
                          >
                            {isSuggestingScripture ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Suggesting...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-3 w-3" />
                                AI Suggest
                              </>
                            )}
                          </Button>
                        </Label>
                        <Input
                          value={editFormData.scripture_reference}
                          onChange={(e) => setEditFormData({ ...editFormData, scripture_reference: e.target.value })}
                          placeholder="e.g., Joel 2:28, Acts 2:17"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Reflection Notes</Label>
                        <Textarea
                          value={editFormData.reflection_notes}
                          onChange={(e) => setEditFormData({ ...editFormData, reflection_notes: e.target.value })}
                          placeholder="Your thoughts, interpretations, or what God revealed..."
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Background Image
                          </Label>
                          <input
                            ref={editImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => editImageInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="w-full"
                          >
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Change Image
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            Background Music
                          </Label>
                          <input
                            ref={editAudioInputRef}
                            type="file"
                            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                            onChange={(e) => handleAudioUpload(e, true)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => editAudioInputRef.current?.click()}
                            disabled={isUploadingAudio}
                            className="w-full"
                          >
                            {isUploadingAudio ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Change Audio
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode Content */
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span>{selectedVision.dreamer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>
                            {new Date(selectedVision.date_received).toLocaleDateString(
                              "en-US",
                              { year: "numeric", month: "long", day: "numeric" }
                            )}
                          </span>
                        </div>
                        {selectedVision.scripture_reference && (
                          <div className="flex items-center gap-2">
                            <Book className="h-4 w-4 text-primary" />
                            <span>{selectedVision.scripture_reference}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          Description
                        </h4>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {selectedVision.description}
                        </p>
                      </div>

                      {selectedVision.reflection_notes && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Reflection Notes
                          </h4>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {selectedVision.reflection_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default VisionsDreams;
