// src/app/playground/page.tsx
import { Suspense } from 'react';
import { PlaygroundClient } from "@/components/playground/PlaygroundClient"; // Ensure casing matches your file

export const metadata = {
  title: "Playground — O-Lang",
  description: "Write and run governed .ol workflows in your browser.",
};

export default function PlaygroundPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#070d1a] text-white">
        Loading Playground...
      </div>
    }>
      <PlaygroundClient />
    </Suspense>
  );
}


// import type { Metadata } from "next";
// import { PlaygroundClient } from "@/components/playground/PlaygroundClient";

// export const metadata: Metadata = {
//   title: "Playground — O-Lang",
//   description: "Write and run governed .ol workflows in your browser, connected to the O-Lang cloud kernel.",
// };

// export default function PlaygroundPage() {
//   return <PlaygroundClient />;
// }
