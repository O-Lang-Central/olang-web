import type { Metadata } from "next";
import { PlaygroundClient } from "@/components/playground/playgroundClient";

export const metadata: Metadata = {
  title: "Playground — O-Lang",
  description: "Write and run governed .ol workflows in your browser, connected to the O-Lang cloud kernel.",
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
