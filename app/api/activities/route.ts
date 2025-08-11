import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  try {
    // Get auth headers from the request
    const authorization = req.headers.get("authorization"); 
    const cookie = req.headers.get("cookie");
    
    console.log("🔍 Next.js API Debug (GET):");
    console.log("Authorization header:", authorization);
    console.log("Cookie header:", cookie);
    
    // Check for authentication
    if (!authorization && !cookie) {
      return NextResponse.json({ message: "No authentication provided" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // e.g., ?filter=today
    
    // Prepare headers for backend request
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authorization) {
      headers["Authorization"] = authorization;
    }
    
    if (cookie) {
      headers["Cookie"] = cookie;
    }

    // Build backend URL based on filter
    let backendUrl = `${API_URL}/api/activity`;
    if (filter === 'today') {
      backendUrl = `${API_URL}/api/activity/today`;
    }

    console.log(`Fetching activities from: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
    });

    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        console.log("Backend endpoint not found, returning empty array");
        return NextResponse.json([]);
      }
      
      const errorData = await response.json().catch(() => ({ 
        error: "Unknown backend error" 
      }));
      
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch activities" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Successfully fetched activities:", data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error fetching activities:", error);
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return NextResponse.json(
          { error: "Backend request timed out" },
          { status: 504 }
        );
      }
      
      if (error.message.includes('fetch failed')) {
        console.log("Backend connection failed, returning empty array");
        return NextResponse.json([]);
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, name, description, duration } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: "Type and name are required" },
        { status: 400 }
      );
    }

    console.log("🔍 Next.js API Debug (POST):");
    console.log("Calling backend:", `${API_URL}/api/activity`);
    console.log("Request body:", { type, name, description, duration });

    const response = await fetch(`${API_URL}/api/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ type, name, description, duration }),
    });

    console.log("Backend POST response status:", response.status);

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let errorMessage = "Failed to log activity";

      if (contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        const textError = await response.text();
        console.error("Non-JSON error from backend:", textError);
        errorMessage = "Backend returned non-JSON error";
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    console.log("Successfully logged activity:", data);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}