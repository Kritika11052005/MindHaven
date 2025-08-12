import { API_URL } from '@/app/config/constants';

interface ActivityEntry {
  type: string;
  name: string;
  description?: string;
  duration?: number;
}

interface ActivityResponse {
  _id: string;
  type: string;
  name: string;
  description?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
}

export async function logActivity(
  data: ActivityEntry
): Promise<ApiSuccessResponse<ActivityResponse>> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_URL}/api/activity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error((error as { message?: string }).message || "Failed to log activity");
    } else {
      const errorText = await response.text();
      console.error("Non-JSON error from /api/activity:", errorText);
      throw new Error("Failed to log activity — non-JSON response");
    }
  }

  return response.json();
}
