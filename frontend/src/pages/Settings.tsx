import { useAuth } from '@/contexts/AuthContext';
import { useSemester } from '@/contexts/SemesterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import UserManagement from '@/components/UserManagement';
import ChangePasswordDialog from '@/components/forms/ChangePasswordDialog';
import { settingsApi } from '@/services/api';
import { useState, useEffect } from 'react';

export default function Settings() {
  const { isAdmin, user } = useAuth();
  const { currentSemester, setCurrentSemester } = useSemester();
  const [localSemester, setLocalSemester] = useState(currentSemester);
  const [isUpdating, setIsUpdating] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Sync local state with context when it changes
  useEffect(() => {
    setLocalSemester(currentSemester);
  }, [currentSemester]);

  // Fetch current semester from backend on mount
  useEffect(() => {
    const fetchCurrentSemester = async () => {
      try {
        const setting = await settingsApi.getCurrentSemester();
        if (setting && setting.value) {
          setCurrentSemester(setting.value);
          setLocalSemester(setting.value);
        }
      } catch (error: any) {
        // If setting doesn't exist (404), use default from context
        // Other errors are logged but don't prevent the page from loading
        if (error.status !== 404 && error.message && !error.message.includes('404')) {
          console.error('Error fetching current semester:', error);
        }
      }
    };
    fetchCurrentSemester();
  }, [setCurrentSemester]);

  const handleSemesterUpdate = async () => {
    if (!localSemester || localSemester.trim() === '') {
      toast.error('Please enter a valid semester');
      return;
    }

    try {
      setIsUpdating(true);
      await settingsApi.setCurrentSemester(localSemester);
      setCurrentSemester(localSemester);
      toast.success('Current semester updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update semester');
      console.error('Error updating semester:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage system configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Semester</CardTitle>
              <CardDescription>
                Set the active semester. Teachers can only edit grades and absences for the current semester.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={localSemester}
                  onChange={(e) => setLocalSemester(e.target.value)}
                  placeholder="e.g., 2025-Spring"
                  disabled={!isAdmin || isUpdating}
                />
                <p className="text-xs text-muted-foreground">
                  Format: YYYY-Season (e.g., 2025-Spring, 2025-Fall)
                </p>
              </div>
              {isAdmin && (
                <Button onClick={handleSemesterUpdate} disabled={isUpdating || localSemester === currentSemester}>
                  {isUpdating ? 'Updating...' : 'Update Semester'}
                </Button>
              )}
              {!isAdmin && (
                <p className="text-sm text-muted-foreground">
                  Only administrators can change the current semester.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user?.username || 'admin'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || 'admin@student.edu'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={
                  user?.role === 'ADMIN' ? 'Administrator' :
                  user?.role === 'TEACHER' ? 'Teacher' :
                  user?.role === 'VIEWER' ? 'Viewer' : 'Unknown'
                } disabled />
              </div>
              <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
                Change Password
              </Button>
            </CardContent>
          </Card>
          <ChangePasswordDialog
            open={changePasswordOpen}
            onOpenChange={setChangePasswordOpen}
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
