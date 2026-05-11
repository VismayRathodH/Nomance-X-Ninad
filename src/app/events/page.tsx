"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/loading-screen";
import { Calendar, MapPin, Users, Zap, Video, Coffee, Palette, BookOpen, Heart, Clock, ChevronRight, Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const SAMPLE_EVENTS = [
  {
    id: "1",
    title: "Coffee & Conversations",
    description: "Casual meetup for singles who prefer meaningful dialogue over small talk.",
    event_type: "meetup",
    location: "Blue Bottle Coffee, Hayes Valley",
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    max_participants: 12,
    current_participants: 8,
    interest_tags: ["Coffee", "Conversation", "Casual"],
    host: { name: "Sarah M.", avatar: null },
  },
  {
    id: "2",
    title: "Friday Night Speed Dating",
    description: "5-minute rounds with verified Nomance members. Quality over quantity.",
    event_type: "speed_dating",
    location: "Online via Zoom",
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    max_participants: 20,
    current_participants: 14,
    interest_tags: ["Speed Dating", "Online", "Structured"],
    host: { name: "Nomance Team", avatar: null },
  },
  {
    id: "3",
    title: "Hiking Singles: Lands End Trail",
    description: "Meet active singles while enjoying SF's most scenic coastal trail.",
    event_type: "meetup",
    location: "Lands End Trailhead",
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    max_participants: 15,
    current_participants: 11,
    interest_tags: ["Hiking", "Outdoors", "Active"],
    host: { name: "Mike R.", avatar: null },
  },
  {
    id: "4",
    title: "Book Club: Attached",
    description: "Discuss attachment theory and relationships with fellow thoughtful daters.",
    event_type: "interest_room",
    location: "Online Discussion",
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    max_participants: 25,
    current_participants: 18,
    interest_tags: ["Books", "Psychology", "Growth"],
    host: { name: "Emma L.", avatar: null },
  },
];

const INTEREST_ROOMS = [
  { id: "1", name: "Foodies & Wine Lovers", members: 234, icon: Coffee, active: true },
  { id: "2", name: "Creative Souls", members: 189, icon: Palette, active: true },
  { id: "3", name: "Book Worms", members: 156, icon: BookOpen, active: false },
  { id: "4", name: "Adventure Seekers", members: 312, icon: MapPin, active: true },
  { id: "5", name: "Dog Parents", members: 278, icon: Heart, active: true },
];

const EVENT_TYPE_STYLES = {
  meetup: { bg: "bg-green-500/10", text: "text-green-600", label: "In-Person Meetup" },
  speed_dating: { bg: "bg-purple-500/10", text: "text-purple-600", label: "Speed Dating" },
  interest_room: { bg: "bg-blue-500/10", text: "text-blue-600", label: "Discussion" },
  online: { bg: "bg-orange-500/10", text: "text-orange-600", label: "Virtual Event" },
};

export default function EventsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchEventsAndRooms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, host:profiles(full_name, avatar_url)')
        .order('event_date', { ascending: true });
      
      setEvents(eventsData || []);

      // Fetch Rooms
      const { data: roomsData } = await supabase
        .from('interest_rooms')
        .select('*')
        .order('name', { ascending: true });
      
      setRooms(roomsData || []);

      // Fetch Joined Events
      const { data: joinedEventsData } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', user.id);
      
      setJoinedEvents(joinedEventsData?.map(j => j.event_id) || []);

      // Fetch Joined Rooms
      const { data: joinedRoomsData } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);
      
      setJoinedRooms(joinedRoomsData?.map(j => j.room_id) || []);

    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);
      await fetchEventsAndRooms();
    };

    init();

    // Realtime subscriptions
    const eventsChannel = supabase
      .channel('events_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEventsAndRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants' }, () => fetchEventsAndRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interest_rooms' }, () => fetchEventsAndRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => fetchEventsAndRooms())
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [router]);

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      if (joinedEvents.includes(eventId)) {
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        setJoinedEvents(prev => prev.filter(id => id !== eventId));
        toast.info("You've left the event");
      } else {
        await supabase
          .from('event_participants')
          .insert({ event_id: eventId, user_id: user.id });
        
        setJoinedEvents(prev => [...prev, eventId]);
        toast.success("You're in! Check your email for details.");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      if (joinedRooms.includes(roomId)) {
        await supabase
          .from('room_members')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', user.id);
        
        setJoinedRooms(prev => prev.filter(id => id !== roomId));
        toast.info("You've left the room");
      } else {
        await supabase
          .from('room_members')
          .insert({ room_id: roomId, user_id: user.id });
        
        setJoinedRooms(prev => [...prev, roomId]);
        toast.success("Welcome to the community!");
      }
    } catch (error) {
      toast.error("Failed to join room");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.interest_tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <div className="container mx-auto px-4 pt-12 pb-32 max-w-6xl">
        <header className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-primary text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Micro-Communities
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-primary mb-3">Events & Communities</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
            Move beyond profiles. Meet like-minded singles at curated events and interest-based rooms.
          </p>
        </header>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search events, interests..." 
              className="pl-12 h-12 rounded-full bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-secondary/20 p-1 rounded-full">
            <TabsTrigger value="events" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="speed" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="w-4 h-4 mr-2" />
              Speed Dating
            </TabsTrigger>
            <TabsTrigger value="rooms" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Rooms
            </TabsTrigger>
          </TabsList>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tighter text-primary">Upcoming Meetups</h2>
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Host Event
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {filteredEvents.filter(e => e.event_type === 'meetup').map((event) => (
                  <Card key={event.id} className="border-border bg-card overflow-hidden hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          {EVENT_TYPE_STYLES[event.event_type as keyof typeof EVENT_TYPE_STYLES] && (
                            <Badge className={`${EVENT_TYPE_STYLES[event.event_type as keyof typeof EVENT_TYPE_STYLES].bg} ${EVENT_TYPE_STYLES[event.event_type as keyof typeof EVENT_TYPE_STYLES].text} border-none`}>
                              {EVENT_TYPE_STYLES[event.event_type as keyof typeof EVENT_TYPE_STYLES].label}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {event.current_participants}/{event.max_participants}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-black tracking-tighter text-primary mt-2">{event.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">{event.description}</CardDescription>
                    </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        {formatDate(event.event_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        {event.location}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.interest_tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-secondary/30 text-primary text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={event.host?.avatar_url} />
                          <AvatarFallback className="bg-secondary text-primary text-xs">{event.host?.full_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">Hosted by {event.host?.full_name || 'Anonymous'}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className={`rounded-full ${joinedEvents.includes(event.id) ? "bg-secondary text-primary" : "bg-primary text-primary-foreground"}`}
                        onClick={() => handleJoinEvent(event.id)}
                      >
                        {joinedEvents.includes(event.id) ? "Joined" : "Join"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

            {/* Speed Dating Tab */}
            <TabsContent value="speed" className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-black tracking-tighter text-primary mb-2">Virtual Speed Dating</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  5-minute video rounds with verified members. Efficient, intentional, and no awkward goodbyes.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {filteredEvents.filter(e => e.event_type === 'speed_dating').map((event) => (
                  <Card key={event.id} className="border-border bg-card overflow-hidden hover:shadow-lg transition-all border-2 border-purple-200">
                    <CardHeader className="bg-purple-500/5">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-purple-500/10 text-purple-600 border-none">
                          <Zap className="w-3 h-3 mr-1" />
                          Speed Dating
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-purple-600 font-bold">
                          <Clock className="w-3 h-3" />
                          5 min rounds
                        </div>
                      </div>
                      <CardTitle className="text-xl font-black tracking-tighter text-primary mt-2">{event.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">{event.description}</CardDescription>
                    </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        {formatDate(event.event_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4 text-purple-600" />
                        {event.location}
                      </div>
                    </div>
                    <div className="bg-secondary/20 p-3 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Spots filled</span>
                        <span className="text-sm font-bold text-purple-600">{event.current_participants}/{event.max_participants}</span>
                      </div>
                      <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${(event.current_participants / event.max_participants) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Button 
                      className={`w-full rounded-full ${joinedEvents.includes(event.id) ? "bg-purple-100 text-purple-600" : "bg-purple-600 text-white hover:bg-purple-700"}`}
                      onClick={() => handleJoinEvent(event.id)}
                    >
                      {joinedEvents.includes(event.id) ? "You're In!" : "Reserve Your Spot"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-dashed border-2 border-purple-200 bg-purple-500/5">
              <CardContent className="py-8 text-center">
                <h3 className="font-bold text-lg text-foreground mb-2">Want more speed dating sessions?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  We host events every Friday and Sunday. Premium members get early access.
                </p>
                <Button variant="outline" className="rounded-full border-purple-300 text-purple-600 hover:bg-purple-50">
                  View Full Schedule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Interest Rooms Tab */}
            <TabsContent value="rooms" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tighter text-primary">Interest-Based Rooms</h2>
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <Card 
                    key={room.id} 
                    className={`border-border bg-card cursor-pointer hover:shadow-lg transition-all ${joinedRooms.includes(room.id) ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-primary">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-black tracking-tighter text-primary">{room.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {/* In a real app we'd join to get member count */}
                            Join the discussion
                            {room.is_active && (
                              <span className="flex items-center gap-1 text-green-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 ${joinedRooms.includes(room.id) ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Discussion Events */}
              <div className="mt-8">
                <h3 className="text-lg font-black tracking-tighter text-primary mb-4">Upcoming Discussions</h3>
                <div className="space-y-4">
                  {filteredEvents.filter(e => e.event_type === 'interest_room').map((event) => (
                    <Card key={event.id} className="border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-black tracking-tighter text-primary">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{formatDate(event.event_date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-bold text-foreground">{event.current_participants} joined</p>
                              <p className="text-xs text-muted-foreground">{event.max_participants - event.current_participants} spots left</p>
                            </div>
                            <Button 
                              size="sm" 
                              className={`rounded-full ${joinedEvents.includes(event.id) ? "bg-blue-100 text-blue-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                              onClick={() => handleJoinEvent(event.id)}
                            >
                              {joinedEvents.includes(event.id) ? "Joined" : "Join"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}
