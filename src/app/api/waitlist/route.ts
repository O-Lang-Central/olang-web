// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// ── Config ─────────────────────────────────────────────────────────────────
// Set these in your .env.local:
//
//   SMTP_HOST=smtp.gmail.com          # or your provider
//   SMTP_PORT=465
//   SMTP_SECURE=true                  # true for 465, false for 587
//   SMTP_USER=you@yourdomain.com
//   SMTP_PASS=your-app-password
//   NOTIFY_TO=team@olang.cloud        # where signups land
//   NOTIFY_FROM="O-Lang <no-reply@olang.cloud>"
// ───────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body?.email ?? "").trim().toLowerCase();

    // Basic server-side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // 1. Notify your team
    await transporter.sendMail({
      from: process.env.NOTIFY_FROM ?? `"O-Lang" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_TO ?? process.env.SMTP_USER,
      subject: `New waitlist signup: ${email}`,
      text: `A new user joined the O-Lang waitlist.\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
      html: `
        <div style="font-family:monospace;background:#050c18;color:#e2e8f0;padding:32px;border-radius:12px;max-width:480px">
          <p style="color:#60a5fa;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px">
            New Waitlist Signup
          </p>
          <p style="font-size:18px;font-weight:700;margin:0 0 8px;color:#fff">${email}</p>
          <p style="font-size:12px;color:#64748b;margin:0">${new Date().toUTCString()}</p>
        </div>
      `,
    });

    // 2. Confirmation to the subscriber
    await transporter.sendMail({
      from: process.env.NOTIFY_FROM ?? `"O-Lang" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "You're on the O-Lang list",
      text: [
        "Hey,",
        "",
        "You're in. We'll reach out when we ship new resolvers, compliance frameworks,",
        "deployment guides, AI training updates, and developer onboarding tutorials.",
        "",
        "No spam — just signal.",
        "",
        "— The O-Lang team",
        "https://olang.cloud",
      ].join("\n"),
      html: `
        <div style="font-family:monospace;background:#050c18;color:#e2e8f0;padding:40px;border-radius:12px;max-width:520px">
          <p style="color:#60a5fa;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px">
            O-Lang · Early Access
          </p>
          <h1 style="font-size:24px;font-weight:800;color:#fff;margin:0 0 16px;letter-spacing:-0.5px">
            You're on the list.
          </h1>
          <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px">
            We'll reach out when we ship new resolvers, compliance frameworks,
            deployment guides, AI training updates, and developer onboarding tutorials.
            <br/><br/>
            No spam — just signal.
          </p>
          <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-top:8px">
            <a href="https://olang.cloud" style="color:#60a5fa;font-size:12px;text-decoration:none">
              olang.cloud ↗
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[waitlist] email error:", err);
    return NextResponse.json(
      { error: "Failed to send. Please try again later." },
      { status: 500 }
    );
  }
}