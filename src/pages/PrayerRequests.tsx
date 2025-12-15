import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Heart, Plus, Send, Users, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isToday, isThisWeek, startOfToday, startOfWeek } from "date-fns";

interface PrayerRequest {
  id: string;
  name: string;
  prayer: string;
  prayer_count: number;
  is_anonymous: boolean;
  created_at: string;
}

type DateFilter = "all" | "today" | "week";

const PrayerRequests = () => {
  const [name, setName] = useState("");
  const [prayer, setPrayer] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prayedFor, setPrayedFor] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const queryClient = useQueryClient();

  // Load prayed for from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ybf_prayed_for");
    if (saved) {
      setPrayedFor(new Set(JSON.parse(saved)));
    }
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["prayer-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PrayerRequest[];
    },
  });

  // Filter requests by date
  const filteredRequests = useMemo(() => {
    if (dateFilter === "all") return requests;
    
    return requests.filter((request) => {
      const date = new Date(request.created_at);
      if (dateFilter === "today") return isToday(date);
      if (dateFilter === "week") return isThisWeek(date, { weekStartsOn: 0 });
      return true;
    });
  }, [requests, dateFilter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("prayer-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prayer_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("prayer_requests").insert({
        name: isAnonymous ? "Anonymous" : name.trim(),
        prayer: prayer.trim(),
        is_anonymous: isAnonymous,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prayer request submitted! Others will pray for you.");
      setName("");
      setPrayer("");
      setIsAnonymous(false);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    },
    onError: (error) => {
      console.error("Submit error:", error);
      toast.error("Failed to submit prayer request. Please try again.");
    },
  });

  const prayMutation = useMutation({
    mutationFn: async (id: string) => {
      const request = requests.find((r) => r.id === id);
      if (!request) return;

      const { error } = await supabase
        .from("prayer_requests")
        .update({ prayer_count: request.prayer_count + 1 })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      if (id) {
        const newPrayedFor = new Set(prayedFor);
        newPrayedFor.add(id);
        setPrayedFor(newPrayedFor);
        localStorage.setItem("ybf_prayed_for", JSON.stringify([...newPrayedFor]));
      }
      toast.success("Thank you for praying! 🙏");
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnonymous && !name.trim()) {
      toast.error("Please enter your name or choose anonymous");
      return;
    }
    if (!prayer.trim()) {
      toast.error("Please enter your prayer request");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
              Prayer Requests
            </h1>
            <p className="text-muted-foreground">
              Share your prayer needs and join others in prayer
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <Tabs value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  All Time
                </TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Submit Prayer Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit a Prayer Request</DialogTitle>
                  <DialogDescription>
                    Share your prayer need and let others pray for you.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    />
                    <label htmlFor="anonymous" className="text-sm cursor-pointer">
                      Submit anonymously
                    </label>
                  </div>
                  {!isAnonymous && (
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  )}
                  <Textarea
                    placeholder="Share your prayer request..."
                    value={prayer}
                    onChange={(e) => setPrayer(e.target.value)}
                    rows={4}
                  />
                  <Button type="submit" className="w-full gap-2" disabled={submitMutation.isPending}>
                    <Send className="w-4 h-4" />
                    {submitMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading prayer requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {dateFilter === "all"
                  ? "No prayer requests yet. Be the first to share!"
                  : `No prayer requests for ${dateFilter === "today" ? "today" : "this week"}.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{request.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 mb-4 whitespace-pre-wrap">{request.prayer}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Users className="w-4 h-4" />
                        <span>{request.prayer_count} prayed</span>
                      </div>
                      <Button
                        variant={prayedFor.has(request.id) ? "secondary" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={() => prayMutation.mutate(request.id)}
                        disabled={prayedFor.has(request.id) || prayMutation.isPending}
                      >
                        <Heart className={`w-4 h-4 ${prayedFor.has(request.id) ? "fill-current" : ""}`} />
                        {prayedFor.has(request.id) ? "Prayed" : "I Prayed"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrayerRequests;
