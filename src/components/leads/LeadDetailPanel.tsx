import { LeadInfoCard } from "./LeadInfoCard";
import { ConversationSection } from "./ConversationSection";
import type { LeadWithSession } from "@/types";

interface LeadDetailPanelProps {
  lead: LeadWithSession;
  autoReleaseHours: number;
  onEscalate: () => void;
  onRelease: () => void;
  onProlong: () => void;
  isLoading?: boolean;
}

export function LeadDetailPanel({
  lead,
  autoReleaseHours,
  onEscalate,
  onRelease,
  onProlong,
  isLoading,
}: LeadDetailPanelProps) {
  return (
    <div className="space-y-4">
      <LeadInfoCard lead={lead} />
      <ConversationSection
        session={lead.session}
        autoReleaseHours={autoReleaseHours}
        onEscalate={onEscalate}
        onRelease={onRelease}
        onProlong={onProlong}
        isLoading={isLoading}
      />
    </div>
  );
}
