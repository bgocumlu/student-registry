import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSemester } from '@/contexts/SemesterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnrollStudentDialog } from '@/components/forms/EnrollStudentDialog';
import { CollapsibleCourseSection } from '@/components/CollapsibleCourseSection';
import { TablePagination } from '@/components/TablePagination';
import { useServerPagination } from '@/hooks/useServerPagination';
import { DataTable, Column } from '@/components/DataTable';
import type { Enrollment, Course, PaginatedResponse } from '@/types';
import { coursesApi, enrollmentsApi } from '@/services/api';
import { toast } from 'sonner';

interface CourseEnrollmentsData {
  enrollments: Enrollment[];
  pagination: PaginatedResponse<Enrollment> | null;
  loading: boolean;
}

export default function Enrollments() {
  const { isAdmin } = useAuth();
  const { currentSemester } = useSemester();
  
  // This page should only be accessible to admins (route protection)
  if (!isAdmin) {
    return <div className="text-center py-8 text-muted-foreground">Access denied. Admin only.</div>;
  }
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesPaginationData, setCoursesPaginationData] = useState<PaginatedResponse<Course> | null>(null);
  
  // Store enrollments per course with pagination
  const [courseEnrollments, setCourseEnrollments] = useState<Map<number, CourseEnrollmentsData>>(new Map());
  // Store pagination state per course (page number)
  const [coursePages, setCoursePages] = useState<Map<number, number>>(new Map());
  
  const coursesPaginationHook = useServerPagination({ initialPage: 1, initialLimit: 10 });
  
  // Only showing courses - student search removed
  
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState(currentSemester || '');

  // Update semester filter when currentSemester changes
  useEffect(() => {
    if (currentSemester) {
      setSemesterFilter(currentSemester);
    }
  }, [currentSemester]);

  // Fetch only courses (not enrollments)
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        ...coursesPaginationHook.paginationParams,
        page: coursesPaginationHook.paginationParams.page,
      };
      if (semesterFilter && semesterFilter.trim() !== '') {
        params.semester = semesterFilter;
      }
      if (departmentFilter !== 'all') {
        params.department = departmentFilter;
      }
      
      const coursesResponse = await coursesApi.getAll(params);
      setCourses(coursesResponse.data || []);
      setCoursesPaginationData(coursesResponse);
      
      // Clear course enrollments when courses change (filter changed)
      setCourseEnrollments(new Map());
      setCoursePages(new Map());
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [semesterFilter, departmentFilter, coursesPaginationHook.paginationParams]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Get current page for a course
  const getCoursePage = useCallback((courseId: number) => {
    return coursePages.get(courseId) || 1;
  }, [coursePages]);

  // Set page for a course
  const setCoursePage = useCallback((courseId: number, page: number) => {
    setCoursePages(prev => new Map(prev).set(courseId, page));
  }, []);

  // Fetch enrollments for a specific course (lazy loading)
  const fetchCourseEnrollments = useCallback(async (courseId: number, page?: number) => {
    const currentPage = page ?? getCoursePage(courseId);
    
    setCourseEnrollments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(courseId) || { enrollments: [], pagination: null, loading: false };
      newMap.set(courseId, { ...existing, loading: true });
      return newMap;
    });

    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      
      const enrollmentsResponse = await coursesApi.getEnrollments(courseId, params);
      
      setCourseEnrollments(prev => {
        const newMap = new Map(prev);
        newMap.set(courseId, {
          enrollments: enrollmentsResponse.data || [],
          pagination: enrollmentsResponse,
          loading: false,
        });
        return newMap;
      });
    } catch (error) {
      toast.error(`Failed to load enrollments for course`);
      console.error('Error fetching course enrollments:', error);
      setCourseEnrollments(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(courseId) || { enrollments: [], pagination: null, loading: false };
        newMap.set(courseId, { ...existing, loading: false });
        return newMap;
      });
    }
  }, [getCoursePage]);

  // Student search functionality removed - only showing courses

  const departments = useMemo(() => {
    return Array.from(new Set(courses.map(c => c.department).filter(Boolean)));
  }, [courses]);


  const handleRemoveEnrollment = async (enrollment: Enrollment, courseId?: number) => {
    if (!enrollment.student?.id || !enrollment.course?.id) {
      toast.error('Invalid enrollment data');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${enrollment.student.firstName} ${enrollment.student.lastName} from ${enrollment.course.courseCode}?`)) {
      return;
    }

    try {
      await enrollmentsApi.remove(enrollment.student.id, enrollment.course.id);
      toast.success('Enrollment removed successfully');
      
      // Refresh course enrollments
      if (courseId) {
        await fetchCourseEnrollments(courseId);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove enrollment');
      console.error('Error removing enrollment:', error);
    }
  };

  const getColumns = (courseId?: number): Column<Enrollment>[] => [
    { key: 'studentId', header: 'Student ID', width: '100px', render: (e) => e.student?.id },
    { key: 'name', header: 'Name', width: '160px', render: (e) => `${e.student?.firstName} ${e.student?.lastName}` },
    { key: 'course', header: 'Course', width: '200px', render: (e) => `${e.course?.courseCode} - ${e.course?.courseName}` },
    { key: 'section', header: 'Section', width: '80px', render: (e) => e.course?.section },
    { key: 'semester', header: 'Semester', width: '100px', render: (e) => e.course?.semester },
    { key: 'enrolled', header: 'Enrolled', width: '100px', render: (e) => new Date(e.enrolledAt).toLocaleDateString() },
    { 
      key: 'grade', 
      header: 'Grade', 
      width: '80px',
      render: (e) => e.finalGrade ? (
        <Badge variant="outline" className="font-semibold">{e.finalGrade}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      width: '60px', 
      align: 'right',
      visible: isAdmin,
      render: (e) => (
        <Button 
          variant="ghost" 
          size="icon" 
          title="Remove enrollment"
          onClick={() => handleRemoveEnrollment(e, courseId)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enrollments</h2>
          <p className="text-muted-foreground">Manage student course enrollments</p>
        </div>
        {isAdmin && <EnrollStudentDialog onSuccess={fetchCourses} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Records</CardTitle>
          <CardDescription>
            {`${coursesPaginationData?.total || 0} course${(coursesPaginationData?.total || 0) !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <Select value={departmentFilter} onValueChange={(value) => {
              setDepartmentFilter(value);
              coursesPaginationHook.setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by semester"
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
              coursesPaginationHook.setCurrentPage(1);
              }}
              className="w-[200px]"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading courses...</div>
          ) : (
            <div className="space-y-4">
                  {courses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No courses found</p>
                  ) : (
                    <>
                      {courses.map((course) => {
                        const data = courseEnrollments.get(course.id);
                        const enrollments = data?.enrollments || [];
                        
                        const currentPage = getCoursePage(course.id);
                        const pagination = data?.pagination;
                        
                        return (
                          <CollapsibleCourseSection
                            key={course.id}
                            title={`${course.courseCode} Section ${course.section} - ${course.courseName} - ${course.semester}`}
                        subtitle={data ? `${enrollments.length} students` : undefined}
                            defaultOpen={false}
                            onFirstExpand={() => fetchCourseEnrollments(course.id)}
                            isLoading={data?.loading}
                          >
                            {data && (
                              <>
                                <DataTable
                              data={enrollments}
                              columns={getColumns(course.id)}
                                  keyExtractor={(e) => e.id}
                              emptyMessage="No enrollments"
                                />
                                {pagination && pagination.totalPages > 1 && (
                                  <div className="mt-4">
                                    <TablePagination
                                      currentPage={currentPage}
                                      totalPages={pagination.totalPages}
                                      onPageChange={(page) => {
                                        setCoursePage(course.id, page);
                                        fetchCourseEnrollments(course.id, page);
                                      }}
                                      getPageNumbers={() => {
                                        const total = pagination.totalPages;
                                        const current = currentPage;
                                        const pages: number[] = [];
                                        if (total <= 7) {
                                          for (let i = 1; i <= total; i++) pages.push(i);
                                        } else {
                                          if (current <= 3) {
                                            for (let i = 1; i <= 5; i++) pages.push(i);
                                            pages.push(-1, total);
                                          } else if (current >= total - 2) {
                                            pages.push(1, -1);
                                            for (let i = total - 4; i <= total; i++) pages.push(i);
                                          } else {
                                            pages.push(1, -1, current - 1, current, current + 1, -1, total);
                                          }
                                        }
                                        return pages;
                                      }}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </CollapsibleCourseSection>
                        );
                      })}
                      {coursesPaginationData && coursesPaginationData.totalPages > 1 && (
                        <TablePagination
                          currentPage={coursesPaginationHook.currentPage}
                          totalPages={coursesPaginationData.totalPages}
                          onPageChange={coursesPaginationHook.setCurrentPage}
                          getPageNumbers={() => coursesPaginationHook.getPageNumbers(coursesPaginationData.totalPages)}
                        />
                      )}
                    </>
                  )}
                                  </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
