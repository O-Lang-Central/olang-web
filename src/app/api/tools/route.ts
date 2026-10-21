import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:3100/tools", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (err) {
    console.error("[tools] proxy error:", err);
    return NextResponse.json(
      { ok: false, error_code: "PROXY_ERROR", message: "Backend server unreachable" },
      { status: 503 }
    );
  }
}