import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  Radio,
  Target,
  PieChart,
  Monitor,
  BookOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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

const mainItems = [
  { title: "Painel Executivo", url: "/", icon: LayoutDashboard },
  { title: "Alertas e Riscos", url: "/alertas", icon: AlertTriangle },
  { title: "Tendências Financeiras", url: "/tendencias", icon: TrendingUp },
  { title: "Sala de Situação", url: "/sala-situacao", icon: Radio },
];

const analyticsItems = [
  { title: "Indicadores Estratégicos", url: "/indicadores", icon: Target },
  { title: "Execução Orçamentária", url: "/execucao", icon: PieChart },
  { title: "Governança Digital", url: "/governanca-digital", icon: Monitor },
  { title: "Metodologia", url: "/metodologia", icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gov-gradient-header flex items-center justify-center">
              <span className="text-sm font-bold text-sidebar-primary-foreground">BG</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sidebar-accent-foreground leading-tight">Boituva</h2>
              <p className="text-xs text-sidebar-foreground/60">Governança</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg gov-gradient-header flex items-center justify-center mx-auto">
            <span className="text-sm font-bold text-sidebar-primary-foreground">B</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest">
            Visão Geral
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-widest">
            Análises
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
