import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function DataState({
  isLoading,
  isError,
  isEmpty,
  errorMessage = "Erro ao carregar dados. Tente novamente.",
  emptyMessage = "Nenhum dado disponível",
  emptyDescription = "Os dados ainda não foram carregados para este período.",
  children,
  className,
  compact = false,
}: DataStateProps) {
  const wrapperClass = cn(
    "flex flex-col items-center justify-center text-center",
    compact ? "py-8" : "py-16",
    className
  );

  if (isLoading) {
    return (
      <div className={wrapperClass}>
        <Loader2 className="h-8 w-8 text-muted-foreground/50 animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={wrapperClass}>
        <AlertCircle className="h-8 w-8 text-gov-red/60 mb-3" />
        <p className="text-sm font-medium text-foreground">Falha no carregamento</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{errorMessage}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={wrapperClass}>
        <Inbox className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{emptyDescription}</p>
      </div>
    );
  }

  return <>{children}</>;
}
