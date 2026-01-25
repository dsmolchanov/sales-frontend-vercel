import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPhone } from "@/lib/utils";
import {
  User,
  Building,
  Phone,
  Calendar,
  Briefcase,
  Clock,
  FileText,
  Flame,
  Thermometer,
  Snowflake,
} from "lucide-react";
import type { LeadWithSession } from "@/types";
import type { QualificationScore, LeadStatus } from "@/types/salesConfig";

interface LeadInfoCardProps {
  lead: LeadWithSession;
}

export function LeadInfoCard({ lead }: LeadInfoCardProps) {
  const getScoreIcon = (score: QualificationScore) => {
    switch (score) {
      case "hot":
        return <Flame className="h-4 w-4" />;
      case "warm":
        return <Thermometer className="h-4 w-4" />;
      case "cold":
        return <Snowflake className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getScoreBadgeVariant = (score: QualificationScore) => {
    switch (score) {
      case "hot":
        return "hot" as const;
      case "warm":
        return "warm" as const;
      case "cold":
        return "cold" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "qualified":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "scheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "converted":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "lost":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "";
    }
  };

  const hasAdditionalInfo =
    lead.use_case ||
    lead.current_stack ||
    lead.expected_volume ||
    lead.timeline ||
    lead.notes;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              {lead.contact_name || "Unknown Contact"}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {formatPhone(lead.phone)}
              </span>
              {lead.company_name && (
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {lead.company_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={getScoreBadgeVariant(lead.qualification_score)}
              className="gap-1"
            >
              {getScoreIcon(lead.qualification_score)}
              {lead.qualification_score}
            </Badge>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(lead.status)}`}
            >
              {lead.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dates */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {formatDate(lead.created_at)}
          </span>
        </div>

        {/* Additional Info (collapsible feel - always shown if present) */}
        {hasAdditionalInfo && (
          <div className="border-t pt-4 space-y-3">
            {lead.use_case && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Use Case
                  </p>
                  <p className="text-sm">{lead.use_case}</p>
                </div>
              </div>
            )}

            {lead.current_stack && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Current Stack
                  </p>
                  <p className="text-sm">{lead.current_stack}</p>
                </div>
              </div>
            )}

            {lead.expected_volume && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Expected Volume
                  </p>
                  <p className="text-sm">{lead.expected_volume}</p>
                </div>
              </div>
            )}

            {lead.timeline && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Timeline
                  </p>
                  <p className="text-sm">{lead.timeline}</p>
                </div>
              </div>
            )}

            {lead.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
