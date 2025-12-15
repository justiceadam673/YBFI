import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  LogOut,
  Settings,
  Shield,
  Loader2,
  Camera,
  Upload,
} from 'lucide-react';

const UserAvatar = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, updateProfile, isLoading } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
  });

  if (isLoading) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm" className="transition-smooth">
          Sign In
        </Button>
      </Link>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({ title: 'Signed out successfully' });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please upload a JPG, PNG, or WebP image.',
        variant: 'destructive' 
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: 'File too large', 
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive' 
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      toast({ title: 'Avatar updated successfully!' });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await updateProfile(editForm);
    setIsSaving(false);

    if (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated successfully' });
      setShowProfileDialog(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-9 w-9 rounded-full p-0 ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
              <AvatarFallback className="bg-gradient-divine text-white text-sm font-medium">
                {getInitials(profile?.display_name)}
              </AvatarFallback>
            </Avatar>
            {isAdmin && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center ring-2 ring-background">
                <Shield className="h-2 w-2 text-accent-foreground" />
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.display_name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            setEditForm({
              display_name: profile?.display_name || '',
              bio: profile?.bio || '',
              phone: profile?.phone || '',
              location: profile?.location || '',
            });
            setShowProfileDialog(true);
          }}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate('/admin-users')}>
              <Shield className="mr-2 h-4 w-4" />
              Manage Users
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-divine text-white text-2xl">
                    {getInitials(editForm.display_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Click to upload a new photo
            </p>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="A short bio about yourself"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+234 XXX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserAvatar;
