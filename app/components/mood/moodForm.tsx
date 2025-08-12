"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { useSession } from "@/lib/context/sessionContext";
import { useRouter } from "next/navigation";

// Updated interface to optionally accept mood data
interface MoodFormProps {
  onSuccess?: (data?: { moodScore: number; note?: string }) => void;
}

export function MoodForm({ onSuccess }: MoodFormProps) {
  const [moodScore, setMoodScore] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, loading } = useSession();
  const router = useRouter();

  const emotions = [
    { value: 0, label: "😔", description: "Very Low" },
    { value: 25, label: "😕", description: "Low" },
    { value: 50, label: "😊", description: "Neutral" },
    { value: 75, label: "😃", description: "Good" },
    { value: 100, label: "🤗", description: "Great" },
  ];

  const currentEmotion =
    emotions.find((em) => Math.abs(moodScore - em.value) < 15) || emotions[2];

  // Replace your handleSubmit function with this debug version:

const handleSubmit = async () => {
  console.log("MoodForm: Starting submission");
  console.log("MoodForm: Auth state:", { isAuthenticated, loading, user });

  if (!isAuthenticated) {
    console.log("MoodForm: User not authenticated");
    toast({
      title: "Authentication required",
      description: "Please log in to track your mood",
      variant: "destructive",
    });
    router.push("/login");
    return;
  }

  try {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    console.log("MoodForm: Token from localStorage:", token ? "exists" : "not found");

    // 🔍 DEBUG: Log the exact request details
    const requestUrl = "/api/mood";
    const requestBody = { score: moodScore };
    
    console.log("🔍 Making request to:", requestUrl);
    console.log("🔍 Request body:", requestBody);
    console.log("🔍 Token:", token?.substring(0, 20) + "...");

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("🔍 Response status:", response.status);
    console.log("🔍 Response ok:", response.ok);
    console.log("🔍 Response headers:", Object.fromEntries(response.headers.entries()));

    // 🔍 Get the raw response text first
    const responseText = await response.text();
    console.log("🔍 Raw response text:", responseText);

    // 🔍 Check if it's HTML (error page)
    if (responseText.startsWith("<!DOCTYPE") || responseText.startsWith("<html")) {
      console.error("🚨 Received HTML instead of JSON!");
      console.error("🚨 This usually means:");
      console.error("  - API endpoint not found (404)");
      console.error("  - Authentication failed (redirected to login)");
      console.error("  - Server error (500)");
      
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
    }

    // 🔍 Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("🔍 Parsed JSON successfully:", data);
    } catch (parseError) {
      console.error("🚨 Failed to parse as JSON:", parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      console.error("🚨 API error response:", data);
      throw new Error(data.error || data.message || "Failed to track mood");
    }

    console.log("✅ Success response:", data);

    toast({
      title: "Mood tracked successfully!",
      description: "Your mood has been recorded.",
    });

    // Call onSuccess with the mood data
    onSuccess?.({ moodScore, note: "" });
    
  } catch (error) {
    console.error("🚨 MoodForm Error:", error);
    
    // Show more helpful error message
    let errorMessage = "Failed to track mood";
    if (error instanceof Error) {
      if (error.message.includes("HTML instead of JSON")) {
        errorMessage = "Server configuration error. Please check if the API is running correctly.";
      } else {
        errorMessage = error.message;
      }
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="space-y-6 py-4">
      {/* Emotion display */}
      <div className="text-center space-y-2">
        <div className="text-4xl">{currentEmotion.label}</div>
        <div className="text-sm text-muted-foreground">
          {currentEmotion.description}
        </div>
      </div>

      {/* Emotion slider */}
      <div className="space-y-4">
        <div className="flex justify-between px-2">
          {emotions.map((em) => (
            <div
              key={em.value}
              className={`cursor-pointer transition-opacity ${
                Math.abs(moodScore - em.value) < 15
                  ? "opacity-100"
                  : "opacity-50"
              }`}
              onClick={() => setMoodScore(em.value)}
            >
              <div className="text-2xl">{em.label}</div>
            </div>
          ))}
        </div>

        <Slider
          value={[moodScore]}
          onValueChange={(value) => setMoodScore(value[0])}
          min={0}
          max={100}
          step={1}
          className="py-4"
        />
      </div>

      {/* Submit button */}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isLoading || loading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : loading ? (
          "Loading..."
        ) : (
          "Save Mood"
        )}
      </Button>
    </div>
  );
}