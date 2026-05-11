"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, ImageIcon, Info, Heart, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { PhotoUpload } from "@/components/profile-photos";

const INTENTS = [
  { value: "life_partner", label: "Life Partner" },
  { value: "long_term", label: "Long-term Dating" },
  { value: "short_term_open", label: "Short-term / Open" },
  { value: "friendship", label: "Friendship" },
  { value: "still_figuring_it_out", label: "Still figuring it out" },
];

const AVAILABLE_VALUES = [
  "Kindness", "Ambition", "Family", "Adventure", "Creativity", 
  "Honesty", "Growth", "Freedom", "Stability", "Humor"
];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    username: "",
    bio: "",
    intent: "life_partner",
    gender: "other",
    birth_date: "",
    values: [],
    avatar_url: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/auth");
        return;
      }
      const activeUserId = authUser.id;
      setUser(authUser);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", activeUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          username: data.username || "",
          bio: data.bio || "",
          intent: data.intent || "life_partnership",
          gender: data.gender || "other",
          birth_date: data.birth_date || "",
          values: data.values || [],
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setSaving(true);

      // Clean up the profile data before saving
      const profileData = {
        id: user.id,
        full_name: profile.full_name || null,
        username: profile.username || null,
        bio: profile.bio || null,
        intent: profile.intent || null,
        gender: profile.gender || null,
        birth_date: profile.birth_date || null,
        values: profile.values || [],
        avatar_url: profile.avatar_url || null,
        updated_at: new Date().toISOString()
      };

      console.log("🔵 Saving profile data:", profileData);

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData);

      if (error) {
        console.error("❌ Supabase upsert error details:", error);
        throw error;
      }

      console.log("✅ Profile saved successfully");
      toast.success("Profile updated successfully!");

      // Wait a bit for Supabase to propagate changes
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (error: any) {
      console.error("❌ Detailed error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleValue = (value: string) => {
    setProfile((prev: any) => ({
      ...prev,
      values: prev.values.includes(value)
        ? prev.values.filter((v: string) => v !== value)
        : [...prev.values, value].slice(0, 5)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden relative">
      <Navbar />

      <main className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10">
        <div className="container mx-auto px-4 pt-24 pb-40 max-w-3xl">
          <div className="flex items-center gap-4 mb-12">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.push("/profile")}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-foreground">Edit Profile</h1>
              <p className="text-sm text-muted-foreground mt-2">Update your information and stand out</p>
            </div>
          </div>

        <form onSubmit={handleUpdateProfile} className="space-y-8">
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              Profile Photos
            </div>
            
            <PhotoUpload
              userId={user.id}
              initialPhotos={photos}
              onPhotosChange={(newPhotos) => {
                setPhotos(newPhotos);
                if (newPhotos && newPhotos.length > 0) {
                  setProfile({ ...profile, avatar_url: newPhotos[0] });
                }
              }}
            />
            
            <div className="flex items-center gap-2 text-muted-foreground text-xs bg-secondary/20 p-3 rounded-xl">
              <Info className="w-4 h-4 text-primary" />
              <span>Drag to reorder. The first photo is your main profile image.</span>
            </div>
          </section>

          <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/10 border-b border-border/50">
              <CardTitle className="text-2xl font-black italic tracking-tighter">Basic Information</CardTitle>
              <CardDescription>Update your personal details, username, and bio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Full Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="rounded-xl border-border focus:ring-primary h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Username</label>
                  <Input
                    type="text"
                    placeholder="e.g., john_doe"
                    value={profile.username || ""}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const cleanValue = rawValue.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      console.log("Username changed:", rawValue, "->", cleanValue);
                      setProfile({...profile, username: cleanValue});
                    }}
                    className="rounded-xl border-border focus:ring-primary h-11"
                  />
                  <p className="text-xs text-muted-foreground">Others can find you by @{profile.username || 'username'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Birth Date</label>
                  <Input
                    type="date"
                    value={profile.birth_date}
                    onChange={(e) => setProfile({...profile, birth_date: e.target.value})}
                    className="rounded-xl border-border focus:ring-primary h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Gender</label>
                  <Select
                    value={profile.gender}
                    onValueChange={(value) => setProfile({...profile, gender: value})}
                  >
                    <SelectTrigger className="rounded-xl h-11 border-border">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      <SelectItem value="man">Man</SelectItem>
                      <SelectItem value="woman">Woman</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">What Are You Looking For?</label>
                <Select
                  value={profile.intent}
                  onValueChange={(value) => setProfile({...profile, intent: value})}
                >
                  <SelectTrigger className="rounded-xl h-11 border-border">
                    <SelectValue placeholder="Select your intention" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    {INTENTS.map((intent) => (
                      <SelectItem key={intent.value} value={intent.value}>
                        {intent.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Your Bio (Aura)</label>
                  <span className="text-xs text-muted-foreground">{(profile.bio || "").length}/500</span>
                </div>
                <Textarea
                  placeholder="Tell the world about yourself... What makes you unique? What are your passions and interests?"
                  className="rounded-xl border-border min-h-[140px] resize-none focus:ring-primary"
                  maxLength={500}
                  value={profile.bio || ""}
                  onChange={(e) => {
                    const bioValue = e.target.value;
                    console.log("Bio changed, length:", bioValue.length);
                    setProfile({...profile, bio: bioValue});
                  }}
                />
                <p className="text-xs text-muted-foreground">Be authentic and genuine. Your bio helps others understand who you are.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/10 border-b border-border/50">
              <CardTitle className="text-2xl font-black italic tracking-tighter">Values & Beliefs</CardTitle>
              <CardDescription>Select up to 5 core values that define you.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VALUES.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleValue(val)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                      profile.values.includes(val)
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Save Profile Changes
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="h-14 px-8 rounded-2xl border-2 border-border font-bold text-muted-foreground"
              onClick={() => router.push("/profile")}
            >
              Cancel
            </Button>
          </div>
        </form>

        <section className="mt-12 pt-8 border-t border-border">
          <div className="bg-secondary/20 rounded-3xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Pro-Tip</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Authentic profiles with clear values attract high-intent partners.
              </p>
            </div>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
