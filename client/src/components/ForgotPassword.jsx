import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // NOTE: The API endpoint path must be implemented on the backend.
            await api.post('/auth/forgot-password', { email });
            
            setSuccess('A password reset link has been sent to your email address.');
            setEmail(''); // Clear the input
        } catch (err) {
            console.error(err);
            // Show a generic error message for security reasons
            setError('Could not process the request. Please check the email and try again.');
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
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link.
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

                            {success && (
                                <Alert className="bg-green-100 border-green-400 text-green-700">
                                    <CheckCircle className="h-4 w-4 text-green-700" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading || !!success}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Link</>
                                ) : (
                                    'Send Reset Link'
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

export default ForgotPassword;