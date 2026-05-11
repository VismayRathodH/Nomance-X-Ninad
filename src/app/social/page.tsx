"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/loading-screen";
import { Plus, Camera, Loader2, MoreHorizontal, X, Sparkles, Flame, Zap, ShieldAlert, Heart, Upload, Flag, Ban, HeartOff, Edit3, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, addDays } from "date-fns";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function SwipeableCard({ post, idx, user, handleMatchAction, handleUnmatch, handleBlock, setIsReporting, setReportingPostId, setReportingUserId, handleDeletePost, openEditDialog }: any) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x > 150) {
          handleMatchAction(post.profiles?.id, 'spark', post.id);
        } else if (offset.x < -150) {
          handleMatchAction(post.profiles?.id, 'pass', post.id);
        }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.95, 
        x: x.get() > 0 ? 500 : -500,
        transition: { duration: 0.3 } 
      }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: idx * 0.05 
      }}
      className="relative"
    >
      {/* Swipe Indicators */}
      <motion.div 
        style={{ opacity: likeOpacity }}
        className="absolute top-10 right-10 z-50 pointer-events-none"
      >
        <div className="border-4 border-green-500 rounded-xl px-4 py-2 rotate-12">
          <span className="text-4xl font-black text-green-500 uppercase">INTERESTED</span>
        </div>
      </motion.div>

      <motion.div 
        style={{ opacity: nopeOpacity }}
        className="absolute top-10 left-10 z-50 pointer-events-none"
      >
        <div className="border-4 border-red-500 rounded-xl px-4 py-2 -rotate-12">
          <span className="text-4xl font-black text-red-500 uppercase">NOPE</span>
        </div>
      </motion.div>

      <Card className="bg-card/50 backdrop-blur-3xl border-border shadow-2xl shadow-black/50 rounded-[3rem] overflow-hidden group hover:border-primary/20 transition-all duration-500">
        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4 flex-1">
            <Link href={`/profile/${post.profiles?.id}`} className="relative group/avatar">
              <Avatar className="w-10 h-10 ring-2 ring-blue-500/30 transition-all group-hover/avatar:ring-blue-500">
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback className="bg-secondary">{post.profiles?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
                <Zap className="w-2 h-2 text-white fill-current" />
              </div>
            </Link>
            <div className="flex-1">
              <Link href={`/profile/${post.profiles?.id}`} className="text-sm font-black tracking-tighter hover:text-primary transition-colors">
                {post.profiles?.full_name}
              </Link>
              {post.profiles?.username && (
                <p className="text-[8px] font-semibold text-muted-foreground/60">@{post.profiles.username}</p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {formatDistanceToNow(new Date(post.created_at))} AGO
              </p>
            </div>
            <Link href={`/profile/${post.profiles?.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary transition-all"
                title="View Profile"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        
        {post.profiles?.id !== user?.id && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-background/95 backdrop-blur-xl border-border p-2">
            <DropdownMenuItem 
              onClick={() => {
                setReportingPostId(post.id);
                setReportingUserId(post.profiles?.id);
                setIsReporting(true);
              }}
              className="rounded-xl gap-3 cursor-pointer py-3"
            >
              <Flag className="w-4 h-4 text-orange-500" />
              <span className="font-bold">Report Post</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleUnmatch(post.profiles?.id)}
              className="rounded-xl gap-3 cursor-pointer py-3"
            >
              <HeartOff className="w-4 h-4 text-pink-500" />
              <span className="font-bold">Unmatch</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            <DropdownMenuItem 
              onClick={() => handleBlock(post.profiles?.id)}
              variant="destructive"
              className="rounded-xl gap-3 cursor-pointer py-3"
            >
              <Ban className="w-4 h-4" />
              <span className="font-bold">Block User</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {post.profiles?.id === user?.id && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-background/95 backdrop-blur-xl border-border p-2">
            <DropdownMenuItem
              onClick={() => openEditDialog(post.id, post.content)}
              className="rounded-xl gap-3 cursor-pointer py-3"
            >
              <Edit3 className="w-4 h-4 text-blue-500" />
              <span className="font-bold">Edit</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            <DropdownMenuItem
              onClick={() => handleDeletePost(post.id)}
              className="rounded-xl gap-3 cursor-pointer py-3"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="font-bold">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </CardHeader>
      
      {post.image_url && (
        <div className="px-4 pb-4">
          <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden relative bg-secondary/5">
            {post.media_type === 'video' ? (
              <video 
                src={post.image_url} 
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img 
                src={post.image_url} 
                alt="Aura" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      )}

      <CardContent className="p-8 pt-2">
        <p className="text-lg font-medium leading-relaxed tracking-tight text-foreground/90 italic">
          &quot;{post.content}&quot;
        </p>
      </CardContent>

        <CardFooter className="p-6 pt-0 flex flex-col gap-6">
          {post.profiles?.id !== user?.id && (
          <div className="flex flex-col items-center justify-center w-full gap-4">
            {/* Interaction Hub Label */}
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Intentional Connection</span>
            
            {/* Extraordinary Interaction Hub */}
            <div className="flex items-center gap-6 p-2 bg-card/80 rounded-[2.5rem] border border-border backdrop-blur-3xl shadow-2xl">
              <motion.button
                whileHover={{ scale: 1.05, x: -5, backgroundColor: "hsl(var(--accent))" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMatchAction(post.profiles?.id, 'pass', post.id)}
                className="h-14 px-8 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all flex items-center gap-3 border border-transparent hover:border-border"
              >
                <X className="w-4 h-4" />
                Not Interested
              </motion.button>
              
              <div className="w-px h-8 bg-border" />

              <motion.button
                whileHover={{ scale: 1.05, x: 5, boxShadow: "0 0 40px rgba(var(--primary), 0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMatchAction(post.profiles?.id, 'spark', post.id)}
                className="h-14 px-10 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] bg-foreground text-background flex items-center gap-3 group/interest"
              >
                <Heart className="w-5 h-5 fill-current transition-transform group-hover/interest:scale-125" />
                Interested
              </motion.button>
            </div>
          </div>
          )}
          
          <div className="flex items-center justify-center gap-3 px-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center overflow-hidden">
                 <Avatar className="w-full h-full">
                   <AvatarImage src={`https://i.pravatar.cc/100?u=${post.id}${i}`} />
                 </Avatar>
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black italic tracking-tight text-muted-foreground">
            {post.likes_count || 0} INTERESTED
          </span>
        </div>
      </CardFooter>

    </Card>
  </motion.div>
  );
}

export default function SocialPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [newPostMediaType, setNewPostMediaType] = useState("image");
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const [isReporting, setIsReporting] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportingUserId, setReportingUserId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState("");
  const [isDeletingPost, setIsDeletingPost] = useState(false);

    const getMediaType = (file: File) => {
      if (file.type.startsWith('video/')) return 'video';
      return 'image';
    };

    const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/auth");
        return;
      }

      const activeUser = authUser;
      setUser(activeUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", activeUser.id)
        .single();

      setUserProfile(profileData);

      const { data: skippedPosts } = await supabase
        .from("post_skips")
        .select("post_id")
        .eq("user_id", activeUser.id);
      
      const skippedIds = skippedPosts?.map(s => s.post_id) || [];

      const { data: blocks } = await supabase
        .from("user_blocks")
        .select("blocked_id, blocker_id")
        .or(`blocker_id.eq.${activeUser.id},blocked_id.eq.${activeUser.id}`);
      
      const blockedUserIds = blocks?.map(b => b.blocker_id === activeUser.id ? b.blocked_id : b.blocker_id) || [];

      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id!inner (
            id,
            full_name,
            avatar_url,
            birth_date,
            intent,
            location_lat,
            location_lng,
            values,
            username
          )
        `)
        .order("created_at", { ascending: false });

      if (skippedIds.length > 0) {
        query = query.not("id", "in", `(${skippedIds.join(',')})`);
      }

      if (blockedUserIds.length > 0) {
        query = query.not("user_id", "in", `(${blockedUserIds.join(',')})`);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;
      setPosts(postsData || []);

      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("*, profiles(full_name, avatar_url)")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });

      if (storiesError) throw storiesError;
      
      const groupedStories = (storiesData || []).reduce((acc: any, story: any) => {
        if (!acc[story.user_id]) {
          acc[story.user_id] = {
            user: story.profiles,
            items: []
          };
        }
        acc[story.user_id].items.push(story);
        return acc;
      }, {});
      
      setStories(Object.values(groupedStories));

    } catch (error: any) {
      console.error("Fetch social error details:", error.message || error);
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to social changes
    const socialSubscription = supabase
      .channel('social_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          console.log("Realtime post update, refreshing...");
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories' },
        () => {
          console.log("Realtime story update, refreshing...");
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(socialSubscription);
    };
  }, []); 

    const handleMatchAction = async (targetUserId: string, action: 'spark' | 'pass', postId: string) => {
      if (!user || user.id === targetUserId) {
          toast.info("This is your own creation!");
          return;
      }

      if (action === 'pass') {
          setPosts(prev => prev.filter(p => p.id !== postId));
          
          if (user?.id) {
            await supabase.from("post_skips").insert({
              user_id: user.id,
              post_id: postId
            });
          }
          
          toast.info("Moving forward.");
          return;
      }

      setPosts(prev => prev.filter(p => p.id !== postId));

      try {
        const { error } = await supabase.from("matches").insert({
          user_1: user.id,
          user_2: targetUserId,
          status: 'pending'
        });

        if (error) throw error;

        // Increment likes count after successful match
        await supabase.rpc('increment_likes_count', { post_id: postId });
        toast.success("Spark sent!");
      } catch (error: any) {
        console.error("Match error:", error);

        // Check if reverse match exists
        const { data: reverseLike } = await supabase
          .from("matches")
          .select("*")
          .eq("user_1", targetUserId)
          .eq("user_2", user.id)
          .single();

        if (reverseLike) {
          await supabase.from("matches").update({ status: 'accepted' }).eq("id", reverseLike.id);
          // Increment likes for mutual match
          await supabase.rpc('increment_likes_count', { post_id: postId });
          toast.success("It's a match!");
        } else {
          toast.info("Interest already sent.");
        }
      }
    };

    const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      try {
        setIsUploadingPostImage(true);
        const mediaType = getMediaType(file);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        setNewPostImage(publicUrl);
        setNewPostMediaType(mediaType);
        toast.success(`Aura ${mediaType} ready!`);
      } catch (error: any) {
        console.error("Post image upload error:", error);
        toast.error("Failed to upload file");
      } finally {
        setIsUploadingPostImage(false);
      }
    };

    const createPost = async () => {
      if (!newPostContent.trim()) {
        toast.error("What's the vibe?");
        return;
      }

      try {
        setLoading(true);

        console.log("Creating post with user.id:", user.id);

        const { data, error } = await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            content: newPostContent,
            image_url: newPostImage || null,
            media_type: newPostImage ? newPostMediaType : null,
          })
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url,
              birth_date,
              intent,
              location_lat,
              location_lng
            )
          `)
          .single();

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }

        console.log("Post created successfully:", data);
        setPosts([data, ...posts]);
        setNewPostContent("");
        setNewPostImage("");
        setNewPostMediaType("image");
        setIsCreatingPost(false);
        toast.success("Your aura has been shared!");
      } catch (error: any) {
        console.error("Create post error details:", error);
        toast.error(error.message || "Failed to share your post");
      } finally {
        setLoading(false);
      }
    };

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingStory(true);
      const mediaType = getMediaType(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('stories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      console.log("Inserting story with user.id:", user.id);

      const { error: storyError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          media_type: mediaType,
          expires_at: addDays(new Date(), 1).toISOString()
        });

      if (storyError) {
        console.error("Story insert error:", storyError);
        throw storyError;
      }

      toast.success("Moment shared!");
      fetchData(); // Refresh stories
    } catch (error: any) {
      console.error("Story upload error details:", error);
      toast.error(error.message || "Failed to share moment");
    } finally {
      setIsUploadingStory(false);
    }
  };

  const nextStory = () => {
    if (storyIndex < selectedStory.items.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      setSelectedStory(null);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else {
      setSelectedStory(null);
    }
  };

  const handleBlock = async (targetUserId: string) => {
    if (!user || user.id === targetUserId) return;
    
    try {
      const { error } = await supabase.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: targetUserId
      });
      
      if (error) throw error;
      
      setPosts(prev => prev.filter(p => p.profiles.id !== targetUserId));
      toast.success("User blocked. You won't see their content anymore.");
    } catch (error: any) {
      console.error("Block error:", error);
      toast.error("Failed to block user");
    }
  };

  const handleUnmatch = async (targetUserId: string) => {
    if (!user || user.id === targetUserId) return;
    
    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .or(`and(user_1.eq.${user.id},user_2.eq.${targetUserId}),and(user_1.eq.${targetUserId},user_2.eq.${user.id})`);
      
      if (error) throw error;
      
      // Optionally remove their posts from feed too
      setPosts(prev => prev.filter(p => p.profiles.id !== targetUserId));
      toast.success("Unmatched successfully.");
    } catch (error: any) {
      console.error("Unmatch error:", error);
      toast.error("Failed to unmatch");
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !reportingUserId) {
      toast.error("Please provide a reason");
      return;
    }

    try {
      setIsSubmittingReport(true);
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: reportingUserId,
        reported_post_id: reportingPostId,
        reason: reportReason
      });

      if (error) throw error;

      if (reportingPostId) {
        setPosts(prev => prev.filter(p => p.id !== reportingPostId));
      }
      
      setIsReporting(false);
      setReportReason("");
      setReportingPostId(null);
      setReportingUserId(null);
      toast.success("Report submitted. Thank you for keeping Aura safe.");
    } catch (error: any) {
      console.error("Report error:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setIsDeletingPost(true);
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success("Post deleted");
    } catch (error: any) {
      console.error("Delete post error:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleEditPost = async () => {
    if (!editingPostId || !editingPostContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      setIsDeletingPost(true);
      const { error } = await supabase
        .from("posts")
        .update({ content: editingPostContent })
        .eq("id", editingPostId);

      if (error) throw error;

      setPosts(prev => prev.map(p =>
        p.id === editingPostId ? { ...p, content: editingPostContent } : p
      ));

      setIsEditingPost(false);
      setEditingPostId(null);
      setEditingPostContent("");
      toast.success("Post updated");
    } catch (error: any) {
      console.error("Edit post error:", error);
      toast.error("Failed to update post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const openEditDialog = (postId: string, content: string) => {
    setEditingPostId(postId);
    setEditingPostContent(content);
    setIsEditingPost(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden relative">
      {/* Extraordinary Background Elements - TRULY STUCK */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-accent/20 blur-[150px] rounded-full" />
      </div>

<main className="h-full overflow-y-auto no-scrollbar scroll-smooth relative z-10">
          <div className="container mx-auto px-4 pt-12 pb-32 max-w-2xl">
          
          {/* Stories & Quick Emit */}
          <div className="mb-12 space-y-8">
            {/* Stories */}
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleStoryUpload}
            />
            <motion.button 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              disabled={isUploadingStory}
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-48 rounded-[2rem] overflow-hidden shrink-0 group border border-dashed border-muted-foreground/30 bg-card/30 backdrop-blur-md flex flex-col items-center justify-center gap-3 transition-all hover:border-blue-500/50 hover:bg-card/50"
            >
              <div className="relative">
                <Avatar className="w-12 h-12 ring-2 ring-blue-500/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background text-white">
                  <Plus className="w-3 h-3" />
                </div>
              </div>
              <div className="text-center px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                  Add Story
                </span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                  Share Aura
                </span>
              </div>
              {isUploadingStory && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
            </motion.button>


            {stories.map((group, idx) => (
              <motion.button 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1 + idx * 0.1 
                }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedStory(group);
                  setStoryIndex(0);
                }}
                className="relative w-32 h-48 rounded-[2rem] overflow-hidden shrink-0 group border border-border bg-card/50 backdrop-blur-md shadow-xl transition-all hover:border-primary/30"
              >
                {/* Story Preview Background */}
                <div className="absolute inset-0">
                  {group.items[group.items.length - 1].media_type === 'video' ? (
                    <video 
                      src={group.items[group.items.length - 1].image_url} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      muted
                      playsInline
                    />
                  ) : (
                    <img 
                      src={group.items[group.items.length - 1].image_url} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt="Story"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>

                {/* Avatar Overlay */}
                <div className="absolute top-3 left-3">
                  <div className="w-10 h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 shadow-lg">
                    <div className="w-full h-full rounded-xl border-2 border-background overflow-hidden">
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={group.user?.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-secondary text-[10px]">{group.user?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>

                {/* Name Overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white truncate block drop-shadow-md">
                    {group.user?.full_name?.split(' ')[0]}
                  </span>
                </div>
              </motion.button>
            ))}
            </div>
          </div>

        {/* Create Post Prompt */}
        <div className="mb-12">
          <Card className="bg-card/40 backdrop-blur-xl border-dashed border-muted-foreground/30 rounded-[2.5rem] p-6 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setIsCreatingPost(true)}>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-2 ring-blue-500/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-secondary/20 rounded-2xl h-12 flex items-center px-6 text-muted-foreground/60 italic font-medium">
                Share your aura...
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Create Post Dialog */}
        <Dialog open={isCreatingPost} onOpenChange={setIsCreatingPost}>
          <DialogContent className="sm:max-w-lg rounded-[2.5rem] bg-background/95 backdrop-blur-2xl border-border p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black tracking-tighter text-primary">Share Your Aura</DialogTitle>
            </DialogHeader>
            <div className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <Textarea 
                  placeholder="What's the energy today?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[120px] bg-secondary/20 border-none rounded-2xl p-6 text-lg font-medium italic placeholder:text-muted-foreground/40 focus-visible:ring-primary/20"
                />
                
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    ref={postFileInputRef}
                    onChange={handlePostImageUpload}
                  />

                  {newPostImage ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-black">
                      {newPostMediaType === 'video' ? (
                        <video 
                          src={newPostImage} 
                          className="w-full h-full object-cover" 
                          autoPlay 
                          muted 
                          loop 
                        />
                      ) : (
                        <img src={newPostImage} className="w-full h-full object-cover" alt="Post preview" />
                      )}
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 rounded-full h-8 w-8"
                        onClick={() => {
                          setNewPostImage("");
                          setNewPostMediaType("image");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                  <Button 
                    variant="outline" 
                    className="w-full h-32 rounded-2xl border-dashed border-2 bg-secondary/10 hover:bg-secondary/20 hover:border-primary/50 transition-all flex flex-col gap-2"
                    onClick={() => postFileInputRef.current?.click()}
                    disabled={isUploadingPostImage}
                  >
                    {isUploadingPostImage ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Upload Visual</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <Button 
                onClick={createPost}
                disabled={loading || isUploadingPostImage || !newPostContent.trim()}
                className="w-full h-14 rounded-2xl bg-foreground text-background font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post to Aura Feed"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>


        {/* Feed: Extraordinary "Asymmetric" Design */}
        <div className="space-y-12">
          <AnimatePresence mode="popLayout">
            {posts.map((post, idx) => (
              <SwipeableCard
                key={post.id}
                post={post}
                idx={idx}
                user={user}
                handleMatchAction={handleMatchAction}
                handleUnmatch={handleUnmatch}
                handleBlock={handleBlock}
                setIsReporting={setIsReporting}
                setReportingPostId={setReportingPostId}
                setReportingUserId={setReportingUserId}
                handleDeletePost={handleDeletePost}
                openEditDialog={openEditDialog}
              />
            ))}
          </AnimatePresence>
        </div>
        </div>
      </main>

      {/* Story Viewer: Extraordinary Immersive Design */}
      <AnimatePresence>
        {selectedStory && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStory(null)}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-pointer"
              >
                {/* Global Exit Button (Large White Cross) */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedStory(null)}
                  className="fixed top-8 right-8 z-[110] w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white transition-all shadow-2xl group"
                >
                  <X className="w-8 h-8 transition-transform group-hover:scale-110" />
                </motion.button>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg aspect-[9/16] bg-card rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 cursor-default"
              >
                {/* Progress Bars */}
                <div className="absolute top-8 left-8 right-8 flex gap-2 z-20">
                  {selectedStory.items.map((_: any, i: number) => (
                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: i === storyIndex ? "100%" : i < storyIndex ? "100%" : "0%" }}
                        transition={{ duration: i === storyIndex ? 5 : 0, ease: "linear" }}
                        onAnimationComplete={() => {
                          if (i === storyIndex) nextStory();
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Header */}
                <div className="absolute top-14 left-8 right-8 flex items-center justify-between z-20">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-blue-500 ring-4 ring-blue-500/20">
                      <AvatarImage src={selectedStory.user?.avatar_url} />
                      <AvatarFallback>{selectedStory.user?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tighter text-white">
                          {selectedStory.user?.full_name}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">LIVE STORY</span>
                      </div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedStory(null)} 
                      className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-xl border border-white/10"
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {/* Story Media */}
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {selectedStory.items[storyIndex].media_type === 'video' ? (
                      <video 
                        src={selectedStory.items[storyIndex].image_url} 
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        playsInline
                        onEnded={nextStory}
                      />
                    ) : (
                      <img 
                        src={selectedStory.items[storyIndex].image_url} 
                        className="w-full h-full object-cover"
                        alt="Story"
                      />
                    )}
                  </div>

                  {/* Interaction Overlay */}
                  <div className="absolute bottom-12 left-8 right-8 z-20">
                     <div className="flex items-center gap-4">
                        <Input className="flex-1 bg-background/50 border-border rounded-2xl h-14 backdrop-blur-xl text-foreground placeholder:text-muted-foreground placeholder:italic font-bold" placeholder="Say something..." />
                        <Button className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/10">
                           <Zap className="w-6 h-6 fill-current" />
                        </Button>
                     </div>
                  </div>


              {/* Navigation Controls */}
              <div className="absolute inset-0 flex z-10">
                <div className="w-1/3 h-full" onClick={prevStory} />
                <div className="w-2/3 h-full" onClick={nextStory} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Dialog */}
      <Dialog open={isReporting} onOpenChange={setIsReporting}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] bg-background/95 backdrop-blur-2xl border-border p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3 text-primary">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
              Report Aura
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 pt-4 space-y-6">
            <p className="text-sm text-muted-foreground font-medium italic">
              Help us understand what's wrong with this content. Your report is anonymous.
            </p>
            <Textarea 
              placeholder="Reason for reporting (e.g., inappropriate content, harassment...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[120px] bg-secondary/20 border-none rounded-2xl p-6 text-lg font-medium italic placeholder:text-muted-foreground/40 focus-visible:ring-primary/20"
            />
            <DialogFooter className="flex-row gap-3 pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsReporting(false)}
                className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitReport}
                disabled={isSubmittingReport || !reportReason.trim()}
                className="flex-[2] h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest transition-all"
              >
                {isSubmittingReport ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Report"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={isEditingPost} onOpenChange={setIsEditingPost}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] bg-background/95 backdrop-blur-2xl border-border p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3 text-primary">
              <Edit3 className="w-6 h-6 text-blue-500" />
              Edit Aura
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 pt-4 space-y-6">
            <Textarea
              placeholder="Update your aura..."
              value={editingPostContent}
              onChange={(e) => setEditingPostContent(e.target.value)}
              className="min-h-[120px] bg-secondary/20 border-none rounded-2xl p-6 text-lg font-medium italic placeholder:text-muted-foreground/40 focus-visible:ring-primary/20"
            />
            <DialogFooter className="flex-row gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditingPost(false);
                  setEditingPostId(null);
                  setEditingPostContent("");
                }}
                className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditPost}
                disabled={isDeletingPost || !editingPostContent.trim()}
                className="flex-[2] h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black text-sm uppercase tracking-widest transition-all"
              >
                {isDeletingPost ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
