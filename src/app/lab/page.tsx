import LabClient from "@/components/lab/LabClient";

export const metadata = {
  title: "Lab — O-Lang Sandbox",
  description: "Write and run raw .ol workflows in the O-Lang sandbox.",
};

export default function LabPage() {
  return <LabClient />;
}