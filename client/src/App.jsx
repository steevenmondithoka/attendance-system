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
import Register from './pages/Register';

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
// -------------------------------------------------------------------------------

// Sidebar height for mobile (60px)
const MOBILE_SIDEBAR_HEIGHT = 60; 

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
        // If viewing a class detail page, add a link back to the current class
        if (currentPath.startsWith('/class/')) {
             // The href is a placeholder, the Link component uses location.pathname
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
const SidebarContent = ({ role, isMobileLayout }) => { 
    const location = useLocation();
    const config = sidebarConfig(role, location.pathname);

    // Combine all items into a single flat array for horizontal view
    const allItems = config.flatMap(section => section.items);
    
    // Determine which items and layout to use
    const itemsToRender = isMobileLayout ? allItems : config;

    // Common function to render a single link item
    const renderLinkItem = (item) => {
        let isActive = location.pathname === item.href;
        
        // Custom logic for highlighting the 'Current Class' link
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
                    // Icon-only styling
                    "justify-center h-10 w-10 p-0",
                    isMobileLayout ? "text-lg" : "text-base" // Optional: Adjust icon size slightly for mobile
                )}
            >
                <item.icon className={isMobileLayout ? "h-6 w-6" : "h-5 w-5"} />
            </Link>
        );
        
        // All links are wrapped with Tooltip for labels (accessible on hover/long press)
        return (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>{LinkComponent}</TooltipTrigger>
                <TooltipContent side={isMobileLayout ? "top" : "right"}>{item.label}</TooltipContent>
            </Tooltip>
        );
    };

    // Mobile Layout (Bottom Bar)
    if (isMobileLayout) {
        return (
            <div className="flex justify-around items-center w-full h-full">
                <TooltipProvider delayDuration={0}>
                    {itemsToRender.map(renderLinkItem)}
                </TooltipProvider>
            </div>
        );
    }
    
    // Desktop Layout (Vertical Sidebar)
    return (
        <ScrollArea className="h-full py-6 px-2">
            <div className="space-y-4">
                <TooltipProvider delayDuration={0}>
                {itemsToRender.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="pb-4">
                        <div className="space-y-1">
                            {section.items.map(renderLinkItem)}
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
    const bottomPaddingForMobile = MOBILE_SIDEBAR_HEIGHT + 16; // Sidebar height + p-4 default padding (16px)

    return (
        // The main content wrapper below the Navbar
        <div className="min-h-[calc(100vh-64px)] pt-0 md:pt-4 flex flex-row relative"> 
            
            {/* --- MOBILE SIDEBAR (Fixed Bottom Navigation) --- */}
            <aside 
                className="fixed bottom-0 left-0 w-full h-[60px] z-50 bg-card border-t md:hidden"
            >
                <SidebarContent role={role} isMobileLayout={true} /> 
            </aside>
            
            {/* --- DESKTOP SIDEBAR (Sticky Left) --- */}
            <aside 
                className="hidden md:block w-[60px] shrink-0 border-r bg-card h-[calc(100vh-64px)] sticky top-4 overflow-y-auto"
            >
                <SidebarContent role={role} isMobileLayout={false} /> 
            </aside>
            
            {/* 
                Content Area: 
                Mobile: Add bottom padding (pb-[76px]) to prevent content from being hidden 
                by the fixed bottom sidebar.
            */}
            <main className={`flex-1 overflow-y-auto p-4 md:p-8 pb-[${bottomPaddingForMobile}px] md:pb-8`}>
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