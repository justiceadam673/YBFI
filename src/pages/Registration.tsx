import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Plus, ClipboardList, Loader2, ImageIcon, Trash2, Copy, Mail, Pencil, X } from "lucide-react";
import { format } from "date-fns";

interface CustomField {
  id: string;
  label: string;
  required: boolean;
}

interface Program {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location: string | null;
  max_participants: number | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  custom_fields?: CustomField[];
}

interface Registration {
  id: string;
  program_id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  denomination: string | null;
  special_request: string | null;
  status: string;
  created_at: string;
  custom_field_values?: Record<string, string>;
}

const Registration = () => {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [programRegistrations, setProgramRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set());

  // Edit program state
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", description: "", start_date: "", end_date: "",
    registration_deadline: "", location: "", max_participants: "",
  });
  const [editCustomFields, setEditCustomFields] = useState<CustomField[]>([]);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Custom field values for registration
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Add Program form state
  const [programForm, setProgramForm] = useState({
    title: "", description: "", start_date: "", end_date: "",
    registration_deadline: "", location: "", max_participants: "",
  });

  // Registration form state
  const [regForm, setRegForm] = useState({
    name: "", email: "", phone: "", gender: "", denomination: "", special_request: "",
  });

  const fetchUserRegistrations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("program_registrations")
      .select("program_id")
      .eq("user_id", user.id);
    if (data) setUserRegistrations(new Set(data.map(r => r.program_id)));
  };

  useEffect(() => {
    fetchPrograms();
    if (isAdmin) fetchAllPrograms();
    if (user) fetchUserRegistrations();

    const channel = supabase
      .channel("programs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "programs" }, () => { fetchPrograms(); if (isAdmin) fetchAllPrograms(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "program_registrations" }, () => { fetchPrograms(); if (isAdmin) fetchAllPrograms(); fetchUserRegistrations(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, user]);

  useEffect(() => {
    if (profile) {
      setRegForm(prev => ({
        ...prev,
        name: profile.display_name || "",
        email: user?.email || "",
      }));
    }
  }, [profile, user]);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("is_active", true)
      .order("start_date", { ascending: true });

    if (!error && data) {
      setPrograms(data as unknown as Program[]);
      const counts: Record<string, number> = {};
      for (const p of data) {
        const { count } = await supabase
          .from("program_registrations")
          .select("*", { count: "exact", head: true })
          .eq("program_id", p.id);
        counts[p.id] = count || 0;
      }
      setRegistrationCounts(counts);
    }
    setLoading(false);
  };

  const fetchAllPrograms = async () => {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAllPrograms(data as unknown as Program[]);
      const counts: Record<string, number> = {};
      for (const p of data) {
        if (!registrationCounts[p.id]) {
          const { count } = await supabase
            .from("program_registrations")
            .select("*", { count: "exact", head: true })
            .eq("program_id", p.id);
          counts[p.id] = count || 0;
        }
      }
      setRegistrationCounts(prev => ({ ...prev, ...counts }));
    }
  };

  const fetchProgramRegistrations = async (programId: string) => {
    setLoadingRegistrations(true);
    const { data, error } = await supabase
      .from("program_registrations")
      .select("*")
      .eq("program_id", programId)
      .order("created_at", { ascending: true });
    if (!error && data) setProgramRegistrations(data as unknown as Registration[]);
    setLoadingRegistrations(false);
  };

  const handleViewProgram = (program: Program) => {
    setViewingProgram(program);
    setProgramRegistrations([]);
    fetchProgramRegistrations(program.id);
  };

  const handleCopyRegistrations = async () => {
    const customFields: CustomField[] = (viewingProgram as any)?.custom_fields || [];
    const header = ["Name", "Email", "Phone", "Gender", "Denomination", "Special Request", ...customFields.map(f => f.label), "Date Registered"].join("\t");
    const rows = programRegistrations.map(r => {
      const cfValues = (r as any).custom_field_values || {};
      return [r.name, r.email, r.phone, r.gender, r.denomination || '-', r.special_request || '-', ...customFields.map(f => cfValues[f.id] || '-'), format(new Date(r.created_at), "MMM d, yyyy")].join("\t");
    });
    await navigator.clipboard.writeText([header, ...rows].join("\n"));
    toast({ title: "Copied!", description: "Registration data copied to clipboard." });
  };

  const handleEmailRegistrations = async () => {
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-notification", {
        body: {
          type: "registration_report",
          to: "justiceadam673@gmail.com",
          data: {
            programTitle: viewingProgram?.title,
            registrations: programRegistrations,
          },
        },
      });
      if (error) throw error;
      toast({ title: "Email sent!", description: "Registration report sent to justiceadam673@gmail.com." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send email.", variant: "destructive" });
    }
    setSendingEmail(false);
  };

  const handleDeleteProgram = async (programId: string) => {
    const { error } = await supabase.from("programs").delete().eq("id", programId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Program has been deleted successfully." });
    }
  };

  const handleAddProgram = async () => {
    if (!programForm.title || !programForm.start_date || !programForm.end_date || !programForm.registration_deadline) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    let image_url = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("program-images").upload(path, imageFile);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("program-images").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("programs").insert({
      title: programForm.title,
      description: programForm.description || null,
      image_url,
      start_date: programForm.start_date,
      end_date: programForm.end_date,
      registration_deadline: programForm.registration_deadline,
      location: programForm.location || null,
      max_participants: programForm.max_participants ? parseInt(programForm.max_participants) : null,
      created_by: user!.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Program added!", description: "The program has been created successfully." });
      setProgramForm({ title: "", description: "", start_date: "", end_date: "", registration_deadline: "", location: "", max_participants: "" });
      setImageFile(null);
      setAddDialogOpen(false);
    }
    setSubmitting(false);
  };

  // Edit program handlers
  const openEditDialog = (program: Program) => {
    setEditingProgram(program);
    setEditForm({
      title: program.title,
      description: program.description || "",
      start_date: program.start_date,
      end_date: program.end_date,
      registration_deadline: program.registration_deadline,
      location: program.location || "",
      max_participants: program.max_participants?.toString() || "",
    });
    setEditCustomFields((program as any).custom_fields || []);
    setEditImageFile(null);
  };

  const handleAddCustomField = () => {
    setEditCustomFields(prev => [...prev, { id: crypto.randomUUID(), label: "", required: false }]);
  };

  const handleRemoveCustomField = (id: string) => {
    setEditCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomField>) => {
    setEditCustomFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSaveEdit = async () => {
    if (!editingProgram) return;
    if (!editForm.title || !editForm.start_date || !editForm.end_date || !editForm.registration_deadline) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    // Validate custom fields have labels
    const validFields = editCustomFields.filter(f => f.label.trim());
    setEditSubmitting(true);

    let image_url = editingProgram.image_url;
    if (editImageFile) {
      const ext = editImageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("program-images").upload(path, editImageFile);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setEditSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("program-images").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("programs").update({
      title: editForm.title,
      description: editForm.description || null,
      image_url,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      registration_deadline: editForm.registration_deadline,
      location: editForm.location || null,
      max_participants: editForm.max_participants ? parseInt(editForm.max_participants) : null,
      custom_fields: validFields as unknown as any,
    }).eq("id", editingProgram.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated!", description: "Program has been updated successfully." });
      setEditingProgram(null);
    }
    setEditSubmitting(false);
  };

  const handleRegister = async () => {
    if (!selectedProgram || !regForm.name || !regForm.email || !regForm.phone || !regForm.gender) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    // Validate required custom fields
    const customFields: CustomField[] = (selectedProgram as any)?.custom_fields || [];
    for (const field of customFields) {
      if (field.required && !customFieldValues[field.id]?.trim()) {
        toast({ title: "Missing fields", description: `Please fill in "${field.label}".`, variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);

    const { error } = await supabase.from("program_registrations").insert({
      program_id: selectedProgram.id,
      user_id: user!.id,
      name: regForm.name,
      email: regForm.email,
      phone: regForm.phone,
      gender: regForm.gender,
      denomination: regForm.denomination || null,
      special_request: regForm.special_request || null,
      custom_field_values: customFieldValues as unknown as any,
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already registered", description: "You have already registered for this program.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Registered!", description: `You have successfully registered for ${selectedProgram.title}.` });
      setUserRegistrations(prev => new Set(prev).add(selectedProgram.id));
      setRegDialogOpen(false);
      setRegForm(prev => ({ ...prev, phone: "", gender: "", denomination: "", special_request: "" }));
      setCustomFieldValues({});
    }
    setSubmitting(false);
  };

  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();
  const isFull = (program: Program) => program.max_participants ? (registrationCounts[program.id] || 0) >= program.max_participants : false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxek0yNCAzNmgxMnYtMkgyNHYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Program Registration
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Browse upcoming programs and register to participate. Stay connected and grow with us.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="register" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Register
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Program
              </TabsTrigger>
            )}
          </TabsList>

          {/* Register for a Program Tab */}
          <TabsContent value="register">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-20">
                <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Programs Available</h3>
                <p className="text-muted-foreground">Check back later for upcoming programs.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {programs.map((program) => {
                  const deadlinePassed = isDeadlinePassed(program.registration_deadline);
                  const full = isFull(program);
                  return (
                    <Card key={program.id} className="glass-card hover-lift overflow-hidden">
                      {program.image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      {!program.image_url && (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{program.title}</CardTitle>
                          {deadlinePassed && <Badge variant="destructive">Closed</Badge>}
                          {full && !deadlinePassed && <Badge variant="secondary">Full</Badge>}
                          {!deadlinePassed && !full && <Badge className="bg-primary/10 text-primary border-primary/20">Open</Badge>}
                        </div>
                        {program.description && (
                          <CardDescription className="line-clamp-2">{program.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(program.start_date), "MMM d")} - {format(new Date(program.end_date), "MMM d, yyyy")}</span>
                        </div>
                        {program.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{program.location}</span>
                          </div>
                        )}
                        {program.max_participants && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{registrationCounts[program.id] || 0} / {program.max_participants} spots</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Registration deadline: {format(new Date(program.registration_deadline), "MMM d, yyyy")}
                        </p>
                        {userRegistrations.has(program.id) ? (
                          <Button className="w-full bg-emerald-600/90 hover:bg-emerald-600/90 text-primary-foreground cursor-default" disabled>
                            ✓ Registered
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            disabled={deadlinePassed || full}
                            onClick={() => {
                              setSelectedProgram(program);
                              setCustomFieldValues({});
                              setRegDialogOpen(true);
                            }}
                          >
                            {deadlinePassed ? "Registration Closed" : full ? "Program Full" : "Register Now"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Add Program Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="add">
              <Card className="glass-card max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Create a New Program</CardTitle>
                  <CardDescription>Fill in the details to add a new program for registration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Program Title *</Label>
                    <Input id="title" placeholder="e.g. Youth Conference 2026" value={programForm.title} onChange={e => setProgramForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe the program..." value={programForm.description} onChange={e => setProgramForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Program Image</Label>
                    <Input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input id="start_date" type="date" value={programForm.start_date} onChange={e => setProgramForm(p => ({ ...p, start_date: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input id="end_date" type="date" value={programForm.end_date} onChange={e => setProgramForm(p => ({ ...p, end_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg_deadline">Registration Deadline *</Label>
                      <Input id="reg_deadline" type="date" value={programForm.registration_deadline} onChange={e => setProgramForm(p => ({ ...p, registration_deadline: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_participants">Max Participants</Label>
                      <Input id="max_participants" type="number" placeholder="Leave empty for unlimited" value={programForm.max_participants} onChange={e => setProgramForm(p => ({ ...p, max_participants: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g. Main Church Hall" value={programForm.location} onChange={e => setProgramForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <Button onClick={handleAddProgram} disabled={submitting} className="w-full">
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : "Create Program"}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Programs List */}
              <div className="max-w-2xl mx-auto mt-8">
                <h3 className="text-xl font-semibold mb-4">Existing Programs</h3>
                {allPrograms.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No programs created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {allPrograms.map((program) => (
                      <Card
                        key={program.id}
                        className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all border-l-4 border-l-primary/60"
                        onClick={() => handleViewProgram(program)}
                      >
                        <CardContent className="flex items-stretch p-0">
                          {/* Program Image Thumbnail */}
                          <div className="w-24 sm:w-32 shrink-0 relative overflow-hidden bg-muted">
                            {program.image_url ? (
                              <img
                                src={program.image_url}
                                alt={program.title}
                                className="w-full h-full object-cover absolute inset-0"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          {/* Program Details */}
                          <div className="flex-1 min-w-0 p-4 flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold truncate">{program.title}</h4>
                                <Badge variant={program.is_active ? "default" : "secondary"} className="text-xs">
                                  {program.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(program.start_date), "MMM d")} - {format(new Date(program.end_date), "MMM d, yyyy")}
                                </span>
                                {program.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {program.location}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {registrationCounts[program.id] || 0} registered
                                  {program.max_participants ? ` / ${program.max_participants}` : ""}
                                </span>
                              </div>
                              {((program as any).custom_fields || []).length > 0 && (
                                <p className="text-xs text-primary/70 mt-1">
                                  {((program as any).custom_fields || []).length} custom field(s)
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); openEditDialog(program); }}
                                title="Edit program"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" onClick={(e) => e.stopPropagation()}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Program</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{program.title}"? This action cannot be undone and will also remove all registrations for this program.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProgram(program.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Registration Dialog */}
      <Dialog open={regDialogOpen} onOpenChange={setRegDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register for {selectedProgram?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name *</Label>
              <Input id="reg-name" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email *</Label>
              <Input id="reg-email" type="email" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Phone Number *</Label>
              <Input id="reg-phone" type="tel" placeholder="+234..." value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-gender">Gender *</Label>
              <Select value={regForm.gender} onValueChange={v => setRegForm(p => ({ ...p, gender: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-denomination">Denomination</Label>
              <Input id="reg-denomination" placeholder="e.g. Baptist, Catholic..." value={regForm.denomination} onChange={e => setRegForm(p => ({ ...p, denomination: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-special">Special Request</Label>
              <Textarea id="reg-special" placeholder="Any special needs or requests..." value={regForm.special_request} onChange={e => setRegForm(p => ({ ...p, special_request: e.target.value }))} />
            </div>

            {/* Dynamic Custom Fields */}
            {selectedProgram && ((selectedProgram as any).custom_fields || []).length > 0 && (
              <>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Additional Information</p>
                </div>
                {((selectedProgram as any).custom_fields as CustomField[]).map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={`cf-${field.id}`}>
                      {field.label} {field.required && "*"}
                    </Label>
                    <Input
                      id={`cf-${field.id}`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={customFieldValues[field.id] || ""}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  </div>
                ))}
              </>
            )}

            <Button onClick={handleRegister} disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Registering...</> : "Submit Registration"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Program Dialog */}
      <Dialog open={!!editingProgram} onOpenChange={(open) => { if (!open) setEditingProgram(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Update program details and manage custom registration fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Program Title *</Label>
              <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Program Image</Label>
              {editingProgram?.image_url && !editImageFile && (
                <img src={editingProgram.image_url} alt="Current" className="w-full h-32 object-cover rounded-md mb-2" />
              )}
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setEditImageFile(e.target.files?.[0] || null)} />
              {editImageFile && <p className="text-xs text-muted-foreground">New image selected: {editImageFile.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={editForm.start_date} onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={editForm.end_date} onChange={e => setEditForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Deadline *</Label>
                <Input type="date" value={editForm.registration_deadline} onChange={e => setEditForm(p => ({ ...p, registration_deadline: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Max Participants</Label>
                <Input type="number" placeholder="Unlimited" value={editForm.max_participants} onChange={e => setEditForm(p => ({ ...p, max_participants: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} />
            </div>

            {/* Custom Fields Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Custom Registration Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField} className="flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Field
                </Button>
              </div>
              {editCustomFields.length === 0 && (
                <p className="text-sm text-muted-foreground">No custom fields yet. Add fields to collect extra info from registrants.</p>
              )}
              {editCustomFields.map((field) => (
                <div key={field.id} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                  <Input
                    placeholder="Field label (e.g. Shirt Size)"
                    value={field.label}
                    onChange={e => handleUpdateCustomField(field.id, { label: e.target.value })}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Label className="text-xs text-muted-foreground">Required</Label>
                    <Switch
                      checked={field.required}
                      onCheckedChange={checked => handleUpdateCustomField(field.id, { required: checked })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCustomField(field.id)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={handleSaveEdit} disabled={editSubmitting} className="w-full">
              {editSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registrations Viewer Dialog */}
      <Dialog open={!!viewingProgram} onOpenChange={(open) => { if (!open) setViewingProgram(null); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingProgram?.title} — Registrations ({programRegistrations.length})</DialogTitle>
            <DialogDescription>View all registered participants for this program.</DialogDescription>
          </DialogHeader>
          {loadingRegistrations ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : programRegistrations.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No registrations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Denomination</TableHead>
                  <TableHead>Special Request</TableHead>
                  {((viewingProgram as any)?.custom_fields as CustomField[] || []).map(f => (
                    <TableHead key={f.id}>{f.label}</TableHead>
                  ))}
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programRegistrations.map((r) => {
                  const cfValues = (r as any).custom_field_values || {};
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{r.phone}</TableCell>
                      <TableCell className="capitalize">{r.gender}</TableCell>
                      <TableCell>{r.denomination || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.special_request || "-"}</TableCell>
                      {((viewingProgram as any)?.custom_fields as CustomField[] || []).map(f => (
                        <TableCell key={f.id}>{cfValues[f.id] || "-"}</TableCell>
                      ))}
                      <TableCell>{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {programRegistrations.length > 0 && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleCopyRegistrations} className="flex items-center gap-2">
                <Copy className="h-4 w-4" /> Copy to Clipboard
              </Button>
              <Button onClick={handleEmailRegistrations} disabled={sendingEmail} className="flex items-center gap-2">
                {sendingEmail ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Mail className="h-4 w-4" /> Send to Email</>}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Registration;
