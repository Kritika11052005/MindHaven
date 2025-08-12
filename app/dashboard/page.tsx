"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Activity,
  Sun,
  Moon,
  Heart,
  Trophy,
  Bell,
  AlertCircle,
  PhoneCall,
  Sparkles,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  X,
  Loader2,
  TrendingUp,
  Target,
  LucideIcon
  
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Container } from "../components/ui/container";
import { cn } from "../lib/utils";

import { MoodForm } from "../components/mood/moodForm";
import { AnxietyGames } from "../components/games/anxietyGames";
import { getMoodHistory,trackMood } from "../lib/api/mood";
import { getUserActivities,saveMoodData,logActivity } from "@/lib/staticDashboardData";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  format,
  subDays,
  startOfDay,
  isWithinInterval,
} from "date-fns";
import { ActivityLogger } from "../components/activities/activittiesLogger";
import { useSession } from "../lib/context/sessionContext";
import { getAllChatSessions,getAuthHeaders } from "@/lib/api/chat";

// Add this type definition
type ActivityLevel = "none" | "low" | "medium" | "high";

interface DayActivity {
  date: Date;
  level: ActivityLevel;
  activities: {
    type: string;
    name: string;
    completed: boolean;
    time?: string;
  }[];
}
interface Insight {
  title: string;
  description: string;
  icon: LucideIcon; // This is the correct type from lucide-react
  priority: "low" | "medium" | "high";
}
// Add this interface near the top with other interfaces
interface Activity {
  id: string;
  userId: string | null;
  type: string;
  name: string;
  description: string | null;
  timestamp: Date;
  duration: number | null;
  completed: boolean;
  moodScore: number | null;
  moodNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Add this interface for stats
interface DailyStats {
  moodScore: number | null;
  completionRate: number;
  therapySessions: number; // ✅ ADD THIS - separate from mindfulness
  mindfulnessCount: number;
  totalActivities: number;
  lastUpdated: Date;
}
interface MoodEntry {
  score: number;
}
interface MoodHistoryResponse {
  success: boolean;
  data?: MoodEntry[];
}
interface ApiChatSession {
  id: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  title?: string;
  status?: string;
  // This matches what getAllChatSessions actually returns
}
interface ApiActivity {
  id: string;
  userId?: string | null;
  type: string;
  name: string;
  description?: string | null;
  timestamp: string;
  duration?: number | null;
  completed: boolean;
  moodScore?: number | null;
  moodNote?: string | null;
  createdAt: string;
  updatedAt: string;
}
const convertApiActivityToActivity = (apiActivity: ApiActivity): Activity => {
  return {
    id: apiActivity.id,
    userId: apiActivity.userId ?? null, // Use nullish coalescing to convert undefined to null
    type: apiActivity.type,
    name: apiActivity.name,
    description: apiActivity.description ?? null,
    timestamp: new Date(apiActivity.timestamp),
    duration: apiActivity.duration ?? null,
    completed: apiActivity.completed,
    moodScore: apiActivity.moodScore ?? null,
    moodNote: apiActivity.moodNote ?? null,
    createdAt: new Date(apiActivity.createdAt),
    updatedAt: new Date(apiActivity.updatedAt),
  };
};
// Update the calculateDailyStats function to show correct stats
const calculateDailyStats = (activities: Activity[]): DailyStats => {
  const today = startOfDay(new Date());
  const todaysActivities = activities.filter((activity) =>
    isWithinInterval(new Date(activity.timestamp), {
      start: today,
      end: addDays(today, 1),
    })
  );

  // Calculate mood score (average of today's mood entries)
  const moodEntries = todaysActivities.filter(
    (a) => a.type === "mood" && a.moodScore !== null
  );
  const averageMood =
    moodEntries.length > 0
      ? Math.round(
          moodEntries.reduce((acc, curr) => acc + (curr.moodScore || 0), 0) /
            moodEntries.length
        )
      : null;

  // Count therapy sessions (all sessions ever)
  const therapySessions = activities.filter((a) => a.type === "therapy").length;

  return {
  moodScore: averageMood,
  completionRate: 100,
  therapySessions: therapySessions, // ✅ ADD THIS LINE
  mindfulnessCount: therapySessions, // This was your original line - you can keep it or change it
  totalActivities: todaysActivities.length,
  lastUpdated: new Date(),
};
};

// Rename the function
// Replace your existing generateInsights function with this:
const generateInsights = (activities: Activity[]): Insight[] => {
  console.log("🔍 Generating insights with activities:", activities.length);
  
  const insights: Insight[] = [];

  // Don't clear insights if no activities - provide defaults instead
  if (activities.length === 0) {
    console.log("💡 No activities, showing default insights");
    return [
      {
        title: "Welcome Back!",
        description: "Try AI therapy to get personalized insights.",
        icon: Sparkles,
        priority: "high",
      },
      {
        title: "Daily Check-in",
        description: "Track your mood today to see how you're feeling and get better recommendations.",
        icon: Heart,
        priority: "medium",
      },
      {
        title: "Mindfulness Practice",
        description: "Try our anxiety-relief games to build healthy coping strategies.",
        icon: Brain,
        priority: "low",
      }
    ];
  }


  // Rest of your existing generateInsights code stays the same...
  const lastWeek = subDays(new Date(), 7);
  const recentActivities = activities.filter(
    (a) => new Date(a.timestamp) >= lastWeek
  );

  const moodEntries = recentActivities.filter(
    (a) => a.type === "mood" && a.moodScore !== null
  );
  if (moodEntries.length >= 2) {
    const averageMood =
      moodEntries.reduce((acc, curr) => acc + (curr.moodScore || 0), 0) /
      moodEntries.length;
    const latestMood = moodEntries[moodEntries.length - 1].moodScore || 0;

    if (latestMood > averageMood) {
      insights.push({
        title: "Mood Improvement",
        description:
          "Your recent mood scores are above your weekly average. Keep up the good work!",
        icon: Brain,
        priority: "high",
      });
    } else if (latestMood < averageMood - 20) {
      insights.push({
        title: "Mood Change Detected",
        description:
          "I've noticed a dip in your mood. Would you like to try some mood-lifting activities?",
        icon: Heart,
        priority: "high",
      });
    }
  }

  const mindfulnessActivities = recentActivities.filter((a) =>
    ["game", "meditation", "breathing"].includes(a.type)
  );
  if (mindfulnessActivities.length > 0) {
    const dailyAverage = mindfulnessActivities.length / 7;
    if (dailyAverage >= 1) {
      insights.push({
        title: "Consistent Practice",
        description: `You've been regularly engaging in mindfulness activities. This can help reduce stress and improve focus.`,
        icon: Trophy,
        priority: "medium",
      });
    } else {
      insights.push({
        title: "Mindfulness Opportunity",
        description:
          "Try incorporating more mindfulness activities into your daily routine.",
        icon: Sparkles,
        priority: "low",
      });
    }
  }

  const completedActivities = recentActivities.filter((a) => a.completed);
  const completionRate =
    recentActivities.length > 0
      ? (completedActivities.length / recentActivities.length) * 100
      : 0;

  if (completionRate >= 80) {
    insights.push({
      title: "High Achievement",
      description: `You've completed ${Math.round(
        completionRate
      )}% of your activities this week. Excellent commitment!`,
      icon: Trophy,
      priority: "high",
    });
  } else if (completionRate < 50) {
    insights.push({
      title: "Activity Reminder",
      description:
        "You might benefit from setting smaller, more achievable daily goals.",
      icon: Calendar,
      priority: "medium",
    });
  }

  const morningActivities = recentActivities.filter(
    (a) => new Date(a.timestamp).getHours() < 12
  );
  const eveningActivities = recentActivities.filter(
    (a) => new Date(a.timestamp).getHours() >= 18
  );

  if (morningActivities.length > eveningActivities.length) {
    insights.push({
      title: "Morning Person",
      description:
        "You're most active in the mornings. Consider scheduling important tasks during your peak hours.",
      icon: Sun,
      priority: "medium",
    });
  } else if (eveningActivities.length > morningActivities.length) {
    insights.push({
      title: "Evening Routine",
      description:
        "You tend to be more active in the evenings. Make sure to wind down before bedtime.",
      icon: Moon,
      priority: "medium",
    });
  }

  console.log("💡 Generated insights:", insights.length);
  return insights
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const {isAuthenticated, user } = useSession();
   const [loading, setLoading] = useState(false);
  // Rename the state variable
  const [insights, setInsights] = useState<Insight[]>([]);

  // New states for activities and wearables
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showCheckInChat, setShowCheckInChat] = useState(false);
  const [activityHistory, setActivityHistory] = useState<DayActivity[]>([]);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
  moodScore: null,
  completionRate: 100,
  therapySessions: 0, // ✅ ADD THIS
  mindfulnessCount: 0,
  totalActivities: 0,
  lastUpdated: new Date(),
});

  // Add this function to transform activities into day activity format
  const transformActivitiesToDayActivity = (
    activities: Activity[]
  ): DayActivity[] => {
    const days: DayActivity[] = [];
    const today = new Date();

    // Create array for last 28 days
    for (let i = 27; i >= 0; i--) {
      const date = startOfDay(subDays(today, i));
      const dayActivities = activities.filter((activity) =>
        isWithinInterval(new Date(activity.timestamp), {
          start: date,
          end: addDays(date, 1),
        })
      );

      // Determine activity level based on number of activities
      let level: ActivityLevel = "none";
      if (dayActivities.length > 0) {
        if (dayActivities.length <= 2) level = "low";
        else if (dayActivities.length <= 4) level = "medium";
        else level = "high";
      }

      days.push({
        date,
        level,
        activities: dayActivities.map((activity) => ({
          type: activity.type,
          name: activity.name,
          completed: activity.completed,
          time: format(new Date(activity.timestamp), "h:mm a"),
        })),
      });
    }

    return days;
  };

  // Modify the loadActivities function to use a default user ID
  const loadActivities = useCallback(async () => {
  try {
    console.log("📊 Loading activities...");
    const userActivities = await getUserActivities("default-user");
    console.log("📊 Loaded activities:", userActivities.length, userActivities);
    
    setActivities(userActivities);
    setActivityHistory(transformActivitiesToDayActivity(userActivities));
  } catch (error) {
    console.error("Error loading activities:", error);
  }
}, []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Add this effect to update stats when activities change
  useEffect(() => {
    if (activities.length > 0) {
      setDailyStats(calculateDailyStats(activities));
    }
  }, [activities]);

  // Update the effect
  // Update the effect
// Make sure you have this useEffect in your component
useEffect(() => {
  console.log("🔄 Activities changed, regenerating insights:", activities.length);
  const newInsights = generateInsights(activities);
  console.log("🔄 New insights generated:", newInsights.length);
  setInsights(newInsights);
}, [activities]); // This will trigger when activities array changes
  // Add function to fetch daily stats
// Update your fetchDailyStats function to log the actual structure of activities:
const fetchDailyStats = useCallback(async () => {
  console.log("=== FETCHING DAILY STATS ===");
  setLoading(true);
  if (!isAuthenticated) return;
  
  try {
    console.log("=== FETCHING DAILY STATS ===");
    
    // Fetch therapy sessions
    const sessions = await getAllChatSessions();
    console.log("📝 Fetched sessions:", sessions);
    console.log("📊 Sessions count:", sessions.length);
    
    // Filter for today's sessions if you want only today's count
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return sessionDate >= startOfToday && sessionDate <= endOfToday;
    });
    
    console.log("📅 Today's sessions:", todaySessions);
    console.log("📅 Today's sessions count:", todaySessions.length);
    
    // Fetch activities  
    const activitiesResponse = await fetch("/api/activities?filter=today", {
      headers: getAuthHeaders(),
    });
    const activitiesData: ApiActivity[] = await activitiesResponse.json();
    console.log("🎯 Activities:", activitiesData);
    
    const convertedActivities = activitiesData.map(convertApiActivityToActivity);
    setActivities(convertedActivities);
    console.log("✅ Activities state updated with:", activitiesData.length, "activities");

    // Get mood data
    let averageMood = null;
    try {
      const moodResponse: MoodHistoryResponse = await getMoodHistory({
        startDate: startOfToday.toISOString(),
        endDate: endOfToday.toISOString()
      });
      
      if (moodResponse.success && moodResponse.data?.length && moodResponse.data.length > 0) {
        const total = moodResponse.data.reduce((acc: number, mood: MoodEntry) => acc + mood.score, 0);
        averageMood = Math.round(total / moodResponse.data.length);
      }
    } catch (error) {
      console.error("Error fetching mood:", error);
    }

    // Calculate mindfulness activities from actual activities
    const mindfulnessActivities = activitiesData.filter((activity: ApiActivity) => 
      ['meditation', 'breathing', 'mindfulness', 'game'].includes(activity.type)
    );

    const newStats = {
      moodScore: averageMood,
      completionRate: 100,
      therapySessions: sessions.length, // ✅ TOTAL therapy sessions (all time)
      mindfulnessCount: mindfulnessActivities.length, // ✅ Actual mindfulness activities
      totalActivities: activitiesData.length,
      lastUpdated: new Date(),
    };

    console.log("📊 Setting daily stats:", newStats);
    setDailyStats(newStats);
    
    // ✅ OPTIONAL: Generate insights immediately after setting activities
    console.log("🔄 Generating insights with fetched activities:", convertedActivities.length);
    const newInsights = generateInsights(convertedActivities);
    setInsights(newInsights);
    
  } catch (error) {
    console.error("Error fetching stats:", error);
  } finally {
    setLoading(false);
  }
}, [isAuthenticated]);

// 3. Update your MoodForm success callback to use the correct API:
// Replace your existing MoodForm component with this:
<MoodForm onSuccess={async () => {
  console.log("=== MOOD FORM SUCCESS CALLBACK ===");
  setShowMoodModal(false);
  
  // Add a longer delay to ensure the mood API has processed the data
  setTimeout(async () => {
    console.log("🔄 Refreshing stats after mood save...");
    await fetchDailyStats();
  }, 1500);
}} />

// 4. ALTERNATIVE: If you want real-time updates, create a more direct approach:
const fetchTodaysMoodScore = async (): Promise<number | null> => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const response:MoodHistoryResponse = await getMoodHistory({
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString()
    });
    
    if (response.success && response.data && response.data.length > 0) {
      const total = response.data.reduce((acc: number, mood: MoodEntry) => acc + mood.score, 0);
      return Math.round(total / response.data.length);
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching today's mood:", error);
    return null;
  }
};

// 5. Create a dedicated mood refresh function:
const refreshMoodScore = useCallback(async () => {
  if (!isAuthenticated) return;
  
  console.log("🔄 Refreshing mood score...");
  
  try {
    const moodScore = await fetchTodaysMoodScore();
    console.log("🧠 Fetched mood score:", moodScore);
    
    setDailyStats(prev => ({
      ...prev,
      moodScore: moodScore,
      lastUpdated: new Date()
    }));
    
    console.log("✅ Mood score updated");
  } catch (error) {
    console.error("❌ Error refreshing mood score:", error);
  }
}, [isAuthenticated]);
const debugApiResponse = async () => {
  try {
    const response = await fetch("/api/activities?filter=today", {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    
    console.log("🔍 DEBUG: Full API response:", data);
    
    data.forEach((activity: ApiActivity, index: number) => {
      console.log(`🔍 Activity ${index}:`, {
        id: activity.id,
        type: activity.type,
        allKeys: Object.keys(activity),
        fullObject: activity
      });
    });
  } catch (error) {
    console.error("🔍 DEBUG: API error:", error);
  }
};
useEffect(() => {
  if (isAuthenticated) {
    debugApiResponse();
  }
}, [isAuthenticated]);
  // Fetch stats on mount and every 5 minutes
  useEffect(() => {
    fetchDailyStats();
    const interval = setInterval(fetchDailyStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDailyStats]);

  // Update wellness stats to reflect the changes
  const wellnessStats = [
  {
    title: "Mood Score",
    value: dailyStats.moodScore ? `${dailyStats.moodScore}%` : "No data",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Today's average mood",
  },
  {
    title: "Completion Rate", 
    value: "100%",
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    description: "Perfect completion rate",
  },
  {
    title: "Therapy Sessions",
    value: `${dailyStats.therapySessions} sessions`, // ✅ USE therapySessions instead of mindfulnessCount
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10", 
    description: "Total sessions started",
  },
  {
    title: "Total Activities",
    value: dailyStats.totalActivities.toString(),
    icon: Activity,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Planned for today",
  },
];

  // Load activities on mount
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Add these action handlers
  const handleStartTherapy = () => {
    router.push("/therapy/new");
  };

  const handleMoodSubmit = async (data: { moodScore: number }) => {
  setIsSavingMood(true);
  try {
    await saveMoodData({
      userId: "default-user", 
      mood: data.moodScore,
      note: "",
    });
    setShowMoodModal(false);
    
    // Add delay before refreshing
    setTimeout(async () => {
      await fetchDailyStats();
    }, 1000);
  } catch (error) {
    console.error("Error saving mood:", error);
  } finally {
    setIsSavingMood(false);
  }
};
const handleAICheckIn = () => {
    setShowActivityLogger(true);
  };
  // Add handler for game activities
  const handleGamePlayed = useCallback(
  async (gameName: string, description: string) => {
    try {
      await logActivity({
        userId: "default-user",
        type: "game",
        name: gameName,
        description: description,
        duration: 0,
      });

      // Refresh both activities and daily stats
      loadActivities();
      fetchDailyStats(); // Add this line
    } catch (error) {
      console.error("Error logging game activity:", error);
    }
  },
  [loadActivities, fetchDailyStats] // Add fetchDailyStats to dependencies
);

  // Simple loading state
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-20 pb-8 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name || "there"}
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="space-y-6">
          {/* Top Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Actions Card */}
            <Card className="border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent" />
              <CardContent className="p-6 relative">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Quick Actions</h3>
                      <p className="text-sm text-muted-foreground">
                        Start your wellness journey
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Button
                      variant="default"
                      className={cn(
                        "w-full justify-between items-center p-6 h-auto group/button",
                        "bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90",
                        "transition-all duration-200 group-hover:translate-y-[-2px]"
                      )}
                      onClick={handleStartTherapy}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-white">
                            Start Therapy
                          </div>
                          <div className="text-xs text-white/80">
                            Begin a new session
                          </div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover/button:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/mood hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={() => setShowMoodModal(true)}
                      >
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                          <Heart className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Track Mood</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            How are you feeling?
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className={cn(
                          "flex flex-col h-[120px] px-4 py-3 group/ai hover:border-primary/50",
                          "justify-center items-center text-center",
                          "transition-all duration-200 group-hover:translate-y-[-2px]"
                        )}
                        onClick={handleAICheckIn}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                          <BrainCircuit className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Check-in</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Quick wellness check
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Overview Card */}
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today&apos;s Overview</CardTitle>
                    <CardDescription>
                      Your wellness metrics for{" "}
                      {format(new Date(), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchDailyStats}
                    className="h-8 w-8"
                  >
                    <Loader2 className={cn("h-4 w-4", "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {wellnessStats.map((stat) => (
                    <div
                      key={stat.title}
                      className={cn(
                        "p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                        stat.bgColor
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                        <p className="text-sm font-medium">{stat.title}</p>
                      </div>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-right">
                  Last updated: {format(dailyStats.lastUpdated, "h:mm a")}
                </div>
              </CardContent>
            </Card>

            {/* Insights Card */}
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Insights
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your activity patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg space-y-2 transition-all hover:scale-[1.02]",
                          insight.priority === "high"
                            ? "bg-primary/10"
                            : insight.priority === "medium"
                            ? "bg-primary/5"
                            : "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <insight.icon className="w-5 h-5 text-primary" />
                          <p className="font-medium">{insight.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>
                        Complete more activities to receive personalized
                        insights
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - Spans 2 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* Anxiety Games - Now directly below Fitbit */}
              <AnxietyGames onGamePlayed={handleGamePlayed} />
            </div>
          </div>
        </div>
      </Container>

      {/* Mood tracking modal */}
      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
            <DialogDescription>
              Move the slider to track your current mood
            </DialogDescription>
          </DialogHeader>
          
<MoodForm 
      onSuccess={(data) => {
        console.log("=== MOOD FORM SUCCESS CALLBACK ===");
        console.log("Mood data saved:", data);
        setShowMoodModal(false);
        
        // Refresh stats after a delay to ensure backend has processed the data
        setTimeout(() => {
          console.log("🔄 Refreshing stats after mood save...");
          fetchDailyStats();
        }, 1500);
      }} 
    />
        </DialogContent>
      </Dialog>

      {/* AI check-in chat */}
      {showCheckInChat && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background border-l shadow-lg">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold">AI Check-in</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCheckInChat(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4"></div>
            </div>
          </div>
        </div>
      )}

      <ActivityLogger
  open={showActivityLogger}
  onOpenChange={setShowActivityLogger}
  onActivityLogged={() => {
    console.log("Activity logged, refreshing data..."); // Add for debugging
    loadActivities();
    fetchDailyStats(); // This should refresh the Today's Overview
  }}
/>
    </div>
  );
}