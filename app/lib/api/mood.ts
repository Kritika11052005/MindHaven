import { API_URL } from '@/app/config/constants';
interface MoodEntry {
  score: number;
  note?: string;
}

interface MoodStats {
  average: number;
  count: number;
  highest: number;
  lowest: number;
  history: Array<{
    _id: string;
    score: number;
    note?: string;
    timestamp: string;
  }>;
}

// Do the same for your other functions:
export async function trackMood(data: MoodEntry): Promise<{ success: boolean; data: any }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  // CHANGE THIS LINE:
  const response = await fetch(`${API_URL}/api/mood`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to track mood");
  }

  return response.json();
}


export async function getMoodHistory(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ success: boolean; data: any[] }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  // CHANGE THIS LINE - add the full server URL:
  const response = await fetch(`http://localhost:3001/api/mood/history?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch mood history");
  }

  return response.json();
}

export async function getMoodStats(period: "week" | "month" | "year" = "week"): Promise<{ success: boolean; data: MoodStats; }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  // CHANGE THIS LINE:
  const response = await fetch(`http://localhost:3001/api/mood/stats?period=${period}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch mood statistics");
  }

  return response.json();
}