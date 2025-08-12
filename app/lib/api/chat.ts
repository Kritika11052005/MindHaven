export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    technique: string;
    goal: string;
    progress: unknown[]; // changed from any[] to unknown[]
    analysis?: {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
    };
  };
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse {
  message: string;
  response?: string;
  analysis?: {
    emotionalState: string;
    themes: string[];
    riskLevel: number;
    recommendedApproach: string;
    progressIndicators: string[];
  };
  metadata?: {
    technique: string;
    goal: string;
    progress: unknown[]; // changed from any[] to unknown[]
  };
}


// ✅ This goes through your Next.js API routes
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

// Helper function to get auth headers
// Export this function so other components can use it
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("No authentication token found");
  }
  
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const createChatSession = async (): Promise<string> => {
  try {
    console.log("Creating new chat session...");
    const response = await fetch(`${API_BASE}/chat/sessions`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to create chat session:", error);
      throw new Error(error.error || "Failed to create chat session");
    }

    const data = await response.json();
    console.log("Chat session created:", data);
    return data.sessionId;
  } catch (error) {
    console.error("Error creating chat session:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  sessionId: string,
  message: string
): Promise<ApiResponse> => {
  try {
    console.log(`Sending message to session ${sessionId}:`, message);
    const response = await fetch(
      `${API_BASE}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to send message:", error);
      throw new Error(error.error || "Failed to send message");
    }

    const data = await response.json();
    console.log("Message sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

export const getChatHistory = async (
  sessionId: string
): Promise<ChatMessage[]> => {
  try {
    console.log(`Fetching chat history for session ${sessionId}`);
    const response = await fetch(
      `${API_BASE}/chat/sessions/${sessionId}/history`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to fetch chat history:", error);
      throw new Error(error.error || "Failed to fetch chat history");
    }

    const data = await response.json();
    console.log("Received chat history:", data);

    if (!Array.isArray(data)) {
      console.error("Invalid chat history format:", data);
      throw new Error("Invalid chat history format");
    }

    // Ensure each message has the correct format
    return data.map((msg: Partial<ChatMessage>) => ({
  role: msg.role as "user" | "assistant",
  content: msg.content as string,
  timestamp: new Date(msg.timestamp as string | number | Date),
  metadata: msg.metadata as ChatMessage["metadata"],
})) as ChatMessage[];

  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    console.log("=== DEBUGGING getAllChatSessions ===");
    
    // Debug 1: Check token existence
    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token);
    console.log("Token value:", token ? `${token.substring(0, 20)}...` : "null");
    
    // Debug 2: Check API_BASE
    console.log("API_BASE:", API_BASE);
    console.log("Full URL:", `${API_BASE}/chat/sessions`);
    
    // Debug 3: Check headers being sent
    const headers = getAuthHeaders();
    console.log("Headers being sent:", headers);
    console.log("Authorization header present:", !!headers.Authorization);
    
    console.log("Making fetch request...");
    const response = await fetch(`${API_BASE}/chat/sessions`, {
      headers: getAuthHeaders(),
    });

    console.log("Response received:");
    console.log("- Status:", response.status);
    console.log("- Status Text:", response.statusText);
    console.log("- Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error("Response not OK, attempting to parse error...");
      let error;
      try {
        error = await response.json();
        console.error("Error response body:", error);
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        error = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      throw new Error(error.error || "Failed to fetch chat sessions");
    }

    console.log("Parsing successful response...");
    const data = await response.json();
    console.log("Raw response data:", data);
    console.log("Data type:", typeof data);
    console.log("Is array:", Array.isArray(data));
    console.log("Data length:", data?.length);

    const mappedData = (data as Partial<ChatSession>[]).map((session) => {
  // Ensure dates are valid
  const createdAt = new Date(session.createdAt as string | number | Date ?? Date.now());
  const updatedAt = new Date(session.updatedAt as string | number | Date ?? Date.now());

  return {
    ...session,
    createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
    updatedAt: isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
    messages: (session.messages ?? []).map((msg) => ({
      ...msg,
      timestamp: new Date((msg?.timestamp as string | number | Date) ?? Date.now()),
    })),
  } as ChatSession;
});


    console.log("Mapped data:", mappedData);
    console.log("=== END DEBUGGING ===");
    
    return mappedData;
  } catch (error) {
  console.error("=== ERROR in getAllChatSessions ===");

  if (error instanceof Error) {
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
  } else {
    console.error("Error type:", typeof error);
    console.error("Error message:", String(error));
  }

  console.error("Full error object:", error);
  console.error("=== END ERROR ===");
  throw error;
}

};