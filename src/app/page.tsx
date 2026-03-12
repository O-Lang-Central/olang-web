import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip, HowItWorksSection, FeaturesSection, AfricanLanguageSection, EcosystemSection, DomainsSection, DocsTeaserSection, CtaSection } from "@/components/home/Sections";
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
      <AfricanLanguageSection />
      <PlaygroundPreview />
      <EcosystemSection />
      <RegistryPreview />
      <DomainsSection />
      <DocsTeaserSection />
      <CtaSection />
      <ScrollReveal />
    </>
  );
}