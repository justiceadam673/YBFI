import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Download,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2,
  TrendingUp,
  Clock,
  Crown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  is_admin?: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    newThisWeek: 0,
    activeToday: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const verifyPassword = async () => {
    if (!password.trim()) {
      toast({ title: 'Please enter the admin password', variant: 'destructive' });
      return;
    }
    
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-password', {
        body: { password, action: 'admin_users' }
      });
      
      if (error || !data?.valid) {
        toast({ title: 'Invalid password', variant: 'destructive' });
      } else {
        setIsPasswordVerified(true);
        fetchUsers();
      }
    } catch (err) {
      toast({ title: 'Verification failed', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const usersWithRoles: UserProfile[] = (profiles || []).map(p => ({
        ...p,
        is_admin: adminUserIds.has(p.user_id),
      }));

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      setStats({
        total: usersWithRoles.length,
        admins: usersWithRoles.filter(u => u.is_admin).length,
        newThisWeek: usersWithRoles.filter(u => new Date(u.created_at) > weekAgo).length,
        activeToday: usersWithRoles.filter(u => {
          const updated = new Date(u.updated_at);
          return updated.toDateString() === now.toDateString();
        }).length,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Failed to load users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.display_name?.toLowerCase().includes(query) ||
        u.location?.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => 
        roleFilter === 'admin' ? u.is_admin : !u.is_admin
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const toggleAdminRole = async (targetUserId: string, makeAdmin: boolean) => {
    try {
      if (makeAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: targetUserId, role: 'admin' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', targetUserId)
          .eq('role', 'admin');
        if (error) throw error;
      }

      setUsers(prev => prev.map(u => 
        u.user_id === targetUserId ? { ...u, is_admin: makeAdmin } : u
      ));
      
      toast({
        title: makeAdmin ? 'Admin role granted' : 'Admin role removed',
        description: `User has been ${makeAdmin ? 'promoted to' : 'removed from'} admin.`,
      });
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({ title: 'Failed to update role', variant: 'destructive' });
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Location', 'Phone', 'Bio', 'Role', 'Joined'].join(','),
      ...filteredUsers.map(u => [
        `"${u.display_name || 'N/A'}"`,
        `"${u.location || 'N/A'}"`,
        `"${u.phone || 'N/A'}"`,
        `"${(u.bio || 'N/A').replace(/"/g, '""')}"`,
        u.is_admin ? 'Admin' : 'User',
        format(new Date(u.created_at), 'yyyy-MM-dd'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ybfi-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Export complete', description: 'User data has been exported to CSV.' });
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPasswordVerified) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-elevated">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Admin Access</CardTitle>
              <CardDescription>Enter the admin password to manage users</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); verifyPassword(); }} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                />
                <Button className="w-full" disabled={verifying}>
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify Access
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">View and manage all registered users</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="hover-lift transition-smooth">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift transition-smooth">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold">{stats.admins}</p>
                  </div>
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Crown className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift transition-smooth">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New This Week</p>
                    <p className="text-2xl font-bold">{stats.newThisWeek}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift transition-smooth">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-2xl font-bold">{stats.activeToday}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, location, or bio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={(v: 'all' | 'admin' | 'user') => setRoleFilter(v)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admins Only</SelectItem>
                    <SelectItem value="user">Users Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportUsers}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="shadow-soft">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden md:table-cell">Location</TableHead>
                        <TableHead className="hidden md:table-cell">Joined</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={u.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(u.display_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{u.display_name || 'Unnamed User'}</p>
                                {u.phone && (
                                  <p className="text-xs text-muted-foreground">{u.phone}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {u.location ? (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {u.location}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(u.created_at), 'MMM d, yyyy')}
                            </span>
                          </TableCell>
                          <TableCell>
                            {u.is_admin ? (
                              <Badge className="bg-accent text-accent-foreground">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(u)}>
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="font-display">User Details</DialogTitle>
                                    <DialogDescription>View full user profile information</DialogDescription>
                                  </DialogHeader>
                                  {selectedUser && selectedUser.id === u.id && (
                                    <div className="space-y-6 pt-4">
                                      <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                          <AvatarImage src={selectedUser.avatar_url || undefined} />
                                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                            {getInitials(selectedUser.display_name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <h3 className="font-semibold text-lg">{selectedUser.display_name || 'Unnamed User'}</h3>
                                          {selectedUser.is_admin && (
                                            <Badge className="bg-accent text-accent-foreground mt-1">
                                              <Crown className="h-3 w-3 mr-1" />
                                              Admin
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-3 text-sm">
                                        {selectedUser.bio && (
                                          <p className="text-muted-foreground italic">"{selectedUser.bio}"</p>
                                        )}
                                        {selectedUser.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{selectedUser.phone}</span>
                                          </div>
                                        )}
                                        {selectedUser.location && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{selectedUser.location}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          <span>Joined {format(new Date(selectedUser.created_at), 'MMMM d, yyyy')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAdminRole(u.user_id, !u.is_admin)}
                              >
                                {u.is_admin ? (
                                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUsers;
