import type { Metadata } from "next";
import SyntaxPage from "@/components/syntax/SyntaxPage";

export const metadata: Metadata = {
  title: "O-Lang Syntax — Language Reference",
  description: "Complete O-Lang syntax reference. Verified against the kernel parser and runtime.",
};

export default function Page() {
  return <SyntaxPage />;
}