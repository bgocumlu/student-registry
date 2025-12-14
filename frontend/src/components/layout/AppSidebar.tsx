import {
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  UserCheck,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export function AppSidebar() {
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const { open } = useSidebar();

  const adminItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Students', url: '/students', icon: GraduationCap },
    { title: 'Teachers', url: '/teachers', icon: Users },
    { title: 'Courses', url: '/courses', icon: BookOpen },
    { title: 'Enrollments', url: '/enrollments', icon: UserCheck },
    { title: 'Grades', url: '/grades', icon: FileText },
    { title: 'Absences', url: '/absences', icon: Calendar },
  ];

  const teacherItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Courses', url: '/courses', icon: BookOpen },
    { title: 'Grades', url: '/grades', icon: FileText },
    { title: 'Absences', url: '/absences', icon: Calendar },
  ];

  const viewerItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Students', url: '/students', icon: GraduationCap },
    { title: 'Teachers', url: '/teachers', icon: Users },
    { title: 'Courses', url: '/courses', icon: BookOpen },
  ];

  const commonItems = [
    { title: 'Logs', url: '/logs', icon: FileText },
    { title: 'Settings', url: '/settings', icon: Settings },
  ];

  const getCommonItems = () => {
    // Hide logs for teachers
    if (isTeacher) {
      return [{ title: 'Settings', url: '/settings', icon: Settings }];
    }
    return commonItems;
  };

  const getNavigationItems = () => {
    if (isAdmin) return adminItems;
    if (isTeacher) return teacherItems;
    return viewerItems;
  };

  const navItems = getNavigationItems();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground font-semibold text-base px-3 py-4 overflow-hidden whitespace-nowrap">
            <span className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
              Student Registry
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {getCommonItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {open && user && (
              <div className="px-3 py-2 text-sm text-sidebar-foreground">
                <div className="font-medium">{user.username}</div>
                <div className="text-xs text-sidebar-foreground/60">
                  {user.role === 'ADMIN' ? 'Administrator' :
                   user.role === 'TEACHER' ? 'Teacher' :
                   user.role === 'VIEWER' ? 'Viewer' : 'User'}
                </div>
              </div>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="hover:bg-sidebar-accent">
              <LogOut className="h-4 w-4" />
              {open && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
