import {
  LayoutDashboard,
  BarChart3,
  Target,
  Building2,
  Waypoints,
  Globe,
  Landmark,
  Vote,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    label: "Principal",
    items: [{ title: "Visão Geral", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Finanças & Desempenho",
    items: [
      { title: "Execução Financeira", url: "/execucao", icon: BarChart3 },
      { title: "Índice IEGM", url: "/painel/iegm-scorecard", icon: Target },
      { title: "Comparativo Regional", url: "/comparativo-regional", icon: Waypoints },
    ],
  },
  {
    label: "Fontes Oficiais",
    items: [
      { title: "População (IBGE)", url: "/ibge-municipio", icon: Globe },
      { title: "Eleitorado (TSE)", url: "/operacional/eleitorado", icon: Vote },
      { title: "Contratos (PNCP)", url: "/operacional/contratos", icon: Building2 },
      { title: "Contabilidade (Siconfi)", url: "/operacional/fiscal", icon: Landmark },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-sm">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Bras%C3%A3o_de_Boituva_-_SP.svg"
              alt="Brasão de Boituva"
              className="h-full w-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col">
              <h2 className="truncate text-xs font-bold uppercase tracking-tight text-sidebar-accent-foreground">
                Boituva Digital
              </h2>
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/50">
                Prefeitura Municipal
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/35">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r before:bg-sidebar-primary"
                      >
                        <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
