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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Plus, ClipboardList, Loader2, ImageIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";

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

  // Add Program form state
  const [programForm, setProgramForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    location: "",
    max_participants: "",
  });

  // Registration form state
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    denomination: "",
    special_request: "",
  });

  useEffect(() => {
    fetchPrograms();
    if (isAdmin) fetchAllPrograms();

    const channel = supabase
      .channel("programs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "programs" }, () => { fetchPrograms(); if (isAdmin) fetchAllPrograms(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "program_registrations" }, () => { fetchPrograms(); if (isAdmin) fetchAllPrograms(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

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
      setPrograms(data);
      // Fetch registration counts for each program
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
      setAllPrograms(data);
      // Also fetch counts for all programs
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

  const handleRegister = async () => {
    if (!selectedProgram || !regForm.name || !regForm.email || !regForm.phone || !regForm.gender) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
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
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already registered", description: "You have already registered for this program.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Registered!", description: `You have successfully registered for ${selectedProgram.title}.` });
      setRegDialogOpen(false);
      setRegForm(prev => ({ ...prev, phone: "", gender: "", denomination: "", special_request: "" }));
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
                        <Button
                          className="w-full"
                          disabled={deadlinePassed || full}
                          onClick={() => { setSelectedProgram(program); setRegDialogOpen(true); }}
                        >
                          {deadlinePassed ? "Registration Closed" : full ? "Program Full" : "Register Now"}
                        </Button>
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
                  <div className="space-y-3">
                    {allPrograms.map((program) => (
                      <Card key={program.id} className="glass-card">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{program.title}</h4>
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
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="ml-3 shrink-0">
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
            <Button onClick={handleRegister} disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Registering...</> : "Submit Registration"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Registration;
