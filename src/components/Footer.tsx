import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Heart, MapPin, Phone, Mail, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/ybf-logo.jpeg";

const Footer = () => {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [testimony, setTestimony] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (user?.email) return user.email.split('@')[0];
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitterName = user ? getUserDisplayName() : name.trim();
    if (!submitterName || !testimony.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('testimonies')
      .insert([
        {
          name: submitterName,
          testimony: testimony.trim(),
          approved: true,
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit your testimony. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Testimony Submitted!",
      description: "Thank you for sharing your testimony with us.",
    });
    setName("");
    setTestimony("");
  };

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Messages", path: "/messages" },
    { name: "Gallery", path: "/gallery" },
    { name: "Testimonies", path: "/testimonies" },
    { name: "Q&A", path: "/qa" },
  ];

  const resources = [
    { name: "Books", path: "/books" },
    { name: "Blog", path: "/blog" },
    { name: "GospelBuddy AI", path: "/gospel-buddy" },
    { name: "Prayer Requests", path: "/prayer-requests" },
    { name: "Install App", path: "/install" },
  ];

  return (
    <footer className="relative bg-foreground text-background overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={logo} alt="YBFI Logo" className="h-12 w-12 rounded-xl shadow-lg" />
              <span className="font-display font-bold text-xl">YBFI</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              Building Believers through the Word of Faith and the Release of the Supernatural.
            </p>
            <div className="flex flex-col gap-2 text-sm text-background/70">
              <a href="mailto:justiceadam673@gmail.com" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Mail className="h-4 w-4" />
                justiceadam673@gmail.com
              </a>
              <a href="tel:+2349018281266" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="h-4 w-4" />
                +234 901 828 1266
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-background/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Resources</h4>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-background/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <a 
                  href="https://chat.whatsapp.com/DzxsuHOQQpo6II0RK22VN0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 hover:text-accent transition-colors text-sm flex items-center gap-1"
                >
                  WhatsApp Group
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Testimony Form */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent" />
              Share Your Testimony
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-background/10 border border-background/20">
                  <User className="w-4 h-4 text-accent" />
                  <span className="text-sm text-background/80">Sharing as <strong className="text-background">{getUserDisplayName()}</strong></span>
                </div>
              ) : (
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/50 focus:border-accent"
                />
              )}
              <Textarea
                placeholder="Share your testimony..."
                value={testimony}
                onChange={(e) => setTestimony(e.target.value)}
                rows={3}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/50 focus:border-accent resize-none"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Testimony"}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
            <p>
              © {new Date().getFullYear()} Young Builders Foundation International. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-accent fill-accent" /> for the Kingdom
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
