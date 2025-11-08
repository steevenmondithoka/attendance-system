import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// --- Component Imports ---
import { UserProfile } from './UserProfile'; // Still used for desktop view
import { DarkModeToggle } from './DarkModeToggle';

// --- Shadcn UI & Icon Imports ---
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For user avatar in sheet
import { Menu, LogOut } from "lucide-react";

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Determine the correct dashboard path based on user role
    const dashboardPath = isAuthenticated
        ? (user?.role === 'teacher' ? "/teacher-dashboard" : "/")
        : "/login";

    const navLinks = [
        { href: dashboardPath, label: "" },
        // Add more navigation links here
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">

                {/* --- PART 1: LEFT - Logo (Visible on all screen sizes) --- */}
                <Link to={isAuthenticated ? dashboardPath : "/"} className="flex items-center space-x-2">
                    <img src="https://rguktong.ac.in/img/rguktlogo.png" alt="Logo" className="h-8 w-8" />
                    <span className="font-bold sm:inline-block">RGUKT ONGOLE</span>
                </Link>

                {/* --- PART 2: CENTER - Desktop Navigation --- */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-6 text-sm">
                    {isAuthenticated && navLinks.map(link => (
                        <NavLink
                            key={link.href}
                            to={link.href}
                            className={({ isActive }) =>
                                `transition-colors hover:text-foreground/80 ${isActive ? "text-primary font-semibold" : "text-foreground/60"}`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* --- PART 3: RIGHT - User Actions & Mobile Menu --- */}
                <div className="flex items-center justify-end space-x-2">
                    <DarkModeToggle />

                    {/* --- Desktop View: User Profile or Login Button --- */}
                    <div className="hidden md:flex items-center space-x-2">
                        {isAuthenticated ? (
                            <UserProfile user={user} handleLogout={handleLogout} />
                        ) : (
                            <Button asChild><Link to="/login">Login</Link></Button>
                        )}
                    </div>

                    {/* --- Mobile View: Hamburger Menu --- */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px]">
                            {isAuthenticated ? (
                                <>
                                    {/* --- User Details inside Sheet --- */}
                                    <div className="flex flex-col items-start space-y-2 mb-8 p-4 border-b">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                                            <AvatarFallback>{user?.name?.[0].toUpperCase()}</AvatarFallback>
                                            
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{user?.name}</p>
                                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </div>

                                    {/* --- Navigation Links inside Sheet --- */}
                                    <nav className="flex flex-col gap-4 mb-4">
                                        {navLinks.map(link => (
                                            <SheetClose asChild key={link.href}>
                                                <NavLink to={link.href} className="text-lg font-medium text-muted-foreground hover:text-foreground">
                                                    {link.label}
                                                </NavLink>
                                            </SheetClose>
                                        ))}
                                    </nav>

                                    {/* --- Logout Button inside Sheet --- */}
                                    <SheetClose asChild>
                                        <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
                                            <LogOut className="mr-2 h-4 w-4"/>
                                            Logout
                                        </Button>
                                    </SheetClose>
                                </>
                            ) : (
                                // --- Login for unauthenticated users in Sheet ---
                                <div className="flex flex-col gap-4">
                                     <SheetClose asChild>
                                         <Button asChild className="w-full"><Link to="/login">Login</Link></Button>
                                     </SheetClose>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};

export default Navbar;