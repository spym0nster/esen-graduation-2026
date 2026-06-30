"use client";

import { useState } from "react";
import { IntroSequence } from "@/components/ui/IntroSequence";
import { HeroSection } from "@/components/sections/HeroSection";
import { CountdownSection } from "@/components/sections/CountdownSection";
import { ProgrammeSection } from "@/components/sections/ProgrammeSection";
import { MajorsSection } from "@/components/sections/MajorsSection";
import { ModeratorsSection } from "@/components/sections/ModeratorsSection";

import { GallerySection } from "@/components/sections/GallerySection";
import SeatingSection from "@/components/sections/SeatingSection";
import { RSVPSection } from "@/components/sections/RSVPSection";
import { CommitteeSection } from "@/components/sections/CommitteeSection";

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <main className="min-h-screen bg-[#0D0B0E]">
      <IntroSequence onComplete={() => setIntroComplete(true)} />
      <HeroSection introComplete={introComplete} />
      <CountdownSection />
      <ProgrammeSection />
<MajorsSection />
<ModeratorsSection />
<GallerySection />
<SeatingSection />
<RSVPSection />
<CommitteeSection />
    </main>
  );
}
