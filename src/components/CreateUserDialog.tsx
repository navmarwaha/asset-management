// src/components/CreateUserDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api-client';
import { toast } from 'sonner';

interface CreateUserDialogProps {
  onSuccess: () => void;
}

export const CreateUserDialog = ({ onSuccess }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [createType, setCreateType] = useState('Single user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');

  const departments = [
    'Administrators',
    'Consultant',
    'Customer Support Team',
    'DevOps Team',
    'DevOps-Production',
    'Dropped',
    'FT QA Team',
    'IT Team-East',
    // Add more as needed from your image
  ];

  const roles = [
    { value: 'Reporter', label: 'Reporter', description: 'Read' },
    { value: 'Operator', label: 'Operator', description: 'Read,Write' },
    { value: 'Admin', label: 'Admin', description: 'Read,Write,Execute' },
  ];

  const handleCreate = async () => {
    try {
      // Note: Since we're using Google OAuth, user creation might need to be handled differently
      // For now, we'll just create the user record in the database
      // The user will need to sign in with Google to authenticate
      await api.users.create({
        email,
        department,
        role,
      });

      toast.success('User created successfully');
      onSuccess();
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const resetForm = () => {
    setStep(1);
    setCreateType('Single user');
    setName('');
    setEmail('');
    setPassword('');
    setDepartment('');
    setRole('');
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>Create new users</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new users</DialogTitle>
        </DialogHeader>
        <div className="flex border-b">
          <div className={`flex-1 p-2 text-center ${step === 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>
            1 Create type
          </div>
          <div className={`flex-1 p-2 text-center ${step === 2 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'}`}>
            2 Details
          </div>
        </div>
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="createType">Create *</Label>
              <Select value={createType} onValueChange={setCreateType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select create type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single user">Single user</SelectItem>
                  {/* Add more options if needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Type user name here" />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password (Enter above 6 characters) *</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="department">Select Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Select role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label} {r.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Go Back
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Next</Button>
          ) : (
            <Button onClick={handleCreate}>Create</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};