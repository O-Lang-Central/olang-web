// src/app/api/ping/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // No API key check needed here. This is just for uptime monitors.
  return NextResponse.json(
    { 
      status: "ok", 
      message: "O-Lang GRaaS Platform is awake and running",
      timestamp: new Date().toISOString()
    }, 
    { status: 200 }
  );
}