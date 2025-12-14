import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddTeacherDialog } from '@/components/forms/AddTeacherDialog';
import { EditTeacherDialog } from '@/components/forms/EditTeacherDialog';
import { DeleteTeacherDialog } from '@/components/forms/DeleteTeacherDialog';
import { DataTable, Column } from '@/components/DataTable';
import type { Teacher, PaginatedResponse } from '@/types';
import { teachersApi, usersApi } from '@/services/api';
import { useServerPagination } from '@/hooks/useServerPagination';

export default function Teachers() {
  const { isAdmin } = useAuth();
  
  // This page should only be accessible to admins (route protection)
  // But add guard here too to prevent API calls if somehow accessed
  if (!isAdmin) {
    return <div className="text-center py-8 text-muted-foreground">Access denied. Admin only.</div>;
  }
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [paginationData, setPaginationData] = useState<PaginatedResponse<Teacher> | null>(null);
  
  const pagination = useServerPagination({ initialPage: 1, initialLimit: 10 });


  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params: any = {
        ...pagination.paginationParams,
        // Backend expects 1-based page, frontend uses 1-based, so no conversion needed
        page: pagination.paginationParams.page,
      };
      
      // Add filters
      if (activeSearchTerm) {
        params.name = activeSearchTerm;
      }
      if (departmentFilter !== 'all') {
        params.department = departmentFilter;
      }

      const response = await teachersApi.getAll(params);
      setTeachers(response.data || []);
      setPaginationData(response);
    } catch (error) {
      toast.error('Failed to load teachers');
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [pagination.paginationParams, activeSearchTerm, departmentFilter]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveSearchTerm(searchTerm);
      pagination.setCurrentPage(1);
    }
  };

  const handleAssignLogin = async (teacher: Teacher) => {
    try {
      // Check if user already exists for this email
      let user = await usersApi.getByEmail(teacher.email);
      
      // If user doesn't exist, create one
      if (!user) {
        user = await usersApi.create({
          email: teacher.email,
          password: 'password',
          role: 'TEACHER',
          username: teacher.email.split('@')[0], // Use email prefix as username
        });
      } else {
        // User already exists, inform the user
        toast.info(`User with email ${teacher.email} already exists. Assigning existing user to teacher.`);
      }
      
      // Assign the user to the teacher
      await teachersApi.assignUser(teacher.id, user.id);
      
      // Refresh the list
      const params: any = {
        ...pagination.paginationParams,
        page: pagination.paginationParams.page,
      };
      if (activeSearchTerm) params.name = activeSearchTerm;
      if (departmentFilter !== 'all') params.department = departmentFilter;
      const response = await teachersApi.getAll(params);
      setTeachers(response.data || []);
      setPaginationData(response);
      
      toast.success(`Login access enabled for ${teacher.firstName} ${teacher.lastName}${!user ? ' (password: password)' : ''}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign login access');
      console.error('Error assigning login access:', error);
    }
  };

  const handleRevokeLogin = async (teacher: Teacher) => {
    try {
      await teachersApi.revokeUser(teacher.id);
      // Refresh the list
      const params: any = {
        ...pagination.paginationParams,
        page: pagination.paginationParams.page, // Backend expects 1-based pages
      };
      if (activeSearchTerm) params.name = activeSearchTerm;
      if (departmentFilter !== 'all') params.department = departmentFilter;
      const response = await teachersApi.getAll(params);
      setTeachers(response.data || []);
      setPaginationData(response);
      toast.success(`Login access revoked from ${teacher.firstName} ${teacher.lastName}`);
    } catch (error) {
      toast.error('Failed to revoke login access');
    }
  };

  const departments = useMemo(() => {
    return Array.from(new Set(teachers.map(t => t.department)));
  }, [teachers]);


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teachers</h2>
          <p className="text-muted-foreground">Manage teaching faculty and their courses</p>
        </div>
        {isAdmin && <AddTeacherDialog onSuccess={() => {
          // Refresh the list when a teacher is added
          const params: any = {
            ...pagination.paginationParams,
            page: pagination.paginationParams.page,
          };
          if (activeSearchTerm) params.name = activeSearchTerm;
          if (departmentFilter !== 'all') params.department = departmentFilter;
          teachersApi.getAll(params).then(response => {
            setTeachers(response.data || []);
            setPaginationData(response);
          });
        }} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Directory</CardTitle>
          <CardDescription>
            {paginationData?.total || 0} teacher{(paginationData?.total || 0) !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading teachers...</div>
          ) : (
            <>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers by name or email... (Press Enter to search)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={(value) => {
              setDepartmentFilter(value);
              pagination.setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={teachers}
            keyExtractor={(teacher) => teacher.id}
            pagination={paginationData ? {
              enabled: true,
              currentPage: pagination.currentPage,
              totalPages: paginationData.totalPages || 1,
              onPageChange: pagination.setCurrentPage,
              getPageNumbers: pagination.getPageNumbers,
            } : undefined}
            columns={[
              { 
                key: 'name', 
                header: 'Name', 
                width: '150px',
                render: (teacher) => `${teacher.firstName} ${teacher.lastName}`
              },
              { key: 'department', header: 'Department', width: '160px', accessor: 'department' },
              { key: 'email', header: 'Email', width: '180px', accessor: 'email' },
              { key: 'phone', header: 'Phone', width: '120px', accessor: 'phone' },
              { 
                key: 'loginAccess', 
                header: 'Login', 
                width: '80px',
                render: (teacher) => teacher.userId ? (
                  <span className="text-success text-sm">✓ Enabled</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Not enabled</span>
                )
              },
              ...(isAdmin ? [{
                key: 'actions', 
                header: 'Actions', 
                width: '120px',
                align: 'right' as const,
                render: (teacher: Teacher) => (
                  <div className="flex items-center justify-end gap-1">
                    {teacher.userId ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Revoke login"
                        onClick={() => handleRevokeLogin(teacher)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Assign login"
                        onClick={() => handleAssignLogin(teacher)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingTeacher(teacher)}
                      title="Edit teacher"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeletingTeacher(teacher)}
                      title="Delete teacher"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              }] : []) as Column<Teacher>[]
            ]}
          />
          </>
          )}
        </CardContent>
      </Card>

      {editingTeacher && (
        <EditTeacherDialog 
          teacher={editingTeacher} 
          open={!!editingTeacher} 
          onOpenChange={(open) => !open && setEditingTeacher(null)} 
          onSuccess={fetchTeachers}
        />
      )}

      {deletingTeacher && (
        <DeleteTeacherDialog 
          teacher={deletingTeacher} 
          open={!!deletingTeacher} 
          onOpenChange={(open) => !open && setDeletingTeacher(null)} 
          onSuccess={fetchTeachers}
        />
      )}
    </div>
  );
}
