import { NextRequest, NextResponse } from "next/server"
export async function POST(request: NextRequest) {
    const body = await request.json();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
        const text = await res.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            data = { message: "Invalid JSON from backend" };
        }
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json(
            { message: "Server error", error },
            { status: 500 }
        );
    }

}
