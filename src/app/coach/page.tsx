"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/loading-screen";
import { Sparkles, Camera, FileText, MessageSquare, Check, Loader2, ChevronRight, Lightbulb, Zap, ArrowLeft, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const PHOTO_TIPS = [
  { id: 1, tip: "Add a photo showing you doing your favorite hobby", category: "activity" },
  { id: 2, tip: "Include a clear headshot with natural lighting", category: "headshot" },
  { id: 3, tip: "Show yourself in a social setting with friends", category: "social" },
  { id: 4, tip: "Add a full-body photo in a casual setting", category: "fullbody" },
  { id: 5, tip: "Include a photo that shows your smile", category: "expression" },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function CoachPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentBio, setCurrentBio] = useState("");
  const [improvedBio, setImprovedBio] = useState("");
  const [bioTips, setBioTips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "photos" | "bio">("chat");
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoScores, setPhotoScores] = useState<any>(null);
  const [photoTips, setPhotoTips] = useState<string[]>([]);
  const router = useRouter();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/auth");
          return;
        }
        const activeUser = authUser;
        setUser(activeUser);

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", activeUser.id)
          .single();

        if (error) {
          console.error(error);
        } else if (profileData) {
          setProfile(profileData);
          setCurrentBio(profileData.bio || "");
        }
      } catch (error: any) {
        console.error("Coach fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const analyzeBio = async () => {
    if (!currentBio.trim()) {
      toast.error("Please enter a bio to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze_bio", bio: currentBio }),
      });

      if (!response.ok) throw new Error("Failed to analyze bio");

      const data = await response.json();
      setImprovedBio(data.improved || "");
      setBioTips(data.tips || []);
      toast.success("Bio analyzed with AI insights!");
    } catch (error: any) {
      console.error("Bio analysis error:", error);
      toast.error("Failed to analyze bio");
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzePhotos = async () => {
    setPhotoAnalyzing(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze_photos" }),
      });

      if (!response.ok) throw new Error("Failed to analyze photos");

      const data = await response.json();
      setPhotoScores(data.scores || {});
      setPhotoTips(data.tips || []);
      toast.success("Photo analysis complete!");
    } catch (error: any) {
      console.error("Photo analysis error:", error);
      toast.error("Failed to analyze photos");
    } finally {
      setPhotoAnalyzing(false);
    }
  };

  const applyImprovement = async () => {
    if (!improvedBio || !user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ bio: improvedBio })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update bio");
    } else {
      setCurrentBio(improvedBio);
      setProfile({ ...profile, bio: improvedBio });
      toast.success("Bio updated successfully!");
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          userId: user?.id,
          message: userMessage,
          conversationHistory: chatMessages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error("Failed to get coach response");
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble processing that. Please try again!" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const quickPrompts = [
    "How can I improve my profile?",
    "Give me a great conversation starter",
    "Help me plan a first date",
    "How do I handle being ghosted?",
  ];

  if (loading) {
    return <LoadingScreen />;
  }

return (
  <div className="h-screen bg-background text-foreground overflow-hidden relative">
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-accent/20 blur-[150px] rounded-full" />
    </div>

    <main className="h-full overflow-y-auto no-scrollbar scroll-smooth relative z-10">
      <div className="container mx-auto px-4 pt-12 pb-32 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/social")}
            className="group flex items-center gap-2 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-full px-6 py-6"
          >
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Feed</span>
          </Button>
        </div>

        <header className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Sparkles className="w-3 h-3 fill-current" />
              AI-Powered Coach
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-primary mb-4">Aura Coach</h1>
            <p className="text-muted-foreground/80 max-w-lg mx-auto font-medium italic text-lg leading-relaxed">
              Your personal AI advisor for building meaningful connections and optimizing your presence.
            </p>
          </header>

        <div className="flex justify-center p-2 bg-card/50 backdrop-blur-3xl border border-border rounded-[2.5rem] max-w-md mx-auto mb-12 shadow-2xl">
          {[
            { id: "chat", label: "Chat", icon: MessageSquare },
            { id: "photos", label: "Photos", icon: Camera },
            { id: "bio", label: "Bio", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? "bg-foreground text-background shadow-xl" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "fill-current" : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "chat" && (
          <Card className="bg-card/50 backdrop-blur-3xl border-border shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black tracking-tighter text-primary">Ask Your Coach</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium italic">
                      Get personalized advice on dating, profiles, and connections
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div 
                  ref={chatScrollRef}
                  className="h-[400px] overflow-y-auto space-y-4 pr-2"
                >
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tighter mb-2 text-primary">Welcome to Aura Coach</h3>
                        <p className="text-muted-foreground font-medium italic text-sm max-w-sm">
                          I&apos;m here to help you navigate dating with confidence. Ask me anything!
                        </p>
                      </div>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      {quickPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setChatInput(prompt)}
                          className="px-4 py-2 rounded-full bg-secondary/20 border border-border text-sm font-medium hover:bg-secondary/40 hover:border-primary/30 transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[80%] p-4 rounded-[1.5rem] ${
                        msg.role === "user" 
                          ? "bg-foreground text-background rounded-tr-md" 
                          : "bg-secondary/20 text-foreground rounded-tl-md"
                      }`}>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-background" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {chatLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary/20 p-4 rounded-[1.5rem] rounded-tl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <form onSubmit={sendChatMessage} className="flex gap-3">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your coach anything..."
                  className="flex-1 h-14 rounded-2xl bg-secondary/10 border-border px-6 font-medium"
                  disabled={chatLoading}
                />
                <Button 
                  type="submit" 
                  disabled={!chatInput.trim() || chatLoading}
                  className="h-14 w-14 rounded-2xl bg-foreground text-background"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "photos" && (
          <div className="space-y-8">
            <Card className="bg-card/50 backdrop-blur-3xl border-border shadow-2xl rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tighter text-primary">Photo Strategy</CardTitle>
                      <CardDescription className="text-muted-foreground font-medium italic">
                        A diverse photo set tells your story better than any bio.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="p-10 pt-4 space-y-4">
                {PHOTO_TIPS.map((tip, index) => (
                  <button 
                    key={tip.id}
                    onClick={() => toast.info(`This ${tip.category} photo helps matches visualize your life.`)}
                    className="w-full flex items-center gap-6 p-6 rounded-[2rem] bg-secondary/5 border border-border/50 hover:border-primary/30 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 font-black italic text-lg shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <p className="text-foreground font-bold text-lg tracking-tight italic">&quot;{tip.tip}&quot;</p>
                      <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                        {tip.category}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/50 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/30 backdrop-blur-xl border-dashed border-muted-foreground/30 rounded-[3rem] overflow-hidden">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <Camera className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter text-primary mb-2">AI Photo Analysis</h3>
                  <p className="text-muted-foreground font-medium italic mb-8 max-w-sm mx-auto">
                    {photoScores ? "Analysis complete! See your scores below." : "Get AI-powered feedback on your photo strategy."}
                  </p>
                <Button 
                  onClick={analyzePhotos}
                  disabled={photoAnalyzing}
                  className={`h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest border border-border transition-all ${
                    photoScores ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-foreground/10 text-foreground"
                  }`}
                >
                  {photoAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : photoScores ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Analysis Complete
                    </>
                  ) : (
                    "Begin AI Analysis"
                  )}
                </Button>

                {photoScores && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 space-y-6"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(photoScores).map(([key, value]) => (
                        <div key={key} className="p-6 rounded-[2rem] bg-secondary/10 border border-border">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1 capitalize">{key}</p>
                          <p className="text-2xl font-black tracking-tighter text-primary">{String(value)}%</p>
                        </div>
                      ))}
                    </div>
                    {photoTips.length > 0 && (
                      <div className="text-left p-6 rounded-[2rem] bg-primary/5 border border-primary/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">AI Tips</p>
                        <ul className="space-y-2">
                          {photoTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "bio" && (
          <div className="space-y-8">
            <Card className="bg-card/50 backdrop-blur-3xl border-border shadow-2xl rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 pb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-black tracking-tighter text-primary">Bio Optimizer</CardTitle>
                      <CardDescription className="text-muted-foreground font-medium italic">
                        Transform your bio with AI-powered suggestions.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="p-10 pt-4 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-4">Current Bio</label>
                  <Textarea
                    value={currentBio}
                    onChange={(e) => setCurrentBio(e.target.value)}
                    placeholder="Describe your essence..."
                    className="min-h-[160px] bg-secondary/5 border-border rounded-[2rem] p-8 text-lg font-medium italic placeholder:text-muted-foreground/30 focus-visible:ring-primary/20"
                  />
                </div>

                <Button 
                  onClick={analyzeBio} 
                  disabled={analyzing}
                  className="w-full h-16 rounded-[2rem] bg-foreground text-background font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      AI is analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3 fill-current group-hover:scale-125 transition-transform" />
                      Analyze with AI
                    </>
                  )}
                </Button>

                {improvedBio && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 rounded-[2.5rem] bg-primary/5 border border-primary/20 shadow-inner relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-24 h-24 text-primary" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Lightbulb className="w-4 h-4 text-primary fill-current" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Suggestion</span>
                      </div>
                    <p className="text-2xl font-medium italic leading-relaxed text-foreground mb-6">
                      &quot;{improvedBio}&quot;
                    </p>
                      
                      {bioTips.length > 0 && (
                        <div className="mb-8 space-y-2">
                          {bioTips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              {tip}
                            </div>
                          ))}
                        </div>
                      )}

                      <Button 
                        onClick={applyImprovement}
                        className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Apply This Bio
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  </div>
);
}
