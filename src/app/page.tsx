import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip, HowItWorksSection, FeaturesSection, DomainsSection, DocsTeaserSection, CtaSection } from "@/components/home/Sections";
import { RegistryPreview } from "@/components/home/RegistryPreview";
import { PlaygroundPreview } from "@/components/home/PlaygroundPreview";
import { ScrollReveal } from "@/components/home/ScrollReveal";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <HowItWorksSection />
      <FeaturesSection />
      <PlaygroundPreview />
      <RegistryPreview />
      <DomainsSection />
      <DocsTeaserSection />
      <CtaSection />
      <ScrollReveal />
    </>
  );
}
