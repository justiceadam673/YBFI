import { useState, useEffect } from "react";
import { Megaphone, Lock, Trash2, Sparkles, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const AdminAnnouncements = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnnouncements();

      const channel = supabase
        .channel('announcements-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'announcements' },
          () => {
            fetchAnnouncements();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAnnouncements(data);
  };

  const verifyPassword = async () => {
    const { data } = await supabase.functions.invoke('verify-admin-password', {
      body: { password, action: 'announcement' }
    });

    if (data?.valid) {
      setIsAuthenticated(true);
      toast({ title: "Access granted" });
    } else {
      toast({ title: "Invalid password", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('announcements')
      .insert([{ title: title.trim(), content: content.trim() }]);

    if (error) {
      toast({ title: "Error creating announcement", variant: "destructive" });
    } else {
      toast({ title: "Announcement created successfully" });
      setTitle("");
      setContent("");
      fetchAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error deleting announcement", variant: "destructive" });
    } else {
      toast({ title: "Announcement deleted" });
      fetchAnnouncements();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md glass-card border-border/50 shadow-elegant animate-fade-in">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-gold">
                  <Lock className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
                <p className="text-muted-foreground">
                  Enter password to manage announcements
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Admin Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                  className="border-border/50 focus:border-primary"
                />
                <Button onClick={verifyPassword} className="w-full shadow-elegant hover:shadow-gold transition-all">
                  Verify Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-10 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Admin Panel
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                Manage <span className="text-gradient">Announcements</span>
              </h1>
              <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Create and manage announcements that will appear on the home page
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Create Form */}
            <Card className="glass-card border-border/50 shadow-elegant mb-12 overflow-hidden">
              <CardContent className="pt-8 pb-8 px-6 md:px-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Create New Announcement</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Announcement Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-border/50 focus:border-primary"
                  />
                  <Textarea
                    placeholder="Announcement Content"
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="border-border/50 focus:border-primary"
                  />
                  <Button type="submit" className="w-full gap-2 shadow-elegant hover:shadow-gold transition-all">
                    <Megaphone className="w-4 h-4" />
                    Publish Announcement
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Announcements List */}
            {announcements.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-primary" />
                  All Announcements ({announcements.length})
                </h2>
                <div className="space-y-4">
                  {announcements.map((announcement, index) => (
                    <Card 
                      key={announcement.id} 
                      className="glass-card border-border/50 hover:shadow-elegant transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">{announcement.title}</h3>
                            <p className="text-muted-foreground mb-3">{announcement.content}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              Posted on {format(new Date(announcement.created_at), "PPP")}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(announcement.id)}
                            className="hover:shadow-md transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AdminAnnouncements;