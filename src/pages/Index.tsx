import { useState, useEffect } from "react";
import {
  Send,
  Heart,
  Users,
  Target,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroCarousel from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [announcements, setAnnouncements] = useState<
    Array<{ id: string; title: string; content: string }>
  >([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAnnouncementIndex((prev) =>
          prev === announcements.length - 1 ? 0 : prev + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setAnnouncements(data);
  };

  const nextAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) =>
      prev === announcements.length - 1 ? 0 : prev + 1
    );
  };

  const prevAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) =>
      prev === 0 ? announcements.length - 1 : prev - 1
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("contact_submissions").insert([
      {
        name: formData.name,
        email: formData.email,
        message: formData.message,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit your message. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const emailSubject = encodeURIComponent(`Contact from ${formData.name}`);
    const emailBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    const whatsappMessage = encodeURIComponent(
      `*Contact Form Submission*\n\nName: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );

    window.open(
      `mailto:justiceadam673@gmail.com?subject=${emailSubject}&body=${emailBody}`,
      "_blank"
    );

    window.open(
      `https://wa.me/2349018281266?text=${whatsappMessage}`,
      "_blank"
    );

    toast({
      title: "Message Sent!",
      description: "Your message has been saved and forwarded.",
    });
    setFormData({ name: "", email: "", message: "" });
  };

  const features = [
    {
      icon: Heart,
      title: "GOSPEL",
      description: "Changing a Generation through the Teaching of the Word of Faith and the Release of the Supernatural.",
      scripture: "Romans 1:16-17",
      gradient: "from-rose-500 to-pink-600",
    },
    {
      icon: Users,
      title: "GROWTH",
      description: "We are Committed to Growing a Community of Strong Men and Women in every aspect and works of Life.",
      scripture: "1 Samuel 22:2",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: Target,
      title: "GOLD",
      description: "Prosperity is God's will for Every Believer. We are Committed to Raising a Joyful and Prosperous Family.",
      scripture: "3 John 1:2",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <HeroCarousel />

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <section className="py-8 md:py-12 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="shadow-medium border-0 overflow-hidden bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="w-14 h-14 bg-gradient-accent rounded-2xl flex items-center justify-center flex-shrink-0 shadow-gold">
                      <Megaphone className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="text-xs font-medium text-accent uppercase tracking-wider">Announcement</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-display font-bold mb-2">
                        {announcements[currentAnnouncementIndex]?.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {announcements[currentAnnouncementIndex]?.content}
                      </p>
                    </div>
                  </div>

                  {announcements.length > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevAnnouncement}
                        className="hover:bg-primary/10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div className="flex gap-2">
                        {announcements.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentAnnouncementIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === currentAnnouncementIndex
                                ? "bg-primary w-6"
                                : "bg-muted w-2 hover:bg-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextAnnouncement}
                        className="hover:bg-primary/10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Heart className="h-4 w-4" />
                About Our Mission
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                Building Believers Through
                <span className="text-gradient block mt-2">Faith & Supernatural Power</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Solving the Problems of Distress, Discontent and Debt through the Instrument of The Gospel, Growth and Gold.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="group relative overflow-hidden border-0 shadow-soft hover:shadow-elevated transition-all duration-500 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <CardContent className="p-8 relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {feature.description}
                    </p>
                    <span className="text-sm font-medium text-primary">
                      {feature.scripture}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 md:py-28 gradient-subtle">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in">
              <span className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Send className="h-4 w-4" />
                Get In Touch
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Contact Us
              </h2>
              <p className="text-lg text-muted-foreground">
                Have questions or want to get involved? We'd love to hear from you.
              </p>
            </div>

            <Card className="shadow-elevated border-0 overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Name</label>
                      <Input
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Email</label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Message</label>
                    <Textarea
                      placeholder="How can we help you?"
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="resize-none"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full group">
                    Send Message
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
