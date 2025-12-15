import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import {
  Send,
  Loader2,
  BookOpen,
  Heart,
  Lightbulb,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Bot,
  User,
  BookMarked,
  HelpCircle,
  Church,
  Share2,
  Twitter,
  Facebook,
  MessageCircle,
  Mic,
  MicOff,
  Star,
  X,
  Volume2,
  VolumeX,
  History,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  mode?: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

type Favorite = {
  id: string;
  content: string;
  mode: string;
  savedAt: Date;
  query?: string;
};

type AIMode = "scriptures" | "confessions" | "questions" | "problems" | "sermons";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

const GospelBuddy = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<AIMode>("scriptures");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gospelbuddy-conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loadedConversations = parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
        }));
        setConversations(loadedConversations);
        
        // Load the most recent conversation
        if (loadedConversations.length > 0) {
          const mostRecent = loadedConversations[0];
          setCurrentConversationId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      } catch (e) {
        console.error("Error loading conversations:", e);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("gospelbuddy-conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  // Update current conversation when messages change
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === currentConversationId);
        if (existing) {
          return prev.map((c) =>
            c.id === currentConversationId
              ? { ...c, messages, updatedAt: new Date(), title: generateTitle(messages) }
              : c
          ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        }
        return prev;
      });
    }
  }, [messages, currentConversationId]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gospelbuddy-favorites");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFavorites(parsed.map((f: any) => ({ ...f, savedAt: new Date(f.savedAt) })));
      } catch (e) {
        console.error("Error loading favorites:", e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem("gospelbuddy-favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use voice input.",
            variant: "destructive",
          });
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, [toast]);

  const generateTitle = (msgs: Message[]) => {
    const firstUserMsg = msgs.find((m) => m.role === "user");
    if (firstUserMsg) {
      return firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? "..." : "");
    }
    return "New conversation";
  };

  const generateId = () => Math.random().toString(36).substring(7);

  const startNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: "New conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setMessages([]);
    setShowHistory(false);
    toast({ title: "New conversation started" });
  };

  const loadConversation = (conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    setMessages(conversation.messages);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (updated.length === 0) {
        localStorage.removeItem("gospelbuddy-conversations");
      }
      return updated;
    });
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
    toast({ title: "Conversation deleted" });
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now. Click the mic again to stop.",
      });
    }
  };

  // Text-to-Speech functions
  const speakText = (text: string, messageId: string) => {
    if (!window.speechSynthesis) {
      toast({
        title: "Text-to-speech not supported",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean text for speech (remove markdown)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/>\s/g, "")
      .replace(/-\s/g, "")
      .replace(/\n+/g, ". ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Ensure voices are loaded before speaking
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Microsoft"))
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMessageId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };

      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Check if voices are loaded
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceAndSpeak();
      };
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

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
      description: "Biblical solutions to life challenges",
      placeholder: "Share what you are going through and get biblical guidance...",
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Create new conversation if none exists
    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: generateId(),
        title: "New conversation",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: new Date(),
      mode: activeMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("gospel-buddy", {
        body: {
          message: currentInput,
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
    if (currentConversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversationId ? { ...c, messages: [], updatedAt: new Date() } : c
        )
      );
    }
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

  const addToFavorites = (message: Message, query?: string) => {
    const newFavorite: Favorite = {
      id: generateId(),
      content: message.content,
      mode: message.mode || activeMode,
      savedAt: new Date(),
      query,
    };
    setFavorites((prev) => [newFavorite, ...prev]);
    toast({
      title: "Saved to favorites!",
      description: "You can access it from the star icon.",
    });
  };

  const removeFromFavorites = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      if (updated.length === 0) {
        localStorage.removeItem("gospelbuddy-favorites");
      }
      return updated;
    });
    toast({
      title: "Removed from favorites",
    });
  };

  const isFavorited = (content: string) => {
    return favorites.some((f) => f.content === content);
  };

  const shareToWhatsApp = (text: string) => {
    const shareText = `✝️ From GospelBuddy.AI - YBFI\n\n${text}\n\n🔗 Visit: ${window.location.origin}/gospel-buddy`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareToTwitter = (text: string) => {
    const shareText = `${text.substring(0, 200)}...\n\n✝️ via GospelBuddy.AI - YBFI`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin + "/gospel-buddy")}`, "_blank");
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + "/gospel-buddy")}`, "_blank");
  };

  const shareNative = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GospelBuddy.AI - YBFI",
          text: text.substring(0, 500),
          url: window.location.origin + "/gospel-buddy",
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast({
            title: "Share failed",
            description: "Unable to share. Try copying instead.",
            variant: "destructive",
          });
        }
      }
    } else {
      copyToClipboard(text, "share");
      toast({
        title: "Copied!",
        description: "Text copied. You can now paste it anywhere.",
      });
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
      "I am struggling with fear and worry",
      "I feel distant from God",
      "I am facing financial difficulties",
      "I am dealing with unforgiveness",
    ],
    sermons: [
      "Help me prepare a sermon on grace",
      "Outline for teaching about faith",
      "Youth sermon on identity in Christ",
      "Sermon points on the Holy Spirit",
    ],
  };

  const getModeLabel = (modeId: string) => {
    const mode = modes.find((m) => m.id === modeId);
    return mode?.label || modeId;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
          <div className="absolute top-10 left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-5 right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-fade-in">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Spiritual Assistant
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-elegant">
                      <Bot className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <Sparkles className="h-5 w-5 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold">
                    <span className="text-gradient">GospelBuddy</span>
                    <span className="text-primary">.AI</span>
                  </h1>
                </div>
                <p className="text-muted-foreground text-base md:text-lg max-w-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  Your AI companion for scripture, confessions, answers, and spiritual growth
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {/* History Button */}
                <Sheet open={showHistory} onOpenChange={setShowHistory}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2 glass-card border-border/50 hover:shadow-elegant transition-all">
                      <History className="h-5 w-5" />
                      <span className="hidden sm:inline">History</span>
                      {conversations.length > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                          {conversations.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg glass-card">
                    <SheetHeader>
                      <SheetTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <History className="h-5 w-5 text-primary" />
                          Conversation History
                        </span>
                        <Button size="sm" onClick={startNewConversation} className="gap-1">
                          <Plus className="h-4 w-4" />
                          New
                        </Button>
                      </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                      {conversations.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No conversation history</p>
                          <p className="text-sm">Your conversations will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-2 pr-4">
                          {conversations.map((conv) => (
                            <Card
                              key={conv.id}
                              className={`p-3 cursor-pointer glass-card border-border/50 hover:shadow-md transition-all ${
                                currentConversationId === conv.id ? "border-primary shadow-elegant" : ""
                              }`}
                              onClick={() => loadConversation(conv)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{conv.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(conv.updatedAt)} • {conv.messages.length} messages
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConversation(conv.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </SheetContent>
                </Sheet>

                {/* Favorites Button */}
                <Sheet open={showFavorites} onOpenChange={setShowFavorites}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2 glass-card border-border/50 hover:shadow-elegant transition-all">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="hidden sm:inline">Favorites</span>
                      {favorites.length > 0 && (
                        <span className="h-5 w-5 rounded-full bg-yellow-500 text-xs text-primary-foreground flex items-center justify-center">
                          {favorites.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg glass-card">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Saved Favorites ({favorites.length})
                      </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                      {favorites.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No favorites yet</p>
                          <p className="text-sm">Save responses you like for later!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pr-4">
                          {favorites.map((fav) => (
                            <Card key={fav.id} className="p-4 glass-card border-border/50">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                  {getModeLabel(fav.mode)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeFromFavorites(fav.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {fav.query && (
                                <p className="text-xs text-muted-foreground mb-2 italic">
                                  Q: {fav.query}
                                </p>
                              )}
                              <div className="text-sm max-h-40 overflow-y-auto">
                                <MarkdownRenderer content={fav.content.substring(0, 500) + (fav.content.length > 500 ? "..." : "")} />
                              </div>
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => copyToClipboard(fav.content, fav.id)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => speakText(fav.content, fav.id)}
                                >
                                  <Volume2 className="h-3 w-3 mr-1" />
                                  Listen
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => shareToWhatsApp(fav.content)}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Share
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </section>

        {/* Chat Container */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 pb-6 flex flex-col">
          {/* Mode Tabs */}
          <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as AIMode)} className="mb-4">
            <TabsList className="grid grid-cols-5 h-auto p-1.5 bg-muted/50 glass-card border border-border/50 rounded-xl">
              {modes.map((mode) => (
                <TabsTrigger
                  key={mode.id}
                  value={mode.id}
                  className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
                >
                  <mode.icon className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-medium">{mode.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Mode Description */}
          <Card className={`mb-4 glass-card border-0 overflow-hidden animate-fade-in`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${currentMode.color} opacity-90`} />
            <CardContent className="p-4 flex items-center gap-3 relative z-10 text-white">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <currentMode.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{currentMode.label} Mode</p>
                <p className="text-sm opacity-90">{currentMode.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col min-h-0 mb-4 glass-card border-border/50">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <div className="text-center mb-8 animate-fade-in">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                      <BookMarked className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">Start a Conversation</h3>
                    <p className="text-muted-foreground max-w-md">
                      Ask about scriptures, create confessions, get answers to your questions, or get help with sermons
                    </p>
                  </div>

                  {/* Quick Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {quickPrompts[activeMode].map((prompt, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left h-auto py-3 px-4 text-sm justify-start glass-card border-border/50 hover:shadow-md transition-all animate-fade-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                        <span className="line-clamp-2">{prompt}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-sm">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-sm"
                            : "glass-card border border-border/50 rounded-bl-sm"
                        }`}
                      >
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="text-sm leading-relaxed">
                          {message.content}
                        </div>
                      )}
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => copyToClipboard(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 text-xs ${speakingMessageId === message.id ? "text-primary" : ""}`}
                            onClick={() => {
                              if (speakingMessageId === message.id) {
                                stopSpeaking();
                              } else {
                                speakText(message.content, message.id);
                              }
                            }}
                          >
                            {speakingMessageId === message.id ? (
                              <VolumeX className="h-3 w-3 mr-1" />
                            ) : (
                              <Volume2 className="h-3 w-3 mr-1" />
                            )}
                            {speakingMessageId === message.id ? "Stop" : "Listen"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 text-xs ${isFavorited(message.content) ? "text-yellow-500" : ""}`}
                            onClick={() => {
                              if (isFavorited(message.content)) {
                                const fav = favorites.find((f) => f.content === message.content);
                                if (fav) removeFromFavorites(fav.id);
                              } else {
                                const prevMessage = messages[index - 1];
                                addToFavorites(message, prevMessage?.role === "user" ? prevMessage.content : undefined);
                              }
                            }}
                          >
                            <Star className={`h-3 w-3 mr-1 ${isFavorited(message.content) ? "fill-current" : ""}`} />
                            {isFavorited(message.content) ? "Saved" : "Save"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <Share2 className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => shareToWhatsApp(message.content)}>
                                <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                                WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => shareToTwitter(message.content)}>
                                <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                                Twitter/X
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => shareToFacebook()}>
                                <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                                Facebook
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => shareNative(message.content)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                More options
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 animate-fade-in">
                      <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="glass-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Searching the scriptures...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </ScrollArea>

          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <div className="px-4 pb-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground hover:text-destructive"
                onClick={clearChat}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Clear Chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={startNewConversation}
              >
                <Plus className="h-3 w-3 mr-2" />
                New Chat
              </Button>
            </div>
          )}
          </Card>

          {/* Input Area */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-3 rounded-2xl">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Button
                type="button"
                variant={isListening ? "default" : "outline"}
                size="icon"
                className={`h-[52px] w-[52px] shrink-0 rounded-xl shadow-md transition-all ${isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "hover:shadow-elegant"}`}
                onClick={toggleListening}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening... speak now" : currentMode.placeholder}
                  className="min-h-[52px] max-h-[150px] resize-none pr-4 rounded-xl border-border/50 glass-card"
                  rows={1}
                />
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-[52px] w-[52px] shrink-0 rounded-xl shadow-elegant hover:shadow-gold transition-all"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            {isListening && (
              <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
                🎤 Listening... Click the mic to stop
              </p>
            )}
            {isSpeaking && (
              <p className="text-xs text-center text-primary mt-2 animate-pulse">
                🔊 Speaking... Click "Stop" to cancel
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GospelBuddy;
