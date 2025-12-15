import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Loader2,
  BookOpen,
  Heart,
  MessageCircle,
  Lightbulb,
  Mic,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Bot,
  User,
  RefreshCw,
  BookMarked,
  HandHeart,
  HelpCircle,
  Church,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mode?: string;
};

type AIMode = "scriptures" | "confessions" | "questions" | "problems" | "sermons";

const GospelBuddy = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<AIMode>("scriptures");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modes = [
    {
      id: "scriptures" as AIMode,
      label: "Scriptures",
      icon: BookOpen,
      description: "Find scriptures from Genesis to Revelation",
      placeholder: "What topic would you like scriptures about? e.g., 'God's forgiveness for my sins'",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "confessions" as AIMode,
      label: "Confessions",
      icon: Heart,
      description: "Create faith-building confessions",
      placeholder: "What would you like to confess? e.g., 'I am healed and whole'",
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "questions" as AIMode,
      label: "Q&A",
      icon: HelpCircle,
      description: "Get answers with scripture references",
      placeholder: "Ask any question about faith, life, or the Bible...",
      color: "from-purple-500 to-violet-500",
    },
    {
      id: "problems" as AIMode,
      label: "Problems",
      icon: Lightbulb,
      description: "Biblical solutions to life's challenges",
      placeholder: "Share what you're going through and get biblical guidance...",
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "sermons" as AIMode,
      label: "Sermons",
      icon: Church,
      description: "Help with preaching and teaching",
      placeholder: "What sermon topic or teaching would you like help with?",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const currentMode = modes.find((m) => m.id === activeMode)!;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateId = () => Math.random().toString(36).substring(7);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: new Date(),
      mode: activeMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("gospel-buddy", {
        body: {
          message: input,
          mode: activeMode,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        mode: activeMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "All messages have been removed",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts: Record<AIMode, string[]> = {
    scriptures: [
      "Show me scriptures about God's love",
      "Find verses about faith and trust",
      "Scriptures on healing and restoration",
      "Verses about strength in hard times",
    ],
    confessions: [
      "Create confessions about divine health",
      "Confessions for financial breakthrough",
      "Faith confessions for my family",
      "Confessions for wisdom and guidance",
    ],
    questions: [
      "How can I grow closer to God?",
      "What does the Bible say about anxiety?",
      "How do I forgive someone who hurt me?",
      "What is the purpose of my life?",
    ],
    problems: [
      "I'm struggling with fear and worry",
      "I feel distant from God",
      "I'm facing financial difficulties",
      "I'm dealing with unforgiveness",
    ],
    sermons: [
      "Help me prepare a sermon on grace",
      "Outline for teaching about faith",
      "Youth sermon on identity in Christ",
      "Sermon points on the Holy Spirit",
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="relative">
              <Bot className="h-10 w-10 text-primary" />
              <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
              GospelBuddy.AI
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Your AI companion for scripture, confessions, answers, and spiritual growth
          </p>
        </div>

        {/* Mode Tabs */}
        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as AIMode)} className="mb-4">
          <TabsList className="grid grid-cols-5 h-auto p-1 bg-muted/50">
            {modes.map((mode) => (
              <TabsTrigger
                key={mode.id}
                value={mode.id}
                className="flex flex-col items-center gap-1 py-2 px-1 data-[state=active]:bg-background"
              >
                <mode.icon className="h-4 w-4" />
                <span className="text-[10px] sm:text-xs font-medium">{mode.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Mode Description */}
        <Card className={`mb-4 bg-gradient-to-r ${currentMode.color} text-white`}>
          <CardContent className="p-3 flex items-center gap-3">
            <currentMode.icon className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{currentMode.label} Mode</p>
              <p className="text-xs opacity-90">{currentMode.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0 mb-4">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8">
                <div className="text-center mb-6">
                  <BookMarked className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Start a Conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Ask about scriptures, create confessions, get answers to your questions, or get help with sermons
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {quickPrompts[activeMode].map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="text-left h-auto py-2 px-3 text-xs sm:text-sm justify-start"
                      onClick={() => {
                        setInput(prompt);
                        textareaRef.current?.focus();
                      }}
                    >
                      <Sparkles className="h-3 w-3 mr-2 flex-shrink-0 text-primary" />
                      <span className="line-clamp-2">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copy
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <div className="px-4 pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={clearChat}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Clear Chat
              </Button>
            </div>
          )}
        </Card>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-2">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentMode.placeholder}
                className="min-h-[50px] max-h-[150px] resize-none pr-12"
                rows={1}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-[50px] w-[50px] shrink-0"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GospelBuddy;
