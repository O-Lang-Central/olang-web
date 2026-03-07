import type { Metadata } from "next";
import { RegistryPage } from "@/components/registry/RegistryPage";

export const metadata: Metadata = {
  title: "Resolver Registry — O-Lang",
  description: "Browse, search and publish governed resolvers for O-Lang workflows.",
};

export default function Page() {
  return <RegistryPage />;
}
