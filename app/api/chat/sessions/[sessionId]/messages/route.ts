import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Await the params to fix the Next.js error
    const { sessionId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log(`Sending message to session ${sessionId}:`, message);
    
    // Forward authentication headers from the original request
    const authHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Copy common auth headers if they exist
    const authorization = req.headers.get("authorization");
    const cookie = req.headers.get("cookie");
    
    if (authorization) {
      authHeaders["Authorization"] = authorization;
    }
    
    if (cookie) {
      authHeaders["Cookie"] = cookie;
    }

    const response = await fetch(
      `${BACKEND_API_URL}/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("Failed to send message:", error);
      return NextResponse.json(
        { error: error.error || error.message || "Failed to send message" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Message sent successfully:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}