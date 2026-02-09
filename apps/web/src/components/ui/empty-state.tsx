"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileText,
  Shield,
  Upload,
  Plug,
  Download,
  Search,
  Bell,
  Activity,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function EmptyEvidence({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Upload}
      title="No evidence collected yet"
      description="Upload your first piece of evidence or connect an integration to automatically collect compliance artifacts."
      action={onUpload ? { label: "Upload Evidence", onClick: onUpload } : undefined}
    />
  );
}

export function EmptyControls() {
  return (
    <EmptyState
      icon={Shield}
      title="No controls found"
      description="Try adjusting your search or filter criteria to find the controls you're looking for."
    />
  );
}

export function EmptyIntegrations({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      icon={Plug}
      title="No integrations connected"
      description="Connect GitHub, AWS, or other tools to automatically collect compliance evidence."
      action={onConnect ? { label: "Browse Integrations", onClick: onConnect } : undefined}
    />
  );
}

export function EmptyExports({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <EmptyState
      icon={Download}
      title="No exports generated"
      description="Generate an audit-ready export package containing your evidence organized by framework and control."
      action={onGenerate ? { label: "Generate Export", onClick: onGenerate } : undefined}
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        query
          ? `No items match "${query}". Try a different search term.`
          : "No items match your current filters."
      }
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="All caught up!"
      description="You have no new notifications. We'll let you know when something needs your attention."
      className="border-none bg-transparent p-6"
    />
  );
}

export function EmptyActivity() {
  return (
    <EmptyState
      icon={Activity}
      title="No recent activity"
      description="Activity from your team will appear here as evidence is uploaded and reviewed."
      className="border-none bg-transparent p-6"
    />
  );
}