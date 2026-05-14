import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip, HowItWorksSection, FeaturesSection, AfricanLanguageSection, EcosystemSection, DomainsSection, DocsTeaserSection, CtaSection } from "@/components/home/Sections";
import { RegistryPreview } from "@/components/home/RegistryPreview";
import { PlaygroundPreview } from "@/components/home/PlaygroundPreview";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { ApplicationsSection } from "@/components/home/ApplicationSection";
import { ComparisonSection } from "@/components/home/Comparisonsection";
import { CommunitySection } from "@/components/home/Communitysection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ComparisonSection/>
      <ApplicationsSection/>
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
      <CommunitySection />
      <ScrollReveal />
    </>
  );
}