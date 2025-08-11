// app/api/chat/sessions/route.ts
import {NextRequest, NextResponse} from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json(
                {error: "Authorization header is required"},
                {status: 401}
            );
        }

        const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
        });

        console.log("Backend response status:", response.status);
        console.log("Backend response content-type:", response.headers.get('content-type'));

        if (!response.ok) {
            // Handle non-JSON error responses
            const contentType = response.headers.get('content-type');
            let errorMessage = `HTTP ${response.status}`;
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    console.error("Failed to parse error JSON:", e);
                }
            } else {
                // Backend returned HTML/text, likely a 404
                const text = await response.text();
                console.error("Backend returned non-JSON:", text.substring(0, 200));
                errorMessage = "Backend endpoint not found";
            }
            
            return NextResponse.json(
                {error: errorMessage},
                {status: response.status}
            );
        }

        const data = await response.json();
        console.log("Chat sessions fetched successfully:", data);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error fetching chat sessions:", error);
        return NextResponse.json(
            {error: "Failed to fetch chat sessions"},
            {status: 500}
        );
    }
}

// Your existing POST handler stays the same
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json(
                {error: "Authorization header is required"},
                {status: 401}
            );
        }

        // Get request body if needed
        const body = await req.json().catch(() => ({}));

        const response = await fetch(`${BACKEND_API_URL}/chat/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify(body), // Include request body
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorMessage = `HTTP ${response.status}`;
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    console.error("Failed to parse error JSON:", e);
                }
            } else {
                const text = await response.text();
                console.error("Backend returned non-JSON:", text.substring(0, 200));
                errorMessage = "Failed to create chat session";
            }
            
            return NextResponse.json(
                {error: errorMessage},
                {status: response.status}
            );
        }

        const data = await response.json();
        console.log("Chat session created:", data);
        return NextResponse.json(data); // MAKE SURE THIS RETURN IS HERE

    } catch (error) {
        console.error("Error creating chat session:", error);
        return NextResponse.json( // MAKE SURE THIS RETURN IS HERE
            {error: "Failed to create chat session"},
            {status: 500}
        );
    }
}