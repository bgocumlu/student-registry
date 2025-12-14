import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSemester } from '@/contexts/SemesterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddCourseDialog from '@/components/forms/AddCourseDialog';
import EditCourseDialog from '@/components/forms/EditCourseDialog';
import { DeleteCourseDialog } from '@/components/forms/DeleteCourseDialog';
import { DataTable, Column } from '@/components/DataTable';
import type { Course, Teacher, PaginatedResponse } from '@/types';
import { coursesApi, teachersApi } from '@/services/api';
import { toast } from 'sonner';
import { useServerPagination } from '@/hooks/useServerPagination';

export default function Courses() {
  const navigate = useNavigate();
  const { isAdmin, isTeacher, user } = useAuth();
  const { currentSemester } = useSemester();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState(currentSemester || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [paginationData, setPaginationData] = useState<PaginatedResponse<Course> | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  // Update semester filter when currentSemester changes
  useEffect(() => {
    if (currentSemester) {
      setSemesterFilter(currentSemester);
    }
  }, [currentSemester]);
  
  const pagination = useServerPagination({ initialPage: 1, initialLimit: 10 });

  // Fetch teachers list only if admin
  // For teachers, fetch their own teacher record to get teacherId
  useEffect(() => {
    const fetchTeachers = async () => {
      if (isAdmin) {
        try {
          const teachersResponse = await teachersApi.getAll({ limit: 100 });
          setTeachers(teachersResponse.data || []);
        } catch (error: any) {
          // Silently fail if 403 - user might not have permission
          if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            console.warn('No permission to fetch teachers list');
          } else {
            console.error('Error fetching teachers:', error);
          }
        }
      } else if (isTeacher && user?.id) {
        // For teachers, fetch their teacher record to get teacherId
        try {
          const teachersResponse = await teachersApi.getAll({ limit: 100 });
          const teacher = teachersResponse.data?.find(t => t.userId === user.id);
          if (teacher) {
            setTeacherId(teacher.id);
          }
        } catch (error) {
          console.warn('Could not fetch teacher ID for filtering');
        }
      }
    };
    fetchTeachers();
  }, [isAdmin, isTeacher, user?.id]);


  const fetchCourses = async () => {
    // Wait for teacherId to be loaded before making the API call for teachers
    if (isTeacher && !teacherId) {
      return;
    }
    
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
      if (semesterFilter && semesterFilter.trim() !== '') {
        params.semester = semesterFilter;
      }
      // Filter by teacher if user is a teacher
      if (isTeacher && teacherId) {
        params.teacherId = teacherId;
      }

      const response = await coursesApi.getAll(params);
      setCourses(response.data || []);
      setPaginationData(response);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [pagination.paginationParams, activeSearchTerm, departmentFilter, semesterFilter, isTeacher, teacherId]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveSearchTerm(searchTerm);
      pagination.setCurrentPage(1);
    }
  };

  const departments = useMemo(() => {
    return Array.from(new Set(courses.map(c => c.department)));
  }, [courses]);

  // Client-side filter for status only (since backend doesn't support status filter)
  // Use the actual course.status from the database, don't override it
  const filteredCourses = useMemo(() => {
    if (statusFilter === 'all') return courses;
    return courses.filter(course => course.status === statusFilter);
  }, [courses, statusFilter]);


  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'TBA';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{isTeacher ? 'My Courses' : 'Courses'}</h2>
          <p className="text-muted-foreground">
            {isTeacher ? 'Manage your assigned courses, grades, and absences' : 'Manage course catalog and schedules'}
          </p>
        </div>
        {isAdmin && <AddCourseDialog teachers={teachers} onSuccess={fetchCourses} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Catalog</CardTitle>
          <CardDescription>
            {paginationData?.total || 0} course{(paginationData?.total || 0) !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading courses...</div>
          ) : (
            <>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses by name or code... (Press Enter to search)"
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
            <Input
              placeholder="Filter by semester"
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
                pagination.setCurrentPage(1);
              }}
              className="w-[200px]"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={filteredCourses}
            keyExtractor={(course) => course.id}
            pagination={paginationData ? {
              enabled: true,
              currentPage: pagination.currentPage,
              totalPages: paginationData.totalPages || 1,
              onPageChange: pagination.setCurrentPage,
              getPageNumbers: pagination.getPageNumbers,
            } : undefined}
            columns={[
              { key: 'code', header: 'Code', width: '80px', accessor: 'courseCode' },
              { key: 'section', header: 'Section', width: '70px', render: (course) => course.section || '-' },
              { 
                key: 'name', 
                header: 'Course Name', 
                width: '200px',
                render: (course) => (
                  <button 
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="hover:underline text-primary font-medium truncate block"
                  >
                    {course.courseName}
                  </button>
                )
              },
              { key: 'department', header: 'Department', width: '160px', accessor: 'department' },
              { key: 'credits', header: 'Credits', width: '60px', accessor: 'credit' },
              { key: 'semester', header: 'Semester', width: '100px', accessor: 'semester' },
              { 
                key: 'status', 
                header: 'Status', 
                width: '80px',
                render: (course) => (
                  <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                )
              },
              ...(isAdmin ? [{
                key: 'actions', 
                header: 'Actions', 
                width: '100px',
                align: 'right' as const,
                render: (course: Course) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingCourse(course)}
                      title="Edit course"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Delete course"
                      onClick={() => setDeletingCourse(course)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              }] : []) as Column<Course>[]
            ]}
          />
          </>
          )}
        </CardContent>
      </Card>

      {editingCourse && (
        <EditCourseDialog 
          course={editingCourse} 
          open={!!editingCourse} 
          onOpenChange={(open) => !open && setEditingCourse(null)}
          teachers={teachers}
          onSuccess={fetchCourses}
        />
      )}

      {deletingCourse && (
        <DeleteCourseDialog 
          course={deletingCourse} 
          open={!!deletingCourse} 
          onOpenChange={(open) => !open && setDeletingCourse(null)}
          onSuccess={fetchCourses}
        />
      )}
    </div>
  );
}
