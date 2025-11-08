import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; 
import api from '../utils/api'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, AlertCircle, UserCircle } from 'lucide-react';

const ProfileSettings = () => {
    // Assuming useAuth provides the currently logged-in user object and a way to update it (login/updateUser)
    const { user, login } = useAuth(); 
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [status, setStatus] = useState(null); // { type: 'success'/'error', message: '...' }
    const [isLoading, setIsLoading] = useState(false);

    // Helper to get initials
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    // --- API Call: Upload Profile Picture ---
    const handleFileUpload = async (e) => {
        e.preventDefault();
        setStatus(null);

        if (!selectedFile) {
            setStatus({ type: 'error', message: 'Please select a file first.' });
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        // 'avatar' must match your Multer field name on the backend
        formData.append('avatar', selectedFile); 

        try {
            // Assumes a PUT /api/users/avatar endpoint that handles multipart/form-data
            const res = await api.put('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

             // Assuming the backend returns the updated user data in res.data.user
             // Refresh the global auth state to show the new picture instantly
            if (login && res.data.user) {
                // NOTE: A successful upload may require a slight delay or cache bust
                // for the image to show instantly if served statically.
                login(res.data.user); 
            }

            // Reset form state
            setSelectedFile(null);
            const fileInput = document.getElementById('picture');
            if (fileInput) fileInput.value = null;

            setStatus({ type: 'success', message: 'Profile picture updated successfully! (It may take a moment to refresh.)' });
        } catch (error) {
            console.error("Picture upload failed:", error.response || error);
            const errorMessage = error.response?.data?.msg || error.message || 'An unknown error occurred.';
            setStatus({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!user) return <div className="text-center py-10">Please log in to view profile settings.</div>;


    return (
        <div className="container mx-auto p-4 space-y-8 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Update your profile picture. Name and Email are fixed for your account.</p>
            
            {status && (
                <Alert variant={status.type === 'error' ? 'destructive' : 'default'} className={status.type === 'success' ? "bg-green-500/10 border-green-500 text-green-700" : ""}>
                    {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{status.type === 'success' ? 'Success!' : 'Error'}</AlertTitle>
                    <AlertDescription>{status.message}</AlertDescription>
                </Alert>
            )}

            
            <Card>
                <CardHeader>
                    <CardTitle>User Information</CardTitle>
                    <CardDescription>Your registered details.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    
                    {/* --- Profile Avatar/Picture --- */}
                    <div className="flex flex-col items-center space-y-3">
                        <Avatar className="h-28 w-28 border-4 border-primary">
                            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                            <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                                {initials || <UserCircle className="h-10 w-10"/>}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-lg font-semibold text-foreground">{user.name}</span>
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>

                    {/* --- Separator for Mobile/Tablet --- */}
                    <div className="md:hidden">
                        <Separator />
                    </div>

                    {/* --- Name/Email Display (Fixed) --- */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-muted-foreground">Full Name</Label>
                            <Input id="name" value={user.name} readOnly disabled className="font-semibold" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                            <Input id="email" value={user.email} readOnly disabled className="font-semibold" /> 
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* --- Profile Picture Upload Form --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Change Profile Picture</CardTitle>
                    <CardDescription>Upload a new image for your profile (e.g., JPG, PNG). Max 5MB.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                        <Input 
                            id="picture" 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files[0])} 
                            className="bg-card"
                        />
                        <Button type="submit" disabled={!selectedFile || isLoading}>
                            {isLoading ? 'Uploading...' : 'Upload Picture'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSettings;