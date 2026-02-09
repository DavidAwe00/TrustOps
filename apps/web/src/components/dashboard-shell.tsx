"use client";

import { AppSidebar } from "./app-sidebar";
import { NotificationsPopover } from "./notifications-popover";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className={cn(
          "ml-64 min-h-screen transition-all duration-300",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showNotifications?: boolean;
}

export function PageHeader({ title, description, children, showNotifications = true }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {showNotifications && <NotificationsPopover />}
        </div>
      </div>
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("p-8", className)}>
      {children}
    </div>
  );
}

