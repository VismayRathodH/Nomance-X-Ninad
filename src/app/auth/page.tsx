"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, ShieldCheck, Sparkles, Box, Heart } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function FallingHearts() {
  const hearts = [...Array(30)];
  const colors = ["#ff4d4d", "#e63946", "#d62828", "#9b2226", "#b91c1c"];

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((_, i) => {
        const size = Math.random() * 20 + 10;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 20;
        const duration = Math.random() * 10 + 10;
        const startX = Math.random() * 100;

        return (
          <motion.div
            key={i}
            initial={{ 
              top: "-10%", 
              left: `${startX}%`, 
              opacity: 0, 
              scale: 0,
              rotate: Math.random() * 360 
            }}
            animate={{ 
              top: "110%", 
              opacity: [0, 0.6, 0.6, 0],
              scale: [1, 1.1, 1],
              rotate: Math.random() * 360 + 360
            }}
            transition={{ 
              duration: duration, 
              repeat: Infinity, 
              delay: delay,
              ease: "linear"
            }}
            className="absolute"
            style={{ width: size, height: size }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={color}
              className="w-full h-full drop-shadow-[0_0_8px_rgba(230,57,70,0.4)]"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}

function AuthContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/social");
      }
      setCheckingSession(false);
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success("Frequency initialized! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Frequency aligned! Welcome back.");
        router.push("/social");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google authentication failed");
      setLoading(false);
    }
  };


  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-[radial-gradient(circle_at_center,oklch(0.18_0.06_25)_0%,oklch(0.1_0.02_25)_100%)] relative px-4 py-12 perspective-[1500px] flex flex-col items-center justify-center">
      <FallingHearts />
      
      {/* Big Rotating Hearts in Corners */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-10 -left-10 text-white/10 z-0 pointer-events-none"
      >
        <Heart size={300} fill="currentColor" stroke="none" />
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 -right-20 text-white/10 z-0 pointer-events-none"
      >
        <Heart size={400} fill="currentColor" stroke="none" />
      </motion.div>

      {/* 3D Perspective Grid Floor */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, transparent 0%, oklch(0.1 0.02 25) 100%),
            linear-gradient(90deg, oklch(0.35 0.1 25 / 0.1) 1px, transparent 1px),
            linear-gradient(oklch(0.35 0.1 25 / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 50px 50px, 50px 50px',
          transform: 'rotateX(60deg) translateY(100px) scale(3)',
          transformOrigin: 'top center'
        }}
      />

      {/* Ambient 3D Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%", 
              z: Math.random() * -1000,
              opacity: 0 
            }}
            animate={{ 
              y: ["0%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity, 
              delay: Math.random() * 10 
            }}
            className="absolute w-1 h-1 bg-primary/30 rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          {/* 3D Rotating Logo Wrapper */}
          <div className="relative inline-flex items-center justify-center mb-8 perspective-[1000px]">
            {/* Logo Shadow/Reflection on Floor */}
            <div className="absolute -bottom-12 w-32 h-8 bg-primary/20 blur-[20px] rounded-full scale-y-50 z-0" />
            
            <motion.div
              animate={{
                rotateY: [0, 360],
                y: [0, -15, 0]
              }}
              transition={{
                rotateY: { duration: 15, repeat: Infinity, ease: "linear" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative z-10 preserve-3d"
            >
              {/* Glowing Aura around rotating logo */}
              <div className="absolute inset-0 bg-primary/10 blur-[50px] rounded-full" />
              
              <img
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/logo-1767110846410.png?width=8000&height=8000&resize=contain"
                alt="Nomance Logo"
                className="w-28 h-28 object-contain drop-shadow-[0_0_30px_rgba(var(--primary),0.5)]"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black tracking-tighter text-white mb-2 drop-shadow-2xl">NOMANCE</h1>
            <p className="text-primary font-black tracking-tight uppercase text-[10px] tracking-[0.4em] opacity-80">Frequency Integration</p>
          </motion.div>
        </div>

        <div className="relative">
          {/* 3D Card Edge Shadow */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/50 to-purple-600/50 rounded-[3rem] blur opacity-20" />
          
          <Card className="bg-[#0a0a0a]/90 border-white/5 backdrop-blur-xl rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 border-[1px]">
            {/* Animated Light Sweep */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
            />
            
            <CardHeader className="p-10 pb-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Box className="w-24 h-24 rotate-12" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter italic text-white">
                {isSignUp ? "Fresh" : "Connect"}
              </CardTitle>
              <CardDescription className="font-bold text-zinc-500 mt-2">
                {isSignUp ? "Sync your aura with the network" : "Re-establish your neural frequency"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10 pt-6 relative">
              <form onSubmit={handleAuth} className="space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Vocal ID / Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="aura@nomance.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-2xl h-16 px-6 font-bold text-white focus:border-primary/50 focus:ring-primary/20 transition-all text-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 rounded-2xl h-16 px-6 font-bold text-white focus:border-primary/50 focus:ring-primary/20 transition-all text-lg"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black text-[14px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(var(--primary),0.3)] transition-all group overflow-hidden relative"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-3 relative z-10">
                      {isSignUp ? "Start Fresh" : "Enter Network"}
                      <Zap className="w-5 h-5 fill-current" />
                    </span>
                  )}
                  {/* Subtle 3D Depth on Button */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none" />
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-[#0a0a0a] px-4 text-white/50">Or continue with</span>
                  </div>
                </div>

                <Button 
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full h-16 rounded-2xl bg-white/5 text-white hover:bg-white/5 hover:text-white border border-white/10 font-black text-[14px] uppercase tracking-[0.2em] transition-all group overflow-hidden relative"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
              </div>
            </CardContent>

            <CardFooter className="p-10 pt-0 flex flex-col gap-8">
              <div className="flex items-center gap-4 w-full opacity-20">
                <div className="h-px bg-white flex-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">OR</span>
                <div className="h-px bg-white flex-1" />
              </div>
              
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-xs font-black text-zinc-400 hover:text-primary transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                {isSignUp ? "Existing Frequency? Sign In" : "New Signal? Fresh Login"}
              </button>

            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 flex items-center justify-center gap-10 px-4 opacity-40">
          <div className="flex flex-col items-center gap-2 group cursor-default">
            <ShieldCheck className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-center">Encrypted<br/>Intent</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-default">
            <Sparkles className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-center">Verified<br/>Consciousness</span>
          </div>
        </div>
      </motion.div>

      {/* Floating 3D Geometric Objects in background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ 
            rotate: 360,
            y: [0, -40, 0],
            x: [0, 20, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-64 h-64 border border-white/5 rounded-[4rem] rotate-12"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            y: [0, 60, 0],
            x: [0, -30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-96 h-96 border border-white/5 rounded-full"
        />
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.1_0.02_25)]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
