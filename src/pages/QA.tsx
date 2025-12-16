import { useState } from "react";
import { HelpCircle, Send, Sparkles, MessageCircle, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const faqs = [
  {
    question: "What is Young Builders Foundation International?",
    answer: "Young Builders Foundation International is a youth-focused organization dedicated to empowering young people through faith-based mentorship, leadership development, and community engagement. We provide a supportive environment where youth can grow spiritually, develop their talents, and build lasting relationships.",
  },
  {
    question: "Who can join the foundation?",
    answer: "Our foundation welcomes all young people who are eager to grow in their faith, develop leadership skills, and be part of a positive community. We believe in inclusivity and creating a space where everyone can thrive.",
  },
  {
    question: "What kind of activities does the foundation organize?",
    answer: "We organize a variety of activities including fellowship gatherings, mentorship sessions, leadership workshops, community service projects, spiritual retreats, and educational programs. Each activity is designed to help young people grow holistically.",
  },
  {
    question: "How can I get involved?",
    answer: "Getting involved is easy! You can reach out through our contact form, attend one of our events, or connect with us through our community outreach programs. We're always excited to welcome new members into the Young Builders family.",
  },
  {
    question: "Is there a membership fee?",
    answer: "We believe in making our programs accessible to all young people. While some specific events or programs may have associated costs, general membership and participation in most activities are free. Our goal is to remove barriers and create opportunities for all youth.",
  },
];

const QA = () => {
  const { user, profile } = useAuth();
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUserDisplayName = () => {
    if (profile?.display_name) return profile.display_name;
    if (user?.email) return user.email.split('@')[0];
    return "";
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-primary to-primary/70',
      'from-accent to-accent/70',
      'from-blue-500 to-blue-400',
      'from-purple-500 to-purple-400',
      'from-pink-500 to-pink-400',
      'from-indigo-500 to-indigo-400',
      'from-teal-500 to-teal-400',
      'from-orange-500 to-orange-400',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitterName = user ? getUserDisplayName() : name.trim();
    const submitterEmail = user?.email || email.trim();
    
    if (!submitterName || !submitterEmail || !question.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('questions')
      .insert([
        {
          name: submitterName,
          email: submitterEmail,
          question: question.trim(),
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit your question. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Question Submitted!",
      description: "Thank you for your question. We'll respond soon.",
    });
    setName("");
    setEmail("");
    setQuestion("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Get Answers
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
                Questions & <span className="text-gradient">Answers</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Find answers to common questions about Young Builders Foundation
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* FAQs */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`} 
                    className="glass-card border-border/50 rounded-xl px-6 overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Submit Question */}
            <Card className="glass-card border-border/50 overflow-hidden">
              <CardContent className="pt-8 pb-8 px-6 md:px-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Submit Your Question</h2>
                    <p className="text-muted-foreground text-sm">Can't find your answer? Ask us directly!</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {user ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(getUserDisplayName())} flex items-center justify-center shadow-sm`}>
                          <span className="text-white font-semibold text-xs">{getInitials(getUserDisplayName())}</span>
                        </div>
                      )}
                      <span className="text-sm">Asking as <strong>{getUserDisplayName()}</strong> ({user.email})</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-border/50 focus:border-primary"
                      />
                      <Input
                        type="email"
                        placeholder="Your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-border/50 focus:border-primary"
                      />
                    </div>
                  )}
                  <Textarea
                    placeholder="Your Question"
                    rows={4}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="border-border/50 focus:border-primary"
                  />
                  <Button type="submit" className="w-full gap-2 shadow-elegant hover:shadow-gold transition-all" disabled={isSubmitting}>
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Submitting..." : "Submit Question"}
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

export default QA;