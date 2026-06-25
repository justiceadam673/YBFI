import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, Loader2, IdCard, User, Mail, Phone, Calendar, MapPin, Lock } from "lucide-react";

interface ParticipantRecord {
  id: string;
  participant_code: string | null;
  name: string;
  email: string;
  phone: string;
  gender: string;
  denomination: string | null;
  special_request: string | null;
  photo_url: string | null;
  created_at: string;
  program_id: string;
  programTitle?: string;
}

const AdminParticipants = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ParticipantRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const verifyPassword = async () => {
    if (!password.trim()) {
      toast({ title: "Please enter the admin password", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-password", {
        body: { password, action: "admin_users" },
      });
      if (error || !data?.valid) {
        toast({ title: "Invalid password", variant: "destructive" });
      } else {
        setIsVerified(true);
      }
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleSearch = async () => {
    const term = query.trim();
    if (!term) {
      toast({ title: "Enter a participant code or name to search", variant: "destructive" });
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase
        .from("program_registrations")
        .select("*")
        .or(`participant_code.ilike.%${term}%,name.ilike.%${term}%`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const records = (data || []) as ParticipantRecord[];
      const programIds = [...new Set(records.map((r) => r.program_id))];
      if (programIds.length) {
        const { data: programs } = await supabase
          .from("programs")
          .select("id, title")
          .in("id", programIds);
        const titleMap = new Map((programs || []).map((p) => [p.id, p.title]));
        records.forEach((r) => (r.programTitle = titleMap.get(r.program_id)));
      }
      setResults(records);
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto max-w-4xl flex-1 px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground">Participant Lookup</h1>
          <p className="mt-2 text-muted-foreground">
            Search registered participants by their unique code or name and view their tag details.
          </p>
        </div>

        {!isVerified ? (
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>Enter the admin password to continue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
              />
              <Button className="w-full" onClick={verifyPassword} disabled={verifying}>
                {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Unlock
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mx-auto mb-8 flex max-w-xl gap-2">
              <Input
                placeholder="Search by unique code or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">Search</span>
              </Button>
            </div>

            {hasSearched && !searching && results.length === 0 && (
              <p className="text-center text-muted-foreground">No participants found.</p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {results.map((r) => (
                <Card key={r.id} className="overflow-hidden">
                  <CardContent className="flex gap-4 p-5">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                      {r.photo_url ? (
                        <img src={r.photo_url} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <IdCard className="h-4 w-4 shrink-0 text-primary" />
                        <Badge variant="secondary" className="font-mono">
                          {r.participant_code || "—"}
                        </Badge>
                      </div>
                      <h3 className="truncate font-serif text-lg font-semibold">{r.name}</h3>
                      {r.programTitle && (
                        <p className="truncate text-sm font-medium text-muted-foreground">{r.programTitle}</p>
                      )}
                      <div className="space-y-1 pt-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> <span className="truncate">{r.email}</span></p>
                        <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {r.phone}</p>
                        <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {[r.gender, r.denomination].filter(Boolean).join(" • ")}</p>
                        <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {format(new Date(r.created_at), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminParticipants;
