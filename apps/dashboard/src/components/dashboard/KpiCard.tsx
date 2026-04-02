import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  trendPositive?: boolean;
  status?: "normal" | "atencao" | "critico";
}

export function KpiCard({ title, value, subtitle, trend, trendValue, trendPositive = true, status }: KpiCardProps) {
  const statusStyles = {
    normal: "border-l-gov-green",
    atencao: "border-l-gov-amber",
    critico: "border-l-gov-red",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "stable"
      ? "text-muted-foreground"
      : trendPositive
        ? "text-gov-green"
        : "text-gov-red";

  return (
    <div
      className={cn(
        "bg-card rounded-lg p-5 gov-shadow-card border border-border",
        status && `border-l-4 ${statusStyles[status]}`
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-2xl font-semibold text-foreground tracking-tight">
        {value}
      </p>
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <span className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
