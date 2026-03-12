import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Settings, Edit, Trash, Search } from 'lucide-react';
import api from '@/lib/api-client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [openEditUser, setOpenEditUser] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [role, setRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  useEffect(() => {
    setEmail(user?.email || '');
    setDepartment(user?.department || '');
    checkAuthorization();
    fetchUsers();
    if (user?.role) {
      setUserRole(user.role);
      setRole(user.role);
    }
  }, [user]);

  const checkAuthorization = async () => {
    if (user?.email) {
      try {
        const response = await api.users.getMe();
        if (response.data) {
          setIsAuthorized(true);
          setUserRole(response.data.role);
          setRole(response.data.role);
          setDepartment(response.data.department || '');
        } else {
          setIsAuthorized(false);
          setUserRole(null);
          setRole('');
        }
      } catch (error) {
        setIsAuthorized(false);
        setUserRole(null);
        setRole('');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.users.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut();
    setIsLoading(false);
  };

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (user?.email) {
        // Build update object with only fields that can be updated
        const updates: any = {};
        
        // Department can be updated by any user
        if (department !== undefined && department !== user?.department) {
          updates.department = department || null;
        }
        
        // Only admins can update role
        const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';
        if (isAdmin && role !== undefined && role !== user?.role) {
          updates.role = role || null;
        }
        
        // Check if there are any fields to update
        if (Object.keys(updates).length === 0) {
          toast.info('No changes to save');
          setIsLoading(false);
          setOpenProfile(false);
          return;
        }
        
        await api.users.update(user.email, updates);
        toast.success('Profile updated successfully');
        // Refresh user data
        await checkAuthorization();
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
      setOpenProfile(false);
    }
  };

  const handleUpdateSettings = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (user?.email) {
        const response = await api.users.update(user.email, { department, role });
        setDepartment(response.data?.department || '');
        setRole(response.data?.role || '');
        toast.success('Settings updated successfully');
      }
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
      setOpenSettings(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (userRole !== 'Super Admin' && userRole !== 'Admin') return;
    setIsLoading(true);
    try {
      if (userRole === 'Admin' && (role === 'Super Admin' || role === 'Admin')) {
        setErrorMessage('Admins can only create users with Operator or Reporter roles.');
        return;
      }
      await api.users.create({
        email,
        department,
        role,
      });
      await fetchUsers();
      toast.success('User created successfully! The user can now sign in with Google.');
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage('Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
      if (!isLoading) {
        setOpenCreateUser(false);
        setEmail('');
        setDepartment('');
        setRole('');
      }
    }
  };

  const handleEditUser = (user) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin') return;
    if (userRole === 'Admin' && (user.role === 'Super Admin' || user.role === 'Admin')) {
      setErrorMessage('Admins cannot edit Super Admin or Admin users.');
      return;
    }
    setSelectedUser(user);
    setEmail(user.email);
    setDepartment(user.department || '');
    setRole(user.role || '');
    setOpenEditUser(true);
    setIsFormSubmitted(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser || (userRole !== 'Super Admin' && userRole !== 'Admin')) return;

    if (userRole === 'Admin' && (selectedUser.role === 'Super Admin' || selectedUser.role === 'Admin')) {
      setErrorMessage('Admins cannot edit Super Admin or Admin users.');
      return;
    }

    if (userRole === 'Admin' && (role === 'Super Admin' || role === 'Admin')) {
      setErrorMessage('Admins can only assign Operator or Reporter roles.');
      return;
    }

    if (userRole === 'Admin' && selectedUser.id === user.id && role !== selectedUser.role) {
      setErrorMessage('Admins cannot change their own role.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setIsFormSubmitted(true);
    try {
      await api.users.update(selectedUser.email, {
        email,
        department,
        role: userRole === 'Admin' ? (selectedUser.id === user.id ? selectedUser.role : role) : role,
      });
      await fetchUsers();
      if (isFormSubmitted) {
        alert('User updated successfully!');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrorMessage('Failed to update user. Please try again.');
    } finally {
      setIsLoading(false);
      setOpenEditUser(false);
      setSelectedUser(null);
      setEmail('');
      setDepartment('');
      setRole('');
      setIsFormSubmitted(false);
    }
  };

  const handleCancelEdit = () => {
    setOpenEditUser(false);
    setSelectedUser(null);
    setEmail('');
    setDepartment('');
    setRole('');
    setErrorMessage('');
    setIsFormSubmitted(false);
  };

  const handleDeleteUser = async (id) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin') return;
    try {
      // Get user by email (id is email in our system)
      const targetUserResponse = await api.users.getByEmail(id);
      const targetUser = targetUserResponse.data;

      if (userRole === 'Admin' && targetUser.role === 'Super Admin') {
        setErrorMessage('Admins cannot delete Super Admin users.');
        return;
      }

      await api.users.delete(id);
      setUsers(users.filter(user => user.email !== id));
      toast.success('User deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setErrorMessage(error.message || 'Failed to delete user. Please try again.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userInitials = user?.email?.[0]?.toUpperCase() || 'U';

  if (!user) return <div className="text-sm">Please log in to access this page.</div>;
  if (!isAuthorized) return <div className="text-sm">Access denied. You are not an authorized user.</div>;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src=""
                alt={user.email || 'User'}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 text-sm">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.email || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenProfile(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>User Management</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isLoading}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent className="max-w-[400px] text-sm">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-sm">Email</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="col-span-3 text-sm bg-muted"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right text-sm">Department</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Enter department"
                  className="col-span-3 text-sm"
                />
              </div>
              {(userRole === 'Super Admin' || userRole === 'Admin') && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right text-sm">Role</Label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="col-span-3 text-sm h-9 rounded-md border border-input bg-background px-3 py-1"
                    >
                      <option value="">Select role</option>
                      <option value="Viewer">Viewer</option>
                      <option value="Operator">Operator</option>
                      <option value="Admin">Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="text-sm">
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

<Dialog open={openSettings} onOpenChange={setOpenSettings}>
  <DialogContent className="max-w-[90vw] w-[900px] text-sm">
    <DialogHeader className="flex justify-between items-center">
      <div>
        <DialogTitle>User Management</DialogTitle>
        <DialogDescription>Manage user details.</DialogDescription>
      </div>
      {(userRole === 'Super Admin' || userRole === 'Admin') && (
        <Button 
          onClick={() => setOpenCreateUser(true)}
          className="ml-auto text-sm"
        >
          Add new users
        </Button>
      )}
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md text-sm"
        />
        <Button variant="outline" size="icon" onClick={() => setSearchQuery('')}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {errorMessage && (
        <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
      )}
      
      {/* Single Table Container */}
      <div className="border rounded-md overflow-hidden bg-background">
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm table-fixed border-collapse">
            <thead className="sticky top-0 z-20 bg-card text-card-foreground border-b">
              <tr>
                <th className="w-[150px] py-3 px-4 text-left font-semibold text-sm border-r last:border-r-0 bg-card">
                  Name
                </th>
                <th className="w-[150px] py-3 px-4 text-left font-semibold text-sm border-r last:border-r-0 bg-card">
                  Department
                </th>
                <th className="w-[200px] py-3 px-4 text-left font-semibold text-sm border-r last:border-r-0 bg-card">
                  Email
                </th>
                <th className="w-[120px] py-3 px-4 text-left font-semibold text-sm border-r last:border-r-0 bg-card">
                  Role
                </th>
                <th className="w-[100px] py-3 px-4 text-left font-semibold text-sm bg-card">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Search className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm">No users found</p>
                      {searchQuery && (
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`border-b transition-colors ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    } hover:bg-muted/50`}
                  >
                    <td className="w-[150px] py-3 px-4 text-sm font-medium text-foreground align-top border-r last:border-r-0">
                      <div className="truncate max-w-[150px]">
                        {user.email.split('@')[0]}
                      </div>
                    </td>
                    <td className="w-[150px] py-3 px-4 text-sm text-muted-foreground align-top border-r last:border-r-0">
                      <div className="truncate max-w-[150px]">
                        {user.department || '—'}
                      </div>
                    </td>
                    <td className="w-[200px] py-3 px-4 text-sm text-foreground align-top border-r last:border-r-0">
                      <div className="truncate max-w-[200px]">
                        {user.email}
                      </div>
                    </td>
                    <td className="w-[120px] py-3 px-4 text-sm align-top border-r last:border-r-0">
                      <div className="truncate max-w-[120px]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'Super Admin' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                            : user.role === 'Admin' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                            : user.role === 'Operator' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="w-[100px] py-3 px-4 align-top">
                      <div className="flex items-center space-x-1">
                        {(userRole === 'Super Admin' || (userRole === 'Admin' && user.role !== 'Super Admin' && user.role !== 'Admin')) ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditUser(user)}
                              className="h-7 w-7 p-0 text-foreground hover:bg-muted hover:text-primary transition-colors"
                              title="Edit user"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user.id)}
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Delete user"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
      <Dialog open={openCreateUser} onOpenChange={setOpenCreateUser}>
        <DialogContent className="max-w-[400px] max-h-[70vh] text-sm">
          <DialogHeader>
            <DialogTitle>Create new users</DialogTitle>
          </DialogHeader>
          {errorMessage && (
            <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
          )}
          <form onSubmit={handleCreateUser} className="space-y-4 py-4 overflow-y-auto max-h-[50vh]">
            <div>
              <Label htmlFor="email" className="text-sm">Email *</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="department" className="text-sm">Select Department *</Label>
              <select id="department" className="w-full p-2 border rounded text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Select Department</option>
                <option value="Administrators">Administrators</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Technology Team">Technology Team</option>
                <option value="Production Team">Production Team</option>
                <option value="QA Team">QA Team</option>
                <option value="DevOps">DevOps</option>
              </select>
            </div>
            <div>
              <Label htmlFor="role" className="text-sm">Select role *</Label>
              <select id="role" className="w-full p-2 border rounded text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select Role</option>
                {userRole === 'Super Admin' && (
                  <>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                  </>
                )}
                <option value="Operator">Operator</option>
                <option value="Reporter">Reporter</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreateUser(false)} className="text-sm">Cancel</Button>
              <Button type="submit" disabled={isLoading} className="text-sm">
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditUser} onOpenChange={(open) => {
        if (!open) {
          handleCancelEdit();
        }
        setOpenEditUser(open);
      }}>
        <DialogContent className="max-w-[400px] max-h-[70vh] text-sm">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {errorMessage && (
            <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
          )}
          <form onSubmit={handleSaveEdit} className="space-y-4 py-4 overflow-y-auto max-h-[50vh]">
            <div>
              <Label htmlFor="editEmail" className="text-sm">Email *</Label>
              <Input
                id="editEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="editDepartment" className="text-sm">Select Department *</Label>
              <select id="editDepartment" className="w-full p-2 border rounded text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Select Department</option>
                <option value="Administrators">Administrators</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Technology Team">Technology Team</option>
                <option value="Production Team">Production Team</option>
                <option value="QA Team">QA Team</option>
                <option value="DevOps">DevOps</option>
              </select>
            </div>
            <div>
              <Label htmlFor="editRole" className="text-sm">Select role *</Label>
              <select id="editRole" className="w-full p-2 border rounded text-sm" value={role} onChange={(e) => setRole(e.target.value)} disabled={userRole === 'Admin' && selectedUser?.id === user.id}>
                <option value="">Select Role</option>
                {userRole === 'Super Admin' && (
                  <>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                  </>
                )}
                <option value="Operator">Operator</option>
                <option value="Reporter">Reporter</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit} className="text-sm">Cancel</Button>
              <Button type="submit" disabled={isLoading} className="text-sm">
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};