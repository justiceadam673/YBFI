import { useState, useEffect } from "react";
import { Quote, Sparkles, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Testimonies = () => {
  const [dbTestimonies, setDbTestimonies] = useState<
    Array<{ name: string; testimony: string }>
  >([]);

  useEffect(() => {
    const fetchTestimonies = async () => {
      const { data, error } = await supabase
        .from("testimonies")
        .select("name, testimony")
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDbTestimonies(data);
      }
    };

    fetchTestimonies();

    const channel = supabase
      .channel("testimonies-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "testimonies",
          filter: "approved=eq.true",
        },
        () => {
          fetchTestimonies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/10" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Stories of Transformation
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
                <span className="text-gradient">Testimonies</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Hear from young builders whose lives have been transformed by faith
              </p>
            </div>
          </div>
        </section>

        {/* Testimonies Grid */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {dbTestimonies.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <Quote className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No testimonies yet. Be the first to share your story!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dbTestimonies.map((item, index) => (
                  <Card
                    key={index}
                    className="group glass-card border-border/50 hover:shadow-elegant hover:border-accent/20 transition-all duration-500 animate-fade-in overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="pt-8 pb-6 px-6 relative">
                      <div className="absolute top-4 right-4 w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Quote className="w-6 h-6 text-accent" />
                      </div>
                      <p className="text-foreground/80 mb-6 leading-relaxed italic text-lg pr-12">
                        "{item.testimony}"
                      </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <p className="font-bold text-foreground">— {item.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-16 text-center p-10 glass-card rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
              <div className="relative z-10">
                <Quote className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Share Your Story</h3>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Has Young Builders Foundation impacted your life? We'd love to
                  hear your testimony. Use the form in the footer below to share
                  your story with us.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Testimonies;