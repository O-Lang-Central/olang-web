# O-Lang Web — Next.js 14 Homepage

The official O-Lang website: homepage, playground, resolver registry, and docs.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (custom design tokens)
- **Framer Motion** (animations)
- **Monaco Editor** (playground code editor)
- **Syne + DM Sans + DM Mono** (fonts)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set your kernel URL
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_KERNEL_URL to point at your Express server

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — but note port 3000 is likely already used by your kernel server. Next.js will auto-pick 3001 if so.

## Structure

```
src/
├── app/
│   ├── page.tsx              ← Homepage
│   ├── playground/page.tsx   ← Playground
│   ├── registry/page.tsx     ← Resolver registry
│   └── docs/page.tsx         ← Docs index
├── components/
│   ├── layout/               ← Navbar, Footer
│   ├── home/                 ← Hero, Sections, RegistryPreview, PlaygroundPreview
│   ├── playground/           ← Monaco editor + execution panel
│   ├── registry/             ← Full registry page
│   └── ui/                   ← Button, Badge, Card, SectionHeader
├── lib/
│   └── utils.ts              ← cn(), fakeHash(), RESOLVERS, DOMAIN_CONFIGS
└── types/
    └── index.ts              ← Shared TypeScript types
```

## Deploy to Vercel

```bash
npx vercel
```

Set `NEXT_PUBLIC_KERNEL_URL` to your deployed kernel URL (Railway/Render) in Vercel environment variables.
