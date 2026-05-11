"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingScreen } from "@/components/loading-screen";
import { Search, SlidersHorizontal, Heart, Sparkles, Flame, Zap, MapPin } from "lucide-react";
import { toast } from "sonner";
import { subYears, differenceInYears } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { useDebounce } from "../../hooks/use-debounce";
import Link from "next/link";

export default function SearchPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const [ageRange, setAgeRange] = useState([18, 50]);
  const [maxDistance, setMaxDistance] = useState(100);
  const [selectedIntent, setSelectedIntent] = useState<string[]>(["dating", "serious", "casual"]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth");
        return;
      }
      const activeUser = authUser;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", activeUser.id)
        .single();
      
      setCurrentUserProfile(profile);

      const maxDate = subYears(new Date(), ageRange[0]).toISOString().split('T')[0];
      const minDate = subYears(new Date(), ageRange[1] + 1).toISOString().split('T')[0];

      const intentMapping: { [key: string]: string[] } = {
        serious: ['life_partner', 'long_term'],
        dating: ['short_term_open'],
        casual: ['still_figuring_it_out', 'friendship']
      };

      const dbIntents = selectedIntent.flatMap(i => intentMapping[i] || []);

      let query = supabase
        .from("profiles")
        .select("*")
        .neq("id", activeUser.id);

      if (dbIntents.length > 0) {
        query = query.in("intent", dbIntents);
      }
      
      query = query
        .gte("birth_date", minDate)
        .lte("birth_date", maxDate);

      if (debouncedSearchQuery.trim()) {
        query = query.or(`full_name.ilike.%${debouncedSearchQuery}%,username.ilike.%${debouncedSearchQuery}%`);
      }

      const { data: profilesData, error } = await query;
      if (error) throw error;

      let filtered = profilesData || [];
      if (profile?.location_lat && profile?.location_lng && maxDistance < 200) {
        filtered = filtered.filter(p => {
          if (!p.location_lat || !p.location_lng) return true;
          const d = calculateDistance(
            profile.location_lat, 
            profile.location_lng,
            p.location_lat,
            p.location_lng
          );
          return d <= maxDistance;
        });
      }

      setProfiles(filtered);
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
    const dLon = (Number(lon2) - Number(lon1)) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    fetchProfiles();
  }, [debouncedSearchQuery, ageRange, selectedIntent]);

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-accent/20 blur-[150px] rounded-full" />
      </div>

      <main className="h-full overflow-y-auto no-scrollbar scroll-smooth relative z-10">
        <div className="container mx-auto px-4 pt-12 pb-32 relative z-10 max-w-2xl">
          <div className="space-y-8">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl font-black italic tracking-tighter text-primary">DISCOVER</h1>
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                  <Zap className="w-4 h-4 text-primary fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">High Intent</span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search by name or @username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-card/50 border-border backdrop-blur-xl rounded-2xl focus:ring-primary font-bold italic"
                  />
                </div>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl bg-card/50 border-border backdrop-blur-xl shadow-xl hover:bg-accent group">
                      <SlidersHorizontal className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-background/95 backdrop-blur-2xl border-border w-full sm:max-w-md rounded-l-[3rem]">
                    <SheetHeader className="pb-8">
                      <SheetTitle className="text-3xl font-black italic tracking-tighter text-primary">REFINE SEARCH</SheetTitle>
                    </SheetHeader>
                    
                    <div className="space-y-12 py-6">
                      <div className="space-y-6">
                        <div className="flex justify-between items-end px-1">
                          <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Age Range</Label>
                          <span className="text-lg font-black italic tracking-tighter text-primary">{ageRange[0]} - {ageRange[1]}</span>
                        </div>
                        <Slider
                          value={ageRange}
                          onValueChange={setAgeRange}
                          min={18}
                          max={100}
                          step={1}
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-end px-1">
                          <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Max Distance</Label>
                          <span className="text-lg font-black italic tracking-tighter text-primary">{maxDistance}km</span>
                        </div>
                        <Slider
                          value={[maxDistance]}
                          onValueChange={(vals) => setMaxDistance(vals[0])}
                          max={200}
                          step={5}
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-6">
                        <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-1">Intent</Label>
                        <ToggleGroup 
                          type="multiple" 
                          value={selectedIntent} 
                          onValueChange={(val) => val.length > 0 && setSelectedIntent(val)}
                          className="flex flex-col gap-3"
                        >
                          <ToggleGroupItem value="dating" className="h-16 rounded-2xl border-2 border-border data-[state=on]:border-primary data-[state=on]:bg-primary/10 transition-all justify-between px-6">
                            <span className="font-black italic tracking-tight text-foreground">DATING</span>
                            <Heart className="w-5 h-5 text-primary" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="serious" className="h-16 rounded-2xl border-2 border-border data-[state=on]:border-primary data-[state=on]:bg-primary/10 transition-all justify-between px-6">
                            <span className="font-black italic tracking-tight text-foreground">SERIOUS</span>
                            <Sparkles className="w-5 h-5 text-purple-500" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="casual" className="h-16 rounded-2xl border-2 border-border data-[state=on]:border-primary data-[state=on]:bg-primary/10 transition-all justify-between px-6">
                            <span className="font-black italic tracking-tight text-foreground">CASUAL</span>
                            <Flame className="w-5 h-5 text-orange-500" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>

                    <div className="absolute bottom-12 left-6 right-6">
                      <Button onClick={() => fetchProfiles()} className="w-full h-16 rounded-2xl font-black text-lg bg-gradient-to-r from-primary to-purple-600 border-none shadow-xl shadow-primary/20">
                        APPLY FILTERS
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <LoadingScreen />
              ) : profiles.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {profiles.map((profile, idx) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link href={`/profile/${profile.id}`}>
                        <Card className="bg-card/50 border-border backdrop-blur-md rounded-3xl overflow-hidden hover:border-primary/30 transition-all group cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-4">
                            <Avatar className="w-16 h-16 rounded-2xl ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                              <AvatarImage src={profile.avatar_url} className="object-cover" />
                              <AvatarFallback className="bg-secondary rounded-2xl font-black">{profile.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                          
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-black italic tracking-tight truncate text-primary">{profile.full_name}</h3>
                                <span className="text-xs font-bold text-primary">
                                  {profile.birth_date ? differenceInYears(new Date(), new Date(profile.birth_date)) : '??'}
                                </span>
                              </div>
                              {profile.username && (
                                <p className="text-xs font-semibold text-muted-foreground mb-2">@{profile.username}</p>
                              )}

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {profile.location_lat && currentUserProfile?.location_lat
                                  ? `${Math.round(calculateDistance(currentUserProfile.location_lat, currentUserProfile.location_lng, profile.location_lat, profile.location_lng))}km`
                                  : 'Hidden'}
                              </div>
                              <div className="w-1 h-1 rounded-full bg-border" />
                              <div className="text-[10px] font-black uppercase tracking-widest text-primary/80 italic">
                                {profile.intent?.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-2xl w-12 h-12 bg-accent/50 hover:bg-primary/20 text-primary transition-all"
                            onClick={() => toast.success(`Frequency shared with ${profile.full_name.split(' ')[0]}`)}
                          >
                            <Zap className="w-6 h-6 fill-current" />
                          </Button>
                        </CardContent>
                      </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-24 space-y-4">
                  <div className="w-20 h-20 bg-accent/50 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-10 h-10 text-muted-foreground opacity-20" />
                  </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black italic tracking-tighter text-primary">No Frequencies Found</h3>
                      <p className="text-sm text-muted-foreground font-medium">Try broadening your search or adjusting your vibe filters.</p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
