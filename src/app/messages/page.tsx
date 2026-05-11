"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingScreen } from "@/components/loading-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MessagesListPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setLoading(false);
          return;
        }
        const activeUser = authUser;
        setUser(activeUser);

        // Fetch accepted matches
        const { data: matches, error } = await supabase
          .from("matches")
          .select("id, created_at, user_1, user_2, status")
          .or(`user_1.eq.${activeUser.id},user_2.eq.${activeUser.id}`)
          .eq("status", "accepted");

        if (error) throw error;

        if (!matches || matches.length === 0) {
          setChats([]);
          return;
        }

        // Deduplicate matches - keep only one match per other user
        const seenUserIds = new Set<string>();
        const uniqueMatches = matches.filter(m => {
          const otherUserId = m.user_1 === activeUser.id ? m.user_2 : m.user_1;
          if (seenUserIds.has(otherUserId)) return false;
          seenUserIds.add(otherUserId);
          return true;
        });

        // Fetch all matched user IDs and their profiles
        const matchedUserIds = uniqueMatches.map(m => m.user_1 === activeUser.id ? m.user_2 : m.user_1);
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", matchedUserIds);

        // For each match, fetch the latest message
        const chatsWithLastMessage = await Promise.all(
          (uniqueMatches || []).map(async (match) => {
            const otherUserId = match.user_1 === activeUser.id ? match.user_2 : match.user_1;
            const otherProfile = allProfiles?.find(p => p.id === otherUserId);

            const { data: lastMessage } = await supabase
              .from("messages")
              .select("*")
              .eq("match_id", match.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...match,
              otherProfile,
              lastMessage
            };
          })
        );

        // Sort by last message date or match creation date
        const sortedChats = chatsWithLastMessage.sort((a, b) => {
          const timeA = new Date(a.lastMessage?.created_at || a.created_at).getTime();
          const timeB = new Date(b.lastMessage?.created_at || b.created_at).getTime();
          return timeB - timeA;
        });

        setChats(sortedChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Realtime for new messages to update the list
    const channel = supabase
      .channel('messages_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchChats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

return (
<div className="h-screen bg-background text-foreground overflow-hidden relative">
{/* Extraordinary Background Elements */}
<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
<div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full" />
<div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-accent/20 blur-[150px] rounded-full" />
</div>

<main className="h-full overflow-y-auto no-scrollbar scroll-smooth relative z-10">
<div className="container mx-auto px-4 pt-12 pb-32 max-w-2xl">
<header className="mb-12 flex items-center justify-between">
<div>
<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
<ShieldCheck className="w-3 h-3 fill-current" />
Secure Connection
</div>
  <h1 className="text-5xl font-black tracking-tighter text-primary">Messages</h1>
  <p className="text-muted-foreground font-medium italic mt-2">High-intent conversations with your matches.</p>
  </div>
<div className="w-16 h-16 rounded-[2rem] bg-card/50 backdrop-blur-3xl border border-border flex items-center justify-center shadow-2xl">
<MessageCircle className="w-8 h-8 text-primary" />
</div>
</header>

<div className="space-y-4">
{chats.length === 0 ? (
<div className="text-center py-24 bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-dashed border-muted-foreground/30 shadow-2xl">
<div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
<MessageCircle className="w-10 h-10 text-muted-foreground/50" />
</div>
<h2 className="text-3xl font-black italic tracking-tighter mb-4 text-primary">No connections yet</h2>
<p className="text-muted-foreground font-medium italic max-w-xs mx-auto mb-10 leading-relaxed">
Explore the feed to find intentional connections and start your journey.
</p>
<Link href="/social">
<button className="h-14 px-10 rounded-2xl bg-foreground text-background font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/20">
Discovery Feed
</button>
</Link>
</div>
) : (
chats.map((chat) => (
<motion.div
key={chat.id}
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
whileHover={{ scale: 1.02, backgroundColor: "hsl(var(--card)/0.8)" }}
whileTap={{ scale: 0.98 }}
className="group"
>
<Link href={`/messages/${chat.id}`}>
<div className="bg-card/50 backdrop-blur-3xl border border-border rounded-[2.5rem] p-6 flex items-center gap-6 hover:shadow-2xl transition-all duration-500 group-hover:border-primary/30">
<div className="relative shrink-0">
<div className="w-20 h-20 rounded-[2rem] p-0.5 bg-gradient-to-tr from-primary via-primary/50 to-accent shadow-xl overflow-hidden">
<div className="w-full h-full rounded-[1.8rem] border-2 border-background overflow-hidden">
<Avatar className="w-full h-full rounded-none">
<AvatarImage src={chat.otherProfile?.avatar_url || `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop`} className="object-cover" />
<AvatarFallback className="bg-secondary text-primary font-black italic">{chat.otherProfile?.full_name?.[0]}</AvatarFallback>
</Avatar>
</div>
</div>
<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow-lg border border-border">
<ShieldCheck className="w-3.5 h-3.5 text-primary fill-primary" />
</div>
</div>

<div className="flex-grow min-w-0">
<div className="flex items-center justify-between mb-1.5">
<h3 className="text-xl font-black tracking-tighter text-primary group-hover:text-primary transition-colors">
{chat.otherProfile?.full_name}
</h3>
<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
{chat.lastMessage 
? new Date(chat.lastMessage.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
: "AUTHENTIC MATCH"}
</span>
</div>
<p className={`text-sm italic font-medium truncate ${!chat.lastMessage || (chat.lastMessage.sender_id !== user?.id && !chat.lastMessage.read_at) ? "text-foreground font-bold" : "text-muted-foreground/70"}`}>
{chat.lastMessage 
? (chat.lastMessage.sender_id === user?.id ? `You: ${chat.lastMessage.content}` : chat.lastMessage.content)
: "Begin a meaningful conversation..."}
</p>
</div>

<div className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/50 transition-all shadow-inner">
<ChevronRight className="w-5 h-5" />
</div>
</div>
</Link>
</motion.div>
))
)}
</div>
</div>
</main>
</div>
);
}

