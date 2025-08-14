import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Home,
  Database,
  Search,
  HardDrive,
  Shield,
  Network,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DataSpaceSidebarProps {
  onLogout: () => void;
}

export default function DataSpaceSidebar({ onLogout }: DataSpaceSidebarProps) {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const [dataSpacesOpen, setDataSpacesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = !open;

  // Mock data spaces for the collapsible menu
  const userDataSpaces = [
    { id: '1', name: 'glue space', count: 12 },
    { id: '2', name: 'product data', count: 8 },
    { id: '3', name: 'sustainability metrics', count: 24 },
  ];

  const navigationItems = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Hub Data Assets', url: '/hub-assets', icon: HardDrive },
    { title: 'Policies', url: '/policies', icon: Shield },
    { title: 'Connections', url: '/connections', icon: Network },
  ];

  return (
    <Sidebar className={isCollapsed ? 'w-16' : 'w-72'} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">Data Spaces</h2>
              <p className="text-xs text-sidebar-foreground/70">Hub Dashboard</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.url)
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Data Spaces Section */}
        <SidebarGroup>
          <Collapsible open={dataSpacesOpen} onOpenChange={setDataSpacesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5" />
                  {!isCollapsed && <span>Data Spaces</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {userDataSpaces.length}
                    </Badge>
                    {dataSpacesOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            
            {!isCollapsed && (
              <CollapsibleContent className="space-y-1 mt-2">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {userDataSpaces.map((space) => (
                      <SidebarMenuItem key={space.id}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={`/dataspaces/${space.id}`}
                            className={`flex items-center justify-between px-6 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isActive(`/dataspaces/${space.id}`)
                                ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-primary'
                            }`}
                          >
                            <span className="truncate">{space.name}</span>
                            <Badge variant="outline" className="text-xs bg-sidebar-accent/50">
                              {space.count}
                            </Badge>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            )}
          </Collapsible>
        </SidebarGroup>

        {/* Explore All Data Spaces */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">
            Explore
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {!isCollapsed && (
              <div className="px-3 py-2 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
                  <Input
                    placeholder="Search data spaces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-sidebar-accent/30 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
                  />
                </div>
                <Link to="/explore">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start bg-sidebar-accent/20 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Explore All Data Spaces
                  </Button>
                </Link>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="space-y-2">
            <Link to="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}