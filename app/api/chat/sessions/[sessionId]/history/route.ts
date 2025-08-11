// app/api/chat/sessions/[sessionId]/history/route.ts
import {NextRequest, NextResponse} from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        console.log(`Getting chat history for session ${sessionId}`);
        
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json(
                {error: "Authorization header is required"},
                {status: 401}
            );
        }

        // Fix: Use correct URL with 'sessions' (plural)
        const response = await fetch(
            `${BACKEND_API_URL}/chat/sessions/${sessionId}/history`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
            }
        );

        console.log("History response status:", response.status);

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
                errorMessage = "History endpoint not found";
            }
            
            return NextResponse.json(
                {error: errorMessage},
                {status: response.status}
            );
        }

        const data = await response.json();
        console.log("Chat history fetched:", data);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json(
            {error: "Failed to fetch chat history"},
            {status: 500}
        );
    }
}