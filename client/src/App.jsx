import React from 'react'; 
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
// Icons needed for the sidebar
import { 
    LayoutDashboard, Users, BookOpen, Settings,
} from 'lucide-react'; 

// Page Imports
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ClassDetails from './pages/ClassDetails';
import Home from './pages/Home';
import ProfileSettings from './pages/ProfileSettings';

// Component Imports
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Auth and Utils
import { AuthProvider, useAuth } from './hooks/useAuth'; 
import './index.css'

// --- SHADCN/UTILITY IMPORTS ---
import { buttonVariants } from './components/ui/button'; 
import { ScrollArea } from './components/ui/scroll-area';
// Tooltip is ESSENTIAL for the icon-only view
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip'; 
import { cn } from '@/lib/utils';
import Register from './pages/Register';
// -------------------------------------------------------------------------------


// =======================================================================
// 1. Sidebar Logic & Component (Unified Icon-Only Style)
// =======================================================================

// Define sidebar items based on user role
const sidebarConfig = (role, currentPath) => {
    // Shared items for all users
    const baseItems = [
        { href: "/profile-settings", icon: Settings, label: "Profile Settings" }
    ];

    if (role === 'teacher') {
        const teacherItems = [
            { href: "/teacher-dashboard", icon: LayoutDashboard, label: "Dashboard" },
        ];
        // If viewing a class detail page, highlight the dashboard link
        if (currentPath.startsWith('/class/')) {
             teacherItems.push({ href: '/class-detail', icon: BookOpen, label: 'Current Class' });
        }
        return [
            { title: "Teacher Tools", items: teacherItems},
            { title: "Account", items: baseItems }
        ];
    } else if (role === 'student') {
        return [
            { title: "Navigation", items: [
                { href: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
            ]},
            { title: "Account", items: baseItems }
        ];
    } else if (role === 'admin') {
        return [
            { title: "Administration", items: [
                { href: "/admin-dashboard", icon: LayoutDashboard, label: "Admin Dashboard" },
                { href: "/manage-users", icon: Users, label: "Manage Users" },
            ]},
            { title: "Account", items: baseItems }
        ];
    }
    return [{ title: "General", items: baseItems }];
};


// Component that renders the sidebar content.
const SidebarContent = ({ role }) => { 
    const location = useLocation();
    const config = sidebarConfig(role, location.pathname);

    return (
        <ScrollArea className="h-full py-6 px-2"> {/* Thin padding for icon view */}
            <div className="space-y-4">
                <TooltipProvider delayDuration={0}>
                {config.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="pb-4">
                        {/* Section titles are now hidden in the icon-only view */}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                let isActive = location.pathname === item.href;
                                
                                if (location.pathname.startsWith('/class/') && item.href === '/class-detail') {
                                    isActive = true;
                                }

                                const LinkComponent = (
                                    <Link
                                        key={item.href}
                                        to={item.href === '/class-detail' ? location.pathname : item.href}
                                        className={cn(
                                            buttonVariants({ 
                                                variant: isActive ? "secondary" : "ghost" 
                                            }),
                                            // Icon-only styling for all screens
                                            "justify-center h-10 w-10 p-0" 
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                    </Link>
                                );
                                
                                // All links are wrapped with Tooltip for labels (accessible on hover/long press)
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>{LinkComponent}</TooltipTrigger>
                                        <TooltipContent side="right">{item.label}</TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                ))}
                </TooltipProvider>
            </div>
        </ScrollArea>
    );
};


// =======================================================================
// 2. Layout Component (Icon-Only Unified Layout)
// =======================================================================

const LayoutWithSidebar = ({ children }) => {
    const { user, loading } = useAuth(); 
    
    if (loading) {
        return <div className="p-8">Loading...</div>; 
    }

    const role = user?.role || 'student'; 

    return (
        <div className="flex min-h-[calc(100vh-64px)] pt-0 md:pt-4"> 
            
            {/* Unified Sidebar: Always visible, fixed icon width (w-[60px]) on ALL screen sizes */}
            <aside 
                className="w-[60px] shrink-0 border-r bg-card h-[calc(100vh-64px)] sticky top-0 md:top-4 overflow-y-auto"
            >
                <SidebarContent role={role} /> 
            </aside>
            
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
};


// =======================================================================
// 3. Main App Component
// =======================================================================

function App() {
    return (
        <AuthProvider>
            <div className="bg-background min-h-screen">
                <Navbar /> 
                
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} /> 
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register/>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} /> 
                    <Route path="/reset-password/:token" element={<ResetPassword />} /> 

                    {/* Protected/Dashboard Routes - WRAPPED with LayoutWithSidebar */}
                    <Route
                        path="/profile-settings"
                        element={
                            <ProtectedRoute>
                                <LayoutWithSidebar> 
                                    <ProfileSettings />
                                </LayoutWithSidebar>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/teacher-dashboard"
                        element={
                            <ProtectedRoute role="teacher">
                                <LayoutWithSidebar> 
                                    <TeacherDashboard />
                                </LayoutWithSidebar>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute role="admin">
                                <LayoutWithSidebar> 
                                    <AdminDashboard />
                                </LayoutWithSidebar>
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/class/:id"
                        element={
                            <ProtectedRoute role="teacher">
                                <LayoutWithSidebar> 
                                    <ClassDetails />
                                </LayoutWithSidebar>
                            </ProtectedRoute>
                        }
                    />
                    
                    <Route
                        path="/student-dashboard"
                        element={
                            <ProtectedRoute role="student">
                                <LayoutWithSidebar> 
                                    <StudentDashboard />
                                </LayoutWithSidebar>
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
                
            </div>
        </AuthProvider>
    );
}

export default App;