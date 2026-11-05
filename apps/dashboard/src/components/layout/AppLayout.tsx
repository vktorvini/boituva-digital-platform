import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "./AppSidebar";
import { GlobalFilters } from "./GlobalFilters";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";
import { getRouteTitle } from "@/lib/routes";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  const { periodLabel } = useExecutiveDashboard();
  const pageTitle = getRouteTitle(pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 shrink-0 border-b border-border/40 bg-background/90 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between gap-3 px-4 md:h-16 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <div className="hidden h-4 w-px bg-border sm:block" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold tracking-tight text-foreground md:text-base">
                      {pageTitle}
                    </span>
                    <Badge
                      variant="outline"
                      className="hidden h-5 shrink-0 border-primary/20 bg-primary/5 px-2 py-0 text-[10px] uppercase tracking-wider text-primary sm:inline-flex"
                    >
                      MVP
                    </Badge>
                  </div>
                  <p className="hidden text-[11px] text-muted-foreground sm:block">{periodLabel}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 md:gap-5">
                <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 md:flex">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]" />
                  Online
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                  <span className="text-[10px] font-bold text-primary">PM</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/30 bg-muted/20 px-4 py-3 md:px-6">
              <GlobalFilters />
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
            <div className="page-enter mx-auto max-w-[1400px] space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
