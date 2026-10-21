import { HeroSection } from "@/components/home/HeroSection";
import {
  StatsStrip,
  HowItWorksSection,
  FeaturesSection,
  AfricanLanguageSection,
  EcosystemSection,
  DomainsSection,
  DocsTeaserSection,
  CtaSection,
} from "@/components/home/Sections";
import { RegistryPreview } from "@/components/home/RegistryPreview";
import { PlaygroundPreview } from "@/components/home/PlaygroundPreview";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { ApplicationsSection } from "@/components/home/ApplicationSection";
import { ComparisonSection } from "@/components/home/Comparisonsection";
import { CommunitySection } from "@/components/home/Communitysection";
import { AgentDeveloperSection } from "@/components/home/AgentDeveloperSection";
export default function HomePage() {
  return (
    <>
      {/* 1. Hook — who you are and why it matters */}
      <HeroSection />

          <AgentDeveloperSection /> 

      {/* 2. Instant trust — social proof before any deep explanation */}
      <StatsStrip />

      {/* 3. Mechanism — how the kernel actually works */}
      <HowItWorksSection />

      {/* 4. Capabilities — what the runtime enforces */}
      <FeaturesSection />

      {/* 5. Real-world proof — use cases now make sense after the mechanism */}
      <ApplicationsSection />

      {/* 6. Global reach — African language support, a key differentiator */}
      <AfricanLanguageSection />

      {/* 7. Try it — playground after understanding, not before */}
      <PlaygroundPreview />

      {/* 8. vs alternatives — visitor now knows enough to appreciate the comparison */}
      <ComparisonSection />

      {/* 9. Ecosystem — tools, registry, integrations */}
      <EcosystemSection />
      <RegistryPreview />

      {/* 10. Domains — reinforces breadth before the final push */}
      <DomainsSection />

      {/* 11. Docs teaser — gives technical visitors an exit ramp */}
      <DocsTeaserSection />

      {/* 12. Final CTA — conversion moment after full context */}
      <CtaSection />

      {/* 13. Community — lower-commitment next step for those not ready to convert */}
      <CommunitySection />

      <ScrollReveal />
    </>
  );
}