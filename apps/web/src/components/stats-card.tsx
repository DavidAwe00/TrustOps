"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter, AnimatedPercentage } from "@/components/animated-counter";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
  animated?: boolean;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  animated = true,
}: StatsCardProps) {
  const variantStyles = {
    default: {
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    success: {
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    warning: {
      iconBg: "bg-warning/10",
      iconColor: "text-warning-foreground",
    },
    danger: {
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
  };

  const styles = variantStyles[variant];

  // Parse value for animation
  const renderValue = () => {
    if (!animated) {
      return <span>{value}</span>;
    }

    // Check if it's a percentage string (e.g., "75%")
    if (typeof value === "string" && value.endsWith("%")) {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        return <AnimatedPercentage value={numValue} duration={1200} />;
      }
    }

    // Check if it's a pure number
    if (typeof value === "number") {
      return <AnimatedCounter value={value} duration={1200} />;
    }

    // Default: render as-is
    return <span>{value}</span>;
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{renderValue()}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-sm font-medium",
                  trend.value >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              styles.iconBg
            )}
          >
            <Icon className={cn("h-6 w-6", styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

