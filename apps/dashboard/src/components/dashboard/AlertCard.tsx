import { cn } from "@/lib/utils";
import { AlertTriangle, Info, XCircle } from "lucide-react";

interface AlertCardProps {
  title: string;
  description: string;
  status: "normal" | "atencao" | "critico";
  indicator?: string;
  value?: string;
}

export function AlertCard({ title, description, status, indicator, value }: AlertCardProps) {
  const config = {
    normal: { icon: Info, bg: "bg-gov-green/10", border: "border-gov-green/30", iconColor: "text-gov-green" },
    atencao: { icon: AlertTriangle, bg: "bg-gov-amber/10", border: "border-gov-amber/30", iconColor: "text-gov-amber" },
    critico: { icon: XCircle, bg: "bg-gov-red/10", border: "border-gov-red/30", iconColor: "text-gov-red" },
  };

  const { icon: Icon, bg, border, iconColor } = config[status];

  return (
    <div className={cn("rounded-lg p-4 border", bg, border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            {value && (
              <span className={cn("text-sm font-bold", iconColor)}>{value}</span>
            )}
          </div>
          {indicator && (
            <p className="text-xs text-muted-foreground mt-0.5">{indicator}</p>
          )}
          <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
