"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { PlayerJourneyTimeline } from "@/components/ui/player-journey-timeline"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <PlayerJourneyTimeline />
    </TooltipProvider>
  )
}
