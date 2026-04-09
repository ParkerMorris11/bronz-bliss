import { LayoutDashboard, CalendarDays, Users, Sparkles, Package, Settings, ClipboardCheck, BarChart3, Boxes, Gift, ListChecks, MessageSquare, Tag } from "lucide-react";
import { useHashLocation } from "wouter/use-hash-location";
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Services", url: "/services", icon: Sparkles },
  { title: "Packages", url: "/packages", icon: Package },
];

const manageItems = [
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Intake & Waivers", url: "/intake", icon: ClipboardCheck },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "Gift Cards", url: "/gift-cards", icon: Gift },
  { title: "Promo Codes", url: "/promo-codes", icon: Tag },
  { title: "Waitlist", url: "/waitlist", icon: ListChecks },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function isActive(location: string, url: string) {
  if (url === "/") return location === "/";
  return location === url || location.startsWith(url + "/");
}

export function AppSidebar() {
  const [location, navigate] = useHashLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const go = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Bronz Bliss
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    data-active={isActive(location, item.url)}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => go(item.url)}
                    className="cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    data-active={isActive(location, item.url)}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => go(item.url)}
                    className="cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Cedar City, UT</p>
      </SidebarFooter>
    </Sidebar>
  );
}
