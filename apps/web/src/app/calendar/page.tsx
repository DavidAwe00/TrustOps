"use client";

import { useState, useMemo } from "react";
import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Clock, AlertCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceCalendar, CalendarEvent } from "@/components/compliance-calendar";

// Demo events - in production, fetch from API
const demoEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "SOC 2 Annual Audit",
    date: "2025-01-15",
    type: "audit",
    description: "Annual SOC 2 Type II audit with external auditor",
  },
  {
    id: "2",
    title: "Access Control Review",
    date: "2025-01-08",
    type: "review",
    description: "Quarterly review of access control policies",
  },
  {
    id: "3",
    title: "Security Training Due",
    date: "2025-01-20",
    type: "deadline",
    description: "Annual security awareness training deadline",
  },
  {
    id: "4",
    title: "Penetration Test",
    date: "2025-02-01",
    type: "audit",
    description: "Annual penetration testing engagement",
  },
  {
    id: "5",
    title: "AWS Config Backup Policy",
    date: "2025-01-02",
    type: "evidence-expiry",
    description: "Evidence expires - needs renewal",
  },
  {
    id: "6",
    title: "Security Training Certificates",
    date: "2025-01-09",
    type: "evidence-expiry",
    description: "Employee training certificates expire",
  },
  {
    id: "7",
    title: "Vendor Risk Assessment",
    date: "2025-01-16",
    type: "evidence-expiry",
    description: "Annual vendor assessment needs renewal",
  },
  {
    id: "8",
    title: "Q1 Control Review",
    date: "2025-01-31",
    type: "review",
    description: "Quarterly control effectiveness review",
  },
  {
    id: "9",
    title: "ISO 27001 Surveillance",
    date: "2025-02-15",
    type: "audit",
    description: "ISO 27001 surveillance audit",
  },
  {
    id: "10",
    title: "DR Test",
    date: "2025-02-28",
    type: "deadline",
    description: "Annual disaster recovery test",
  },
];

// Demo expiring evidence
const expiringEvidence = [
  {
    id: "ev-1",
    title: "AWS Config Backup Policy",
    daysUntilExpiry: 7,
    severity: "high" as const,
  },
  {
    id: "ev-2",
    title: "Security Training Certificates",
    daysUntilExpiry: 14,
    severity: "medium" as const,
  },
  {
    id: "ev-3",
    title: "Vendor Risk Assessment",
    daysUntilExpiry: 21,
    severity: "low" as const,
  },
];

function getExpiryColor(severity: "high" | "medium" | "low") {
  switch (severity) {
    case "high":
      return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";
    case "medium":
      return "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950";
    case "low":
      return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950";
  }
}

function getExpiryIconColor(severity: "high" | "medium" | "low") {
  switch (severity) {
    case "high":
      return "text-red-600";
    case "medium":
      return "text-orange-600";
    case "low":
      return "text-yellow-600";
  }
}

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return demoEvents
      .filter((event) => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, []);

  return (
    <DashboardShell>
      <PageHeader
        title="Compliance Calendar"
        description="Track audits, reviews, and compliance deadlines"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </PageHeader>
      <PageContent>
        <div className="space-y-6">
          {/* Main Calendar */}
          <ComplianceCalendar
            events={demoEvents}
            onEventClick={setSelectedEvent}
          />

          {/* Bottom Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upcoming Events</h2>
                <Badge variant="secondary">{upcomingEvents.length}</Badge>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[50px] text-center">
                      <span className="text-2xl font-bold">
                        {new Date(event.date).getDate()}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{event.title}</h3>
                        <Badge
                          variant="secondary"
                          className={
                            event.type === "audit"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : event.type === "review"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                              : event.type === "deadline"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {event.type.replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Evidence Expiring Soon */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Evidence Expiring Soon</h2>
              </div>
              <div className="space-y-3">
                {expiringEvidence.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${getExpiryColor(
                      item.severity
                    )}`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 ${getExpiryIconColor(item.severity)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires in {item.daysUntilExpiry} days
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Renew
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Event Detail Modal could be added here */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
            <Card className="p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
                  <p className="text-muted-foreground">
                    {new Date(selectedEvent.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    selectedEvent.type === "audit"
                      ? "bg-blue-100 text-blue-800"
                      : selectedEvent.type === "review"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedEvent.type === "deadline"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {selectedEvent.type.replace("-", " ")}
                </Badge>
              </div>
              {selectedEvent.description && (
                <p className="text-muted-foreground mb-4">{selectedEvent.description}</p>
              )}
              <div className="flex gap-2">
                <Button className="flex-1">View Details</Button>
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContent>
    </DashboardShell>
  );
}
