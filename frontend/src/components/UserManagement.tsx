import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/DataTable';
import { usersApi } from '@/services/api';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';
import AddUserDialog from '@/components/forms/AddUserDialog';
import DeleteUserDialog from '@/components/forms/DeleteUserDialog';
import { Badge } from '@/components/ui/badge';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const columns: Column<User>[] = [
    { key: 'username', header: 'Username', accessor: 'username' },
    { key: 'email', header: 'Email', accessor: 'email' },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => {
        const role = user.role || (user as any).roleName;
        return (
          <Badge variant={role === 'ADMIN' ? 'default' : role === 'TEACHER' ? 'secondary' : 'outline'}>
            {role === 'ADMIN' ? 'Admin' : role === 'TEACHER' ? 'Teacher' : role === 'VIEWER' ? 'Viewer' : role || 'Unknown'}
          </Badge>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user: User) => user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteClick(user)}
          disabled={user.id === currentUser?.id}
          title={user.id === currentUser?.id ? "You can't delete yourself" : 'Delete user'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage admin accounts</CardDescription>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={users}
          columns={columns}
          keyExtractor={(user) => user.id}
          emptyMessage="No users found"
        />
      </CardContent>

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchUsers}
      />

      <DeleteUserDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={fetchUsers}
      />
    </Card>
  );
}
