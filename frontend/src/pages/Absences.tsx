import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSemester } from '@/contexts/SemesterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Trash2, Calendar, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CollapsibleCourseSection } from '@/components/CollapsibleCourseSection';
import { TablePagination } from '@/components/TablePagination';
import { useServerPagination } from '@/hooks/useServerPagination';
import { DataTable, Column } from '@/components/DataTable';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Absence, Student, Course, PaginatedResponse, Enrollment } from '@/types';
import { absencesApi, coursesApi, studentsApi, teachersApi } from '@/services/api';

interface CourseAbsencesData {
  absences: Absence[];
  pagination: PaginatedResponse<Absence> | null;
  loading: boolean;
}

export default function Absences() {
  const { isAdmin, isTeacher, user } = useAuth();
  const { currentSemester } = useSemester();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [loadingEnrolledStudents, setLoadingEnrolledStudents] = useState(false);
  const [coursesPaginationData, setCoursesPaginationData] = useState<PaginatedResponse<Course> | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  
  // Student search removed - only showing courses
  
  // Store absences per course with pagination
  const [courseAbsences, setCourseAbsences] = useState<Map<number, CourseAbsencesData>>(new Map());
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

  // Fetch students for the add absence dialog (only if admin)
  useEffect(() => {
    const fetchStudents = async () => {
      if (isAdmin) {
        try {
          const response = await studentsApi.getAll({ limit: 1000 });
          setStudents(response.data || []);
        } catch (error) {
          console.error('Error fetching students:', error);
          setStudents([]);
        }
      }
    };
    fetchStudents();
  }, [isAdmin]);

  // Fetch only courses (not absences)
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
      // Always send semester parameter using currentSemester
      if (currentSemester) {
        params.semester = currentSemester;
      }
      if (isTeacher && teacherId) {
        params.teacherId = teacherId;
      }
      
      const coursesResponse = await coursesApi.getAll(params);
      setCourses(coursesResponse.data || []);
      setCoursesPaginationData(coursesResponse);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [coursesPaginationHook.paginationParams, currentSemester, isTeacher, teacherId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Student search functionality removed - only showing courses

  // Fetch enrolled students for selected course
  const fetchEnrolledStudents = useCallback(async (courseId: number) => {
    if (!courseId) {
      setEnrolledStudents([]);
      return;
    }

    setLoadingEnrolledStudents(true);
    try {
      // Fetch all enrollments for the course (we'll get all pages)
      const response = await coursesApi.getEnrollments(courseId, {
        page: 1,
        limit: 1000, // Get all enrollments
      });
      
      // Extract students from enrollments
      const students = (response.data || []).map((enrollment: Enrollment) => enrollment.student).filter(Boolean) as Student[];
      setEnrolledStudents(students);
    } catch (error) {
      toast.error('Failed to load enrolled students');
      console.error('Error fetching enrolled students:', error);
      setEnrolledStudents([]);
    } finally {
      setLoadingEnrolledStudents(false);
    }
  }, []);

  // Get current page for a course
  const getCoursePage = useCallback((courseId: number) => {
    return coursePages.get(courseId) || 1;
  }, [coursePages]);

  // Set page for a course
  const setCoursePage = useCallback((courseId: number, page: number) => {
    setCoursePages(prev => new Map(prev).set(courseId, page));
  }, []);

  // Fetch absences for a specific course (lazy loading)
  const fetchCourseAbsences = useCallback(async (courseId: number, page?: number) => {
    const currentPage = page ?? getCoursePage(courseId);
    
    setCourseAbsences(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(courseId) || { absences: [], pagination: null, loading: false };
      newMap.set(courseId, { ...existing, loading: true });
      return newMap;
    });

    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      
      const absencesResponse = await coursesApi.getAbsences(courseId, params);
      
      setCourseAbsences(prev => {
        const newMap = new Map(prev);
        newMap.set(courseId, {
          absences: absencesResponse.data || [],
          pagination: absencesResponse,
          loading: false,
        });
        return newMap;
      });
    } catch (error) {
      toast.error(`Failed to load absences for course`);
      console.error('Error fetching course absences:', error);
      setCourseAbsences(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(courseId) || { absences: [], pagination: null, loading: false };
        newMap.set(courseId, { ...existing, loading: false });
        return newMap;
      });
    }
  }, [getCoursePage]);

  // Filter absences for a course (only by date, no semester filter)
  const getFilteredAbsences = useCallback((absences: Absence[]) => {
    return absences.filter((absence) => {
      const absenceDate = new Date(absence.date);
      const matchesDateFrom = !dateFrom || absenceDate >= dateFrom;
      const matchesDateTo = !dateTo || absenceDate <= new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1);

      return matchesDateFrom && matchesDateTo;
    });
  }, [dateFrom, dateTo]);

  const handleAddAbsence = async () => {
    if (!selectedStudent || !selectedCourse || !selectedDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const student = enrolledStudents.find(s => s.id.toString() === selectedStudent);
    const course = courses.find(c => c.id.toString() === selectedCourse);

    if (!student || !course) {
      toast.error('Invalid student or course selected');
      return;
    }

    try {
      // Convert datetime-local format to ISO date string (YYYY-MM-DD)
      const dateObj = new Date(selectedDate);
      const isoDateString = dateObj.toISOString().split('T')[0];
      
      await absencesApi.addAbsence(course.id, student.id, isoDateString);
      
      // Refresh course absences
      await fetchCourseAbsences(course.id);
      
      setOpen(false);
      setSelectedStudent('');
      setSelectedCourse('');
      setSelectedDate('');
      setEnrolledStudents([]);
      toast.success('Absence recorded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record absence');
    }
  };

  const handleDeleteAbsence = async (absence: Absence, courseId?: number) => {
    if (!absence.courseId || !absence.studentId) {
      toast.error('Invalid absence data');
      return;
    }

    try {
      // Convert date to ISO format (YYYY-MM-DD)
      const dateObj = new Date(absence.date);
      const isoDateString = dateObj.toISOString().split('T')[0];
      
      await absencesApi.removeAbsence(absence.courseId, absence.studentId, isoDateString);
      
      // Refresh course absences
      if (courseId) {
        await fetchCourseAbsences(courseId);
      }
      
      toast.success('Absence deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete absence');
    }
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSelectedStudent(''); // Reset student when course changes
    // Fetch enrolled students for the selected course
    if (value) {
      fetchEnrolledStudents(parseInt(value));
    } else {
      setEnrolledStudents([]);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getColumns = (courseId?: number): Column<Absence>[] => [
    { key: 'studentId', header: 'Student ID', width: '100px', render: (a) => a.student?.id || a.studentId },
    { key: 'name', header: 'Name', width: '160px', render: (a) => `${a.student?.firstName} ${a.student?.lastName}` },
    { 
      key: 'course', 
      header: 'Course', 
      width: '200px', 
      visible: !courseId,
      render: (a) => `${a.course?.courseCode} - ${a.course?.courseName}` 
    },
    { 
      key: 'section', 
      header: 'Section', 
      width: '80px', 
      visible: !courseId,
      render: (a) => a.course?.section 
    },
    { 
      key: 'semester', 
      header: 'Semester', 
      width: '100px', 
      visible: !courseId,
      render: (a) => a.course?.semester 
    },
    { key: 'date', header: 'Date', width: '100px', render: (a) => formatDateTime(a.date).date },
    { key: 'time', header: 'Time', width: '80px', render: (a) => formatDateTime(a.date).time },
    { 
      key: 'actions', 
      header: 'Actions', 
      width: '60px', 
      align: 'right',
      visible: canModify,
      render: (a) => (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => handleDeleteAbsence(a, courseId)}
          title="Delete absence"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    },
  ];

  // Student search removed - getFilteredStudentAbsences no longer needed

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Absences</h2>
          <p className="text-muted-foreground">Track and manage student absences</p>
        </div>
        {canModify && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Absence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Absence</DialogTitle>
                <DialogDescription>
                  Record a new absence for a student.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="course">Course</Label>
                  <Select value={selectedCourse} onValueChange={handleCourseChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course first" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.courseCode} Section {course.section} - {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="student">Student</Label>
                  <Select 
                    value={selectedStudent} 
                    onValueChange={setSelectedStudent}
                    disabled={!selectedCourse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCourse ? "Select student" : "Select a course first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingEnrolledStudents ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading students...</div>
                      ) : enrolledStudents.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No students enrolled in this course</div>
                      ) : (
                        enrolledStudents.map(student => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.id} - {student.firstName} {student.lastName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date & Time</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="datetime-local"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleAddAbsence} className="w-full">
                Record Absence
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Absence Records</CardTitle>
          <CardDescription>
            {`${coursesPaginationData?.total || 0} course${(coursesPaginationData?.total || 0) !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading courses...</div>
          ) : (
            <>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    coursesPaginationHook.setCurrentPage(1);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    coursesPaginationHook.setCurrentPage(1);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="icon" onClick={() => { 
                setDateFrom(undefined); 
                setDateTo(undefined);
                coursesPaginationHook.setCurrentPage(1);
              }} title="Clear date filter">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
              {courses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No courses found</p>
              ) : (
                <>
                  {courses.map((course) => {
                  const data = courseAbsences.get(course.id);
                  const filteredAbsences = data ? getFilteredAbsences(data.absences) : [];
                  const currentPage = getCoursePage(course.id);
                  const pagination = data?.pagination;
                  
                  return (
                    <CollapsibleCourseSection
                      key={course.id}
                      title={`${course.courseCode} Section ${course.section} - ${course.courseName} - ${course.semester}`}
                      subtitle={data ? `${filteredAbsences.length} absences` : undefined}
                      defaultOpen={false}
                      onFirstExpand={() => fetchCourseAbsences(course.id)}
                      isLoading={data?.loading}
                    >
                      {data && (
                        <>
                          <DataTable
                            data={filteredAbsences}
                            columns={getColumns(course.id)}
                            keyExtractor={(a) => `${a.studentId}-${a.courseId}-${a.date}`}
                            emptyMessage="No absences"
                          />
                          {pagination && pagination.totalPages > 1 && (
                            <div className="mt-4">
                              <TablePagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={(page) => {
                                  setCoursePage(course.id, page);
                                  fetchCourseAbsences(course.id, page);
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
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
