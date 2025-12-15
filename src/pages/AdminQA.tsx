import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Sparkles, MessageCircle, CheckCircle, Clock, Send, Edit } from "lucide-react";

interface Question {
  id: string;
  name: string;
  email: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
}

const AdminQA = () => {
  const [unansweredQuestions, setUnansweredQuestions] = useState<Question[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
    const subscription = supabase
      .channel('questions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        fetchQuestions();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchQuestions = async () => {
    const { data: unanswered } = await supabase
      .from('questions')
      .select('*')
      .is('answer', null)
      .order('created_at', { ascending: false });

    const { data: answered } = await supabase
      .from('questions')
      .select('*')
      .not('answer', 'is', null)
      .order('answered_at', { ascending: false });

    setUnansweredQuestions(unanswered || []);
    setAnsweredQuestions(answered || []);
  };

  const verifyAnswerPassword = async (password: string) => {
    const { data } = await supabase.functions.invoke('verify-admin-password', {
      body: { password, action: 'qa_answers' }
    });
    return data?.valid || false;
  };

  const handleAnswerQuestion = async () => {
    if (!selectedQuestion || !answerText) {
      toast({ title: "Please enter an answer", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const isValid = await verifyAnswerPassword(password);
    if (!isValid) {
      toast({ title: "Invalid password", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ answer: answerText, answered_at: new Date().toISOString() })
      .eq('id', selectedQuestion.id);

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Error submitting answer", variant: "destructive" });
    } else {
      toast({ title: "Answer submitted successfully" });
      setAnswerText("");
      setPassword("");
      setSelectedQuestion(null);
      setIsDialogOpen(false);
      fetchQuestions();
    }
  };

  const openAnswerDialog = (question: Question) => {
    setSelectedQuestion(question);
    setAnswerText(question.answer || "");
    setPassword("");
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-10 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                Admin Panel
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                Q&A <span className="text-gradient">Administration</span>
              </h1>
              <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Answer user questions and manage Q&A content
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Pending Questions */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Pending Questions</h2>
                  <p className="text-muted-foreground">{unansweredQuestions.length} questions awaiting answers</p>
                </div>
              </div>
              
              {unansweredQuestions.length === 0 ? (
                <Card className="glass-card border-border/50 text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">All questions have been answered!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {unansweredQuestions.map((q, index) => (
                    <Card 
                      key={q.id} 
                      className="glass-card border-border/50 hover:shadow-elegant transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">
                              Asked by <span className="font-medium">{q.name}</span> ({q.email}) on {format(new Date(q.created_at), 'PPP')}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={() => openAnswerDialog(q)} className="gap-2">
                          <Send className="w-4 h-4" />
                          Answer Question
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Answered Questions */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Answered Questions</h2>
                  <p className="text-muted-foreground">{answeredQuestions.length} questions answered</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {answeredQuestions.map((q, index) => (
                  <Card 
                    key={q.id} 
                    className="glass-card border-border/50 hover:shadow-elegant transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Answered
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Asked by {q.name} on {format(new Date(q.created_at), 'PPP')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4 mb-4">
                        <p className="font-semibold text-sm text-primary mb-2">Answer:</p>
                        <p className="whitespace-pre-wrap text-foreground/80">{q.answer}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Answered on {q.answered_at ? format(new Date(q.answered_at), 'PPP') : 'N/A'}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => openAnswerDialog(q)} className="gap-2">
                          <Edit className="w-3 h-3" />
                          Edit Answer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="glass-card border-border/50 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Answer Question
              </DialogTitle>
            </DialogHeader>
            {selectedQuestion && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-semibold text-sm mb-2">Question:</p>
                  <p className="text-foreground/80">{selectedQuestion.question}</p>
                </div>
                <Textarea
                  placeholder="Your answer"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={6}
                  className="border-border/50 focus:border-primary"
                />
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnswerQuestion()}
                  className="border-border/50 focus:border-primary"
                />
                <Button onClick={handleAnswerQuestion} className="w-full gap-2" disabled={isSubmitting}>
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Submitting..." : "Submit Answer"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default AdminQA;