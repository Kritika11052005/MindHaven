"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  LineChart,
  Brain,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Medal,
  Target,
  Smile,
  Frown,
  Meh,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { getMoodHistory } from "@/lib/api/mood";
import { useSession } from "@/lib/context/sessionContext";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

// Types for real mood data
interface MoodEntry {
  _id: string;
  score: number;
  note?: string;
  timestamp: string;
  activities?: string[];
}

interface ProcessedDayData {
  day: string;
  value: number;
  date: Date;
  entries: MoodEntry[];
  energy?: number;
  sleep?: number;
}

interface WeeklyStats {
  week: number;
  average: number;
  peak: number;
  low: number;
  count: number;
}

interface Insight {
  title: string;
  description: string;
  trend: "up" | "down" | "stable";
}

const getMoodEmoji = (value: number) => {
  if (value >= 80) return { icon: Smile, color: "text-green-500" };
  if (value >= 60) return { icon: Meh, color: "text-yellow-500" };
  return { icon: Frown, color: "text-red-500" };
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "positive":
      return "bg-green-500/10 text-green-500";
    case "negative":
      return "bg-red-500/10 text-red-500";
    default:
      return "bg-yellow-500/10 text-yellow-500";
  }
};

export function MoodTracker() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moodData, setMoodData] = useState<ProcessedDayData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const { isAuthenticated } = useSession();

  // Process raw mood data into daily summaries
  const processMoodData = useCallback((rawData: MoodEntry[]): ProcessedDayData[] => {
    const days = [];
    const today = new Date();
    
    // Create array for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      // Filter entries for this day
      const dayEntries = rawData.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= dayStart && entryDate <= dayEnd;
      });
      
      // Calculate average mood for the day
      const averageMood = dayEntries.length > 0
        ? Math.round(dayEntries.reduce((sum, entry) => sum + entry.score, 0) / dayEntries.length)
        : 0;
      
      days.push({
        day: format(date, 'EEE'),
        value: averageMood,
        date,
        entries: dayEntries,
        energy: dayEntries.length > 0 ? Math.min(averageMood + 10, 100) : 0, // Mock energy based on mood
        sleep: dayEntries.length > 0 ? 7 + (averageMood - 50) / 25 : 0, // Mock sleep based on mood
      });
    }
    
    return days;
  }, []);

  // Generate insights from mood data
  const generateInsights = useCallback((dailyData: ProcessedDayData[]): Insight[] => {
    const insights: Insight[] = [];
    const validDays = dailyData.filter(day => day.value > 0);
    
    if (validDays.length < 2) {
      return [{
        title: "Getting Started",
        description: "Track your mood for a few more days to see insights",
        trend: "stable"
      }];
    }
    
    // Analyze trend
    const recentMood = validDays.slice(-3).reduce((sum, day) => sum + day.value, 0) / 3;
    const earlierMood = validDays.slice(0, -3).reduce((sum, day) => sum + day.value, 0) / Math.max(validDays.length - 3, 1);
    
    if (recentMood > earlierMood + 5) {
      insights.push({
        title: "Mood Improvement",
        description: `Your mood has improved by ${Math.round(recentMood - earlierMood)}% recently`,
        trend: "up"
      });
    } else if (recentMood < earlierMood - 5) {
      insights.push({
        title: "Mood Dip Detected",
        description: `Your mood has decreased by ${Math.round(earlierMood - recentMood)}% recently`,
        trend: "down"
      });
    } else {
      insights.push({
        title: "Stable Mood",
        description: "Your mood has been consistent over the past week",
        trend: "stable"
      });
    }
    
    // Analyze consistency
    const moodValues = validDays.map(day => day.value);
    const variance = moodValues.reduce((sum, value) => {
      const diff = value - (moodValues.reduce((a, b) => a + b, 0) / moodValues.length);
      return sum + diff * diff;
    }, 0) / moodValues.length;
    
    if (variance < 100) {
      insights.push({
        title: "Consistent Tracking",
        description: "Your mood scores show good stability",
        trend: "up"
      });
    } else {
      insights.push({
        title: "Mood Variability",
        description: "Your mood has varied significantly this week",
        trend: "stable"
      });
    }
    
    return insights;
  }, []);

  // Fetch mood data
  const fetchMoodData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("📊 Fetching mood history...");
      
      // Fetch last 30 days of mood data
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      
      const response = await getMoodHistory({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      console.log("📊 Mood history response:", response);
      
      if (response.success && response.data) {
        const processedDaily = processMoodData(response.data);
        setMoodData(processedDaily);
        
        // Generate insights
        const newInsights = generateInsights(processedDaily);
        setInsights(newInsights);
        
        // Calculate weekly stats (mock for now)
        const stats: WeeklyStats[] = [];
        for (let week = 1; week <= 4; week++) {
          const weekData = response.data.filter((_, index) => 
            Math.floor(index / 7) === week - 1
          );
          
          if (weekData.length > 0) {
            const scores = weekData.map(entry => entry.score);
            stats.push({
              week,
              average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
              peak: Math.max(...scores),
              low: Math.min(...scores),
              count: weekData.length
            });
          }
        }
        setWeeklyStats(stats);
        
        console.log("📊 Processed mood data successfully");
      } else {
        console.log("📊 No mood data available");
        setMoodData([]);
        setInsights([{
          title: "No Data Yet",
          description: "Start tracking your mood to see insights here",
          trend: "stable"
        }]);
      }
    } catch (err) {
      console.error("📊 Error fetching mood data:", err);
      setError("Failed to load mood data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, processMoodData, generateInsights]);

  // Fetch data on mount and when authentication changes
  useEffect(() => {
    fetchMoodData();
  }, [fetchMoodData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchMoodData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMoodData]);

  if (!isAuthenticated) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Please log in to view your mood insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Loading mood data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMoodData}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEntries = moodData.reduce((sum, day) => sum + day.entries.length, 0);
  const averageMood = moodData.filter(day => day.value > 0).length > 0
    ? Math.round(moodData.filter(day => day.value > 0).reduce((sum, day) => sum + day.value, 0) / moodData.filter(day => day.value > 0).length)
    : 0;

  return (
    <Card className="border-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Mood Insights
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your emotional journey over time • {totalEntries} entries
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === "week" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button 
              variant={viewMode === "month" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchMoodData}>
              <Loader2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalEntries === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No mood data yet</h3>
            <p className="text-sm">Start tracking your mood to see insights here</p>
          </div>
        ) : (
          <>
            {/* Enhanced Daily Mood Chart */}
            <div className="space-y-4">
              <div className="h-[200px] flex items-end justify-between relative">
                {moodData.map((day, index) => (
                  <div
                    key={`${day.day}-${day.date.getTime()}`}
                    className="flex flex-col items-center space-y-2 group relative"
                    onClick={() =>
                      setSelectedDay(selectedDay === index ? null : index)
                    }
                  >
                    <AnimatePresence>
                      {selectedDay === index && day.entries.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute -top-4 left-1/2 -translate-x-1/2 bg-popover/95 p-4 rounded-lg shadow-lg w-64 space-y-3 backdrop-blur-sm border border-border z-10"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">
                              {format(day.date, 'EEEE, MMM d')}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-primary" />
                              <span className="text-sm">{day.value}%</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {day.entries.length} mood {day.entries.length === 1 ? 'entry' : 'entries'}
                            </p>
                            {day.entries.slice(0, 3).map((entry, i) => (
                              <div
                                key={entry._id}
                                className="flex items-center justify-between p-2 rounded-lg bg-background"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <Activity className="w-3 h-3" />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {entry.score}% mood
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entry.timestamp), 'h:mm a')}
                                </span>
                              </div>
                            ))}
                            {day.entries.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{day.entries.length - 3} more entries
                              </p>
                            )}
                          </div>

                          {day.value > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Energy</p>
                                <Progress value={day.energy} className="h-1 mt-1" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Sleep</p>
                                <p className="text-sm font-medium">{day.sleep?.toFixed(1)}hrs</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative w-12 cursor-pointer">
                      {day.value > 0 ? (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(day.value, 5)}%` }}
                          transition={{ delay: index * 0.1 }}
                          className={`w-8 rounded-full bg-gradient-to-t from-primary/20 to-primary/30 group-hover:from-primary/30 group-hover:to-primary/40 transition-all absolute bottom-0 left-1/2 -translate-x-1/2 ${
                            selectedDay === index ? "ring-2 ring-primary" : ""
                          }`}
                        >
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            {React.createElement(getMoodEmoji(day.value).icon, {
                              className: `w-4 h-4 ${getMoodEmoji(day.value).color}`,
                            })}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="w-8 h-2 rounded-full bg-muted absolute bottom-0 left-1/2 -translate-x-1/2" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors ${
                        selectedDay === index
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {day.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights Grid */}
            {insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {insights.map((insight, index) => (
                  <div key={index} className="p-4 rounded-lg bg-primary/5 space-y-2">
                    <div className="flex items-center gap-2">
                      {insight.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : insight.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <LineChart className="w-4 h-4 text-yellow-500" />
                      )}
                      <h4 className="font-medium">{insight.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Monthly Overview */}
            {weeklyStats.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Weekly Overview
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Average mood: {averageMood}%
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {weeklyStats.map((week) => (
                    <div
                      key={week.week}
                      className="p-2 rounded-lg bg-primary/5 text-center"
                    >
                      <p className="text-sm font-medium">Week {week.week}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg: {week.average}%
                      </p>
                      <div className="text-xs space-x-2 text-muted-foreground">
                        <span className="text-green-500">↑{week.peak}</span>
                        <span className="text-yellow-500">↓{week.low}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {week.count} entries
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}