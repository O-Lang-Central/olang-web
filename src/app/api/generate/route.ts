import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { ok: false, error_code: "MISSING_DESCRIPTION", message: "Description is required" },
        { status: 400 }
      );
    }

    // Forward the request to your local backend server
    const response = await fetch("http://localhost:3100/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (err) {
    console.error("[generate] proxy error:", err);
    return NextResponse.json(
      { ok: false, error_code: "PROXY_ERROR", message: "Backend server unreachable. Is it running on port 3100?" },
      { status: 503 }
    );
  }
}