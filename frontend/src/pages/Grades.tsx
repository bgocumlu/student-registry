import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSemester } from '@/contexts/SemesterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CollapsibleCourseSection } from '@/components/CollapsibleCourseSection';
import { TablePagination } from '@/components/TablePagination';
import { useServerPagination } from '@/hooks/useServerPagination';
import { DataTable, Column } from '@/components/DataTable';
import type { Enrollment, Course, PaginatedResponse } from '@/types';
import { coursesApi, gradesApi, teachersApi } from '@/services/api';

interface CourseEnrollmentsData {
  enrollments: Enrollment[];
  pagination: PaginatedResponse<Enrollment> | null;
  loading: boolean;
}

export default function Grades() {
  const { isAdmin, isTeacher, user } = useAuth();
  const { currentSemester } = useSemester();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  // Student search removed - only showing courses
  const [grades, setGrades] = useState<{ [key: number]: string }>({});
  const [savingGrades, setSavingGrades] = useState<Set<number>>(new Set());
  const [coursesPaginationData, setCoursesPaginationData] = useState<PaginatedResponse<Course> | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  
  // Store enrollments per course with pagination
  const [courseEnrollments, setCourseEnrollments] = useState<Map<number, CourseEnrollmentsData>>(new Map());
  const [coursePages, setCoursePages] = useState<Map<number, number>>(new Map());
  
  const coursesPaginationHook = useServerPagination({ initialPage: 1, initialLimit: 10 });

  const canModify = isAdmin || isTeacher;

  // For teachers, fetch their teacher record to get teacherId
  useEffect(() => {
    const fetchTeacherId = async () => {
      if (isTeacher && user?.id) {
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
    fetchTeacherId();
  }, [isTeacher, user?.id]);

  const gradeOptions = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W'];

  // Fetch only courses (not enrollments)
  const fetchCourses = useCallback(async () => {
    // Wait for teacherId to be loaded before making the API call for teachers
    if (isTeacher && !teacherId) {
      return;
    }
    
    try {
      setLoading(true);
      const params: any = {
        ...coursesPaginationHook.paginationParams,
        page: coursesPaginationHook.paginationParams.page,
      };
      // Always filter by current semester for grade management
      if (currentSemester) {
        params.semester = currentSemester;
      }
      if (isTeacher && teacherId) {
        params.teacherId = teacherId;
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
  }, [currentSemester, coursesPaginationHook.paginationParams, isTeacher, teacherId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Student search functionality removed - only showing courses

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

  // No need to filter enrollments by semester - we only show current semester courses
  const getFilteredEnrollments = useCallback((enrollments: Enrollment[]) => {
    return enrollments;
  }, []);

  const handleGradeChange = (enrollmentId: number, grade: string) => {
    setGrades({
      ...grades,
      [enrollmentId]: grade,
    });
  };

  const handleClearGrade = (enrollmentId: number) => {
    setGrades({
      ...grades,
      [enrollmentId]: '',
    });
  };

  const handleSaveGrade = async (enrollment: Enrollment, courseId: number) => {
    // Get the grade from state or current enrollment, default to empty string for clearing
    const grade = grades[enrollment.id] !== undefined ? grades[enrollment.id] : enrollment.finalGrade || '';
    
    // Allow saving even if grade is empty (to clear it)
    // Only show error if grade is explicitly undefined (not set)
    if (grades[enrollment.id] === undefined && !enrollment.finalGrade) {
      toast.error('Please select a grade or clear existing grade');
      return;
    }

    const studentId = enrollment.studentId || enrollment.student?.id;

    if (!courseId || !studentId) {
      toast.error('Invalid enrollment data');
      return;
    }

    setSavingGrades(new Set(savingGrades).add(enrollment.id));

    try {
      // Send empty string or null to clear the grade
      const gradeToSave = grade === '' ? null : grade;
      await gradesApi.updateGrade(courseId, studentId, gradeToSave || '');
      
      // Refresh enrollments for this course (preserve current page)
      const currentPage = getCoursePage(courseId);
      await fetchCourseEnrollments(courseId, currentPage);

      const action = grade === '' || grade === null ? 'cleared' : 'saved';
      toast.success(`Grade ${action} for ${enrollment.student?.firstName} ${enrollment.student?.lastName}`);
      
      const newGrades = { ...grades };
      delete newGrades[enrollment.id];
      setGrades(newGrades);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save grade');
      console.error('Error saving grade:', error);
    } finally {
      const newSaving = new Set(savingGrades);
      newSaving.delete(enrollment.id);
      setSavingGrades(newSaving);
    }
  };

  const handleSaveAllGrades = async () => {
    // Collect all changed enrollments from all courses
    const changedEnrollments: Array<{ enrollment: Enrollment; courseId: number }> = [];
    
    courseEnrollments.forEach((data, courseId) => {
      data.enrollments.forEach(enrollment => {
        const grade = grades[enrollment.id];
        // Include if grade is set and different from current (including clearing with empty string)
        if (grade !== undefined && grade !== enrollment.finalGrade) {
          changedEnrollments.push({ enrollment, courseId });
        }
      });
    });

    // Student search mode removed

    if (changedEnrollments.length === 0) {
      toast.info('No grade changes to save');
      return;
    }

    setSavingGrades(new Set(changedEnrollments.map(({ enrollment }) => enrollment.id)));

    try {
      await Promise.all(
        changedEnrollments.map(({ enrollment, courseId }) => {
          const studentId = enrollment.studentId || enrollment.student?.id;
          if (!courseId || !studentId) {
            throw new Error(`Invalid enrollment data for enrollment ${enrollment.id}`);
          }
          // Handle clearing grades (empty string becomes null)
          const gradeToSave = grades[enrollment.id] === '' ? null : grades[enrollment.id];
          return gradesApi.updateGrade(courseId, studentId, gradeToSave || '');
        })
      );

      // Refresh all courses that had changes (preserve current pages)
      const coursesToRefresh = new Set(changedEnrollments.map(({ courseId }) => courseId));
      await Promise.all(Array.from(coursesToRefresh).map(courseId => {
        const currentPage = getCoursePage(courseId);
        return fetchCourseEnrollments(courseId, currentPage);
      }));

      toast.success(`Saved ${changedEnrollments.length} grade(s)`);
      setGrades({});
    } catch (error: any) {
      toast.error(error.message || 'Failed to save grades');
      console.error('Error saving grades:', error);
    } finally {
      setSavingGrades(new Set());
    }
  };

  const changedGradesCount = useMemo(() => {
    let count = 0;
    courseEnrollments.forEach((data) => {
      data.enrollments.forEach(enrollment => {
        const grade = grades[enrollment.id];
        // Count if grade is set and different from current (including clearing with empty string)
        if (grade !== undefined && grade !== enrollment.finalGrade) {
          count++;
        }
      });
    });
    return count;
  }, [courseEnrollments, grades]);

  const getColumns = (courseId?: number): Column<Enrollment>[] => [
    { key: 'studentId', header: 'Student ID', width: '100px', render: (e) => e.student?.id || e.studentId },
    { key: 'name', header: 'Name', width: '180px', render: (e) => `${e.student?.firstName} ${e.student?.lastName}` },
    { 
      key: 'grade', 
      header: 'Grade', 
      width: '120px',
      render: (e) => {
        const currentGrade = grades[e.id] !== undefined ? grades[e.id] : e.finalGrade || '';
        const hasChanges = grades[e.id] !== undefined && grades[e.id] !== e.finalGrade;
        const isSaving = savingGrades.has(e.id);
        const hasGrade = currentGrade !== '';

        return (
          <div className="flex items-center gap-2">
            <Select
              value={currentGrade}
              onValueChange={(value) => handleGradeChange(e.id, value)}
              disabled={isSaving}
            >
              <SelectTrigger className={`w-[100px] ${hasChanges ? 'border-primary' : ''}`}>
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasGrade && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleClearGrade(e.id)}
                disabled={isSaving}
                title="Clear grade"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      }
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      width: '100px', 
      align: 'right',
      render: (e) => {
        const currentGrade = grades[e.id] !== undefined ? grades[e.id] : e.finalGrade || '';
        const hasChanges = grades[e.id] !== undefined && grades[e.id] !== e.finalGrade;
        const isSaving = savingGrades.has(e.id);

        // Allow saving if there are changes (including clearing a grade)
        const canSave = hasChanges && !isSaving;

        return (
          <Button
            size="sm"
            onClick={() => handleSaveGrade(e, courseId)}
            disabled={!canSave}
            variant={hasChanges ? 'default' : 'outline'}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? '...' : 'Save'}
          </Button>
        );
      }
    },
  ];

  if (!canModify) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Grades</h2>
          <p className="text-muted-foreground">View student grades</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You don't have permission to manage grades.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Grades</h2>
          <p className="text-muted-foreground">Manage student grades and assessments</p>
        </div>
        {changedGradesCount > 0 && (
          <Button onClick={handleSaveAllGrades}>
            <Save className="mr-2 h-4 w-4" />
            Save All ({changedGradesCount})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Management</CardTitle>
          <CardDescription>
            {`${coursesPaginationData?.total || 0} course${(coursesPaginationData?.total || 0) !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  const filteredEnrollments = data ? getFilteredEnrollments(data.enrollments) : [];
                  const currentPage = getCoursePage(course.id);
                  const pagination = data?.pagination;
                  
                  return (
                  <CollapsibleCourseSection
                      key={course.id}
                      title={`${course.courseCode} Section ${course.section} - ${course.courseName} - ${course.semester}`}
                      subtitle={data ? `${filteredEnrollments.length} students` : undefined}
                      defaultOpen={false}
                      onFirstExpand={() => fetchCourseEnrollments(course.id)}
                      isLoading={data?.loading}
                  >
                      {data && (
                        <>
                    <DataTable
                            data={filteredEnrollments}
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
