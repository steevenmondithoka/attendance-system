import React, { useState } from 'react';
import api from '../utils/api';

// --- SHADCN/UTILITY IMPORTS ---
// Assuming these paths based on typical ShadCN setup
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
// ------------------------------


const ChangePasswordForm = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { currentPassword, newPassword, confirmPassword } = formData;

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        try {
            // Note: In a real app, you might want to show a loading state on the button
            const res = await api.put('/auth/update-password', { currentPassword, newPassword });
            setMessage(res.data.msg);
            // Clear form on success
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            // Check for specific error structure from the backend
            setError(err.response?.data?.msg || 'An error occurred while updating the password.');
        }
    };

    return (
        // Replaced plain div with ShadCN Card for themed container
        <Card className="mt-8 w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    Update your password using your current password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        {/* Replaced plain input with ShadCN Input */}
                        <Input
                            id="currentPassword"
                            type="password"
                            name="currentPassword"
                            value={currentPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* New Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        {/* Replaced plain input with ShadCN Input */}
                        <Input
                            id="newPassword"
                            type="password"
                            name="newPassword"
                            value={newPassword}
                            onChange={handleChange}
                            required
                            placeholder="Minimum 6 characters"
                        />
                    </div>
                    
                    {/* Confirm New Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        {/* Replaced plain input with ShadCN Input */}
                        <Input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* Message Area */}
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {message && <p className="text-sm text-green-500">{message}</p>}
                    
                    {/* Submit Button */}
                    <Button
                        type="submit"
                        // w-full on mobile, constrained to w-80 on medium screens and up
                        className="w-full md:w-80" 
                    >
                        Update Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default ChangePasswordForm;