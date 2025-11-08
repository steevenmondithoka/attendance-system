import React from 'react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, Image, UserCircle } from "lucide-react";

// This component handles the desktop user menu logic
export const UserProfile = ({ user, handleLogout }) => {
    // Determine the user's initials for the fallback
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border">
                        {/* Assuming user has an avatarUrl property */}
                        <AvatarImage src={user?.avatarUrl} alt={user?.name} /> 
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                            {initials || <UserCircle className="h-4 w-4" />}
                        </AvatarFallback>
                        
                    </Avatar>
                    
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    {/* --- Profile Management Feature --- */}
                    <DropdownMenuItem asChild>
                        <Link to="/profile-settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    {/* --- End Profile Management Feature --- */}
                    
                    <DropdownMenuItem asChild>
                        <Link to="/profile-settings/avatar" className="cursor-pointer">
                            <Image className="mr-2 h-4 w-4" />
                            <span>Change Profile Picture</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};