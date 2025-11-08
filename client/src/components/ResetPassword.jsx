import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

const ResetPassword = () => {
    // Get the token from the URL (e.g., /reset-password/abc123def456)
    const { token } = useParams(); 
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) { // Basic validation
             setError('Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            // NOTE: The API endpoint path must be implemented on the backend.
            await api.post(`/auth/reset-password/${token}`, { password });
            
            // Redirect to login with a success message
            navigate('/login', { state: { successMessage: 'Your password has been reset successfully. Please log in.' } });
        } catch (err) {
            console.error(err);
            // The token is likely invalid or expired
            setError('Password reset failed. The link may be invalid or expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen flex items-center justify-center p-4">
            {/* Background elements (like in Login.jsx) */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/college-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <Card className="relative z-10 w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Set New Password</CardTitle>
                    <CardDescription>
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            
                             <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password</>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </div>
                    </form>
                    
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        <Link to="/login" className="underline hover:text-primary transition-colors">
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;