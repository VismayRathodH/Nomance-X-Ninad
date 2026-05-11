"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/loading-screen";
import { 
  MessageCircle, 
  Heart, 
  Loader2, 
  Sparkles, 
  X, 
  Info, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Coffee,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MOODS = [
  { id: "talking", label: "Talking", icon: MessageCircle, description: "Deep conversations from home", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { id: "meeting", label: "Meeting", icon: Coffee, description: "Ready to meet in person", color: "bg-green-500/10 text-green-600 border-green-200" },
  { id: "vibing", label: "Vibing", icon: Sparkles, description: "Casual energy, see what happens", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
];

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState("discover");
  
  // Matches & Liked State
  const [matches, setMatches] = useState<any[]>([]);
  const [likedProfiles, setLikedProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Discovery State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodMatching, setMoodMatching] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/auth");
        return;
      }

      const activeUser = authUser;
      setUser(activeUser);

      // --- Fetch Discovery Data ---
      // Skip discovery_history for now - simplified approach
      setDailyLimitReached(false);

      // Skip RPC call - use direct query instead
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", activeUser.id)
        .limit(5);

      setProfiles(allProfiles || []);

      // --- Fetch Mutual Matches ---
      // Query matches where user is involved and status is accepted
      const { data: mutualData, error: mutualError } = await supabase
        .from("matches")
        .select("id, user_1, user_2, status")
        .eq("status", "accepted")
        .or(`user_1.eq.${activeUser.id},user_2.eq.${activeUser.id}`);

      if (mutualError) console.error("Mutual matches error:", mutualError);
      console.log("Mutual matches data:", mutualData);

      // Fetch profile details for matched users
      if (mutualData && mutualData.length > 0) {
        // Deduplicate matches - keep only one match per other user
        const seenUserIds = new Set<string>();
        const uniqueMatches = (mutualData || []).filter(m => {
          const otherUserId = m.user_1 === activeUser.id ? m.user_2 : m.user_1;
          if (seenUserIds.has(otherUserId)) return false;
          seenUserIds.add(otherUserId);
          return true;
        });

        const matchedUserIds = uniqueMatches.map(m => m.user_1 === activeUser.id ? m.user_2 : m.user_1);
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, intent")
          .in("id", matchedUserIds);

        const formattedMatches = (uniqueMatches || []).map(m => {
          const otherUserId = m.user_1 === activeUser.id ? m.user_2 : m.user_1;
          const profile = matchedProfiles?.find(p => p.id === otherUserId);
          return { id: m.id, profile };
        }).filter(m => m.profile);

        setMatches(formattedMatches);
      } else {
        setMatches([]);
      }

      // --- Fetch Sent Sparks (Liked Profiles) ---
      const { data: likedData, error: likedError } = await supabase
        .from("matches")
        .select("id, user_2, status")
        .eq("user_1", activeUser.id)
        .eq("status", "pending");

      if (likedError) console.error("Liked profiles error:", likedError);
      console.log("Sent sparks data:", likedData);

      // Fetch profile details for sent spark users
      if (likedData && likedData.length > 0) {
        const sentToUserIds = likedData.map(l => l.user_2);
        const { data: sentToProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, intent")
          .in("id", sentToUserIds);

        const formattedLiked = (likedData || []).map(l => {
          const profile = sentToProfiles?.find(p => p.id === l.user_2);
          return { id: l.id, profile };
        }).filter(l => l.profile);

        setLikedProfiles(formattedLiked);
      } else {
        setLikedProfiles([]);
      }

    } catch (error: any) {
      console.error("Fetch all data error:", error);
      toast.error("Error loading matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Subscribe to matches table changes
    const matchesSubscription = supabase
      .channel('matches_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          console.log("Realtime match update received, refreshing data...");
          fetchAllData();
        }
      )
      .subscribe();

    // Refresh data when visibility changes (user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchAllData);

    return () => {
      supabase.removeChannel(matchesSubscription);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchAllData);
    };
  }, [router]);

  // --- Discovery Handlers ---
  const handleMoodChange = async (mood: string) => {
    if (!user) return;
    setSelectedMood(mood);
    setMoodMatching(true);

    await supabase.from("profiles").update({ mood }).eq("id", user.id);

    const { data: discoveredIds } = await supabase
      .from("discovery_history")
      .select("discovered_user_id")
      .eq("user_id", user.id);

    const excludedIds = [user.id, ...(discoveredIds?.map(d => d.discovered_user_id) || [])];

    // Filter by mood and intent
    const { data: moodMatches } = await supabase
      .from("profiles")
      .select("*")
      .not("id", "in", `(${excludedIds.join(',')})`)
      .eq("mood", mood)
      .eq("intent", userProfile?.intent)
      .limit(5);

    setProfiles(moodMatches || []);
    setCurrentIndex(0);
    setDailyLimitReached(false);
    setMoodMatching(false);
    toast.success(`Now matching with people ready to ${mood}!`);
  };

  const handleDiscoveryAction = async (action: 'like' | 'skip') => {
    const targetProfile = profiles[currentIndex];
    if (!targetProfile || !user) return;

    const today = new Date().toISOString().split('T')[0];
    await supabase.from("discovery_history").insert({
      user_id: user.id,
      discovered_user_id: targetProfile.id,
      discovered_at: today
    });

    if (action === 'like') {
      const { error } = await supabase.from("matches").insert({
        user_1: user.id,
        user_2: targetProfile.id,
        status: 'pending'
      });
      
      if (error) {
        const { data: reverseLike } = await supabase
          .from("matches")
          .select("*")
          .eq("user_1", targetProfile.id)
          .eq("user_2", user.id)
          .single();

        if (reverseLike) {
          await supabase.from("matches").update({ status: 'accepted' }).eq("id", reverseLike.id);
          toast.success("It's a match! Connection formed.");
          // Update matches list immediately
          fetchAllData();
        }
      } else {
        toast.info("Interest sent.");
        // Update liked list immediately
        fetchAllData();
      }
    }

    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setDailyLimitReached(true);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden relative">
      {/* Background Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-accent/20 blur-[150px] rounded-full" />
      </div>

      <main className="h-full overflow-y-auto no-scrollbar scroll-smooth relative z-10">
        <div className="container mx-auto px-4 pt-12 pb-32 max-w-4xl relative z-10">
          <header className="mb-8 flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-4xl font-black tracking-tighter text-primary italic flex items-center gap-3">
                    Connections <Sparkles className="w-8 h-8 text-primary fill-current" />
                  </h1>
                </motion.div>

                <Button
                  onClick={() => fetchAllData()}
                  disabled={loading}
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-primary/10 font-black uppercase tracking-widest text-[10px]"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

          </header>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/20 p-1 rounded-2xl h-14 mb-8">
            <TabsTrigger value="discover" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
              Daily Batch
            </TabsTrigger>
            <TabsTrigger value="mutual" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
              Mutual ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="liked" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg">
              Sent ({likedProfiles.length})
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab: Swiping Logic */}
          <TabsContent value="discover">
            <div className="flex flex-col items-center">
              <div className="max-w-xl w-full">
                <AnimatePresence mode="wait">
                  {moodMatching ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                      >
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground font-black italic uppercase tracking-widest text-[10px]">Finding connections...</p>
                      </motion.div>

                  ) : dailyLimitReached || profiles.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-20 bg-card/50 rounded-[3rem] border border-dashed border-border backdrop-blur-md"
                    >
                        <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Calendar className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tighter mb-3 text-primary">
                          {profiles.length === 0 ? "No matches in this mood" : "Limit Reached"}
                        </h2>
                        <p className="text-muted-foreground max-w-xs mx-auto mb-8 font-medium">
                        {profiles.length === 0 
                          ? "Try a different mood or check back later when more people are online."
                          : "Taking time to reflect on matches leads to better outcomes. Check back tomorrow for your next batch."}
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("mutual")}
                        className="rounded-full px-8 border-primary text-primary hover:bg-primary/10 font-black uppercase tracking-widest text-[10px]"
                      >
                        View My Matches
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={profiles[currentIndex].id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                        <Card className="overflow-hidden border-border shadow-2xl rounded-[3rem] bg-card/50 backdrop-blur-md">
                          <div className="p-8 pb-0 flex flex-col items-center">
                            <div className="w-48 h-48 rounded-[2rem] overflow-hidden border-4 border-background shadow-2xl relative group/img">
                              <img 
                                src={profiles[currentIndex].avatar_url || `https://images.unsplash.com/photo-${profiles[currentIndex].gender === 'woman' ? '1494790108377-be9c29b29330' : '1500648767791-00dcc994a43e'}?q=80&w=800&auto=format&fit=crop`}
                                alt={profiles[currentIndex].full_name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                              />
                              <div className="absolute top-2 left-2 flex gap-1">
                                <Badge className="bg-background/90 text-foreground backdrop-blur-md border-none px-2 py-0.5 text-[6px] font-black uppercase tracking-widest">
                                  <ShieldCheck className="w-2 h-2 mr-1 text-primary fill-current" /> Verified
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <CardHeader className="p-8 pb-4 text-center">
                            <div className="flex flex-col items-center">
                              <CardTitle className="text-3xl font-black tracking-tighter text-primary">
                                {profiles[currentIndex].full_name}, {profiles[currentIndex].birth_date ? new Date().getFullYear() - new Date(profiles[currentIndex].birth_date).getFullYear() : '?'}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center text-muted-foreground gap-1 text-xs font-bold">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <span>San Francisco, CA</span>
                                </div>
                                <Badge className="bg-primary text-primary-foreground border-none px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                                  {profiles[currentIndex].intent?.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          
                            <CardContent className="px-8 pb-8 space-y-6 text-center">
                              <p className="text-foreground/80 leading-relaxed font-medium italic">
                                &quot;{profiles[currentIndex].bio || "Looking for real connections."}&quot;
                              </p>
                              
                              {profiles[currentIndex].values && profiles[currentIndex].values.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2">
                                  {profiles[currentIndex].values.map((val: string) => (
                                    <Badge key={val} variant="secondary" className="bg-primary/5 text-primary border-none px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                                      {val}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
    
                          <CardFooter className="p-8 pt-0 flex flex-col gap-6">
                            <div className="flex items-center justify-center w-full">
                              <div className="flex items-center gap-6 p-2 bg-card/80 rounded-[2.5rem] border border-border backdrop-blur-3xl shadow-xl">
                                <motion.button
                                  whileHover={{ scale: 1.05, x: -5, backgroundColor: "hsl(var(--accent))" }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDiscoveryAction('skip')}
                                  className="h-14 px-8 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all flex items-center gap-3 border border-transparent hover:border-border"
                                >
                                  <X className="w-4 h-4" />
                                  Pass
                                </motion.button>
                                
                                <div className="w-px h-8 bg-border" />
    
                                <motion.button
                                  whileHover={{ scale: 1.05, x: 5, boxShadow: "0 0 40px rgba(var(--primary), 0.2)" }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDiscoveryAction('like')}
                                  className="h-14 px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] bg-foreground text-background flex items-center gap-3 group/interest"
                                >
                                  <Heart className="w-5 h-5 fill-current transition-transform group-hover/interest:scale-125" />
                                  Spark
                                </motion.button>
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
  
                  <div className="mt-12 space-y-8">
                    <div className="bg-secondary/10 p-8 rounded-[3rem] border border-border backdrop-blur-md">
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-6 text-center">How do you feel today?</h3>
                      <div className="flex justify-center gap-4">
                        {MOODS.map((mood) => (
                          <button
                            key={mood.id}
                            onClick={() => handleMoodChange(mood.id)}
                            disabled={moodMatching}
                            className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                              selectedMood === mood.id 
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                                : "border-border bg-card/50 hover:border-primary/30"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mood.color}`}>
                              <mood.icon className="w-6 h-6" />
                            </div>
                            <span className={`font-black text-[8px] uppercase tracking-widest ${selectedMood === mood.id ? "text-primary" : "text-foreground"}`}>
                              {mood.label}
                            </span>
                          </button>
                          ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
  
            {/* Mutual Sparks Tab */}
            <TabsContent value="mutual">
              {matches.length === 0 ? (
                <EmptyState 
                  icon={<Heart className="w-12 h-12 text-primary" />}
                  title="No mutual sparks yet"
                  description="Keep exploring. Your next connection is waiting."
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((match) => (
                    <MatchCard key={match.id} profile={match.profile} id={match.id} isMutual={true} />
                  ))}
                </div>
              )}
            </TabsContent>
  
            {/* Sent Energy Tab */}
            <TabsContent value="liked">
              {likedProfiles.length === 0 ? (
                <EmptyState 
                  icon={<Sparkles className="w-12 h-12 text-primary" />}
                  title="No sent sparks"
                  description="When you find someone who resonates, send a spark to show interest."
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {likedProfiles.map((liked) => (
                    <MatchCard key={liked.id} profile={liked.profile} id={liked.id} isMutual={false} />
                  ))}
                </div>
              )}
            </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    );
  }
  
  function MatchCard({ profile, id, isMutual }: { profile: any, id: string, isMutual: boolean }) {
    if (!profile) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
      >
        <Link href={isMutual ? `/messages/${id}` : "#"}>
          <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-md hover:border-primary/30 transition-all duration-300 rounded-[2rem] group shadow-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar className="w-20 h-20 rounded-2xl ring-2 ring-primary/10 transition-all group-hover:ring-primary/40">
                  <AvatarImage 
                    src={profile.avatar_url || `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop`} 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-secondary font-black">{profile.full_name?.[0]}</AvatarFallback>
                </Avatar>
                {isMutual && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg border-2 border-background">
                    <MessageCircle className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
              
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-primary italic tracking-tighter truncate">{profile.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                      {profile.intent?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {!isMutual && (
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-1">
                      <Zap className="w-2 h-2 fill-current text-primary" /> Interest Sent
                    </p>
                  )}
                </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }


function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-24 bg-secondary/10 rounded-[3rem] border border-dashed border-border/50 backdrop-blur-md"
    >
      <div className="w-24 h-24 bg-background/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
        {icon}
      </div>
      <h2 className="text-2xl font-black italic tracking-tighter mb-4 text-primary">{title}</h2>
      <p className="text-muted-foreground max-w-xs mx-auto font-medium text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
