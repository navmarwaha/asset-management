// src/pages/account/Account.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
// Note: Password update functionality needs to be implemented in backend
// For now, this is disabled as we're using Google OAuth
import { toast } from 'sonner';

export const Account = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    // Note: Password update is not available with Google OAuth
    // Users authenticate via Google, so password management is handled by Google
    toast.info('Password management is handled through Google account settings');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Update password</h1>
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
        />
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
        />
      </div>
      <Button onClick={handleUpdatePassword} disabled={loading}>
        {loading ? 'Updating...' : 'Update'}
      </Button>
    </div>
  );
};