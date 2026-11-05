import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  trendPositive?: boolean;
  status?: "normal" | "atencao" | "critico";
  sparklineData?: { value: number }[];
}

const statusColors = {
  normal: "hsl(var(--gov-green))",
  atencao: "hsl(var(--gov-amber))",
  critico: "hsl(var(--gov-red))",
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  trendPositive = true,
  status,
  sparklineData,
}: KpiCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "stable"
      ? "text-muted-foreground"
      : trendPositive
        ? "text-emerald-600"
        : "text-rose-600";

  return (
    <div
      className={cn(
        "group relative flex min-h-[120px] flex-col rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm transition-shadow duration-200 hover:shadow-md md:p-5",
        status && "border-t-2"
      )}
      style={status ? { borderTopColor: statusColors[status] } : undefined}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <p className="truncate text-xl font-bold tracking-tight text-foreground md:text-2xl">{value}</p>
        </div>
        {trend && trendValue && trendValue !== "-" && (
          <div className={cn("flex shrink-0 items-center gap-1 text-[10px] font-bold", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        {subtitle && (
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{subtitle}</p>
        )}
        {sparklineData && sparklineData.length > 1 && (
          <div className="h-8 w-16 shrink-0 opacity-80 md:w-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={trendPositive ? "hsl(var(--gov-green))" : "hsl(var(--gov-red))"}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
