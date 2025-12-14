import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataTable, Column } from '@/components/DataTable';
import type { Course, Enrollment, Absence, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { coursesApi } from '@/services/api';
import { useServerPagination } from '@/hooks/useServerPagination';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isTeacher } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsPagination, setEnrollmentsPagination] = useState<PaginatedResponse<Enrollment> | null>(null);
  const [absencesPagination, setAbsencesPagination] = useState<PaginatedResponse<Absence> | null>(null);
  const canEdit = isAdmin || isTeacher;

  const enrollmentsPaginationHook = useServerPagination({ initialPage: 1, initialLimit: 10 });
  const absencesPaginationHook = useServerPagination({ initialPage: 1, initialLimit: 10 });

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      try {
        const courseData = await coursesApi.getById(parseInt(courseId));
        setCourse(courseData);
      } catch (error) {
        toast.error('Failed to load course data');
        console.error('Error fetching course data:', error);
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const response = await coursesApi.getEnrollments(parseInt(courseId), {
          page: enrollmentsPaginationHook.paginationParams.page, // Backend expects 1-based pages
          limit: enrollmentsPaginationHook.paginationParams.limit,
        });
        setEnrollments(response.data || []);
        setEnrollmentsPagination(response);
      } catch (error) {
        toast.error('Failed to load enrollments');
        console.error('Error fetching enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [courseId, enrollmentsPaginationHook.paginationParams]);

  useEffect(() => {
    const fetchAbsences = async () => {
      if (!courseId) return;
      
      try {
        const response = await coursesApi.getAbsences(parseInt(courseId), {
          page: absencesPaginationHook.paginationParams.page, // Backend expects 1-based pages
          limit: absencesPaginationHook.paginationParams.limit,
        });
        setAbsences(response.data || []);
        setAbsencesPagination(response);
      } catch (error) {
        toast.error('Failed to load absences');
        console.error('Error fetching absences:', error);
      }
    };

    fetchAbsences();
  }, [courseId, absencesPaginationHook.paginationParams]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading course...</div>;
  }

  if (!course) {
    return <div className="text-center py-8 text-muted-foreground">Course not found</div>;
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Grade distribution data - calculate from all graded enrollments
  // Note: This only shows grades from current page. For complete distribution,
  // we'd need to fetch all enrollments or have backend provide aggregated data.
  const gradeDistribution = [
    { grade: 'A', count: enrollments.filter(e => e.finalGrade === 'A').length },
    { grade: 'A-', count: enrollments.filter(e => e.finalGrade === 'A-').length },
    { grade: 'B+', count: enrollments.filter(e => e.finalGrade === 'B+').length },
    { grade: 'B', count: enrollments.filter(e => e.finalGrade === 'B').length },
    { grade: 'B-', count: enrollments.filter(e => e.finalGrade === 'B-').length },
    { grade: 'C+', count: enrollments.filter(e => e.finalGrade === 'C+').length },
    { grade: 'C', count: enrollments.filter(e => e.finalGrade === 'C').length },
    { grade: 'C-', count: enrollments.filter(e => e.finalGrade === 'C-').length },
    { grade: 'D+', count: enrollments.filter(e => e.finalGrade === 'D+').length },
    { grade: 'D', count: enrollments.filter(e => e.finalGrade === 'D').length },
    { grade: 'F', count: enrollments.filter(e => e.finalGrade === 'F').length },
  ].filter(item => item.count > 0);

  const gradeDistributionPie = gradeDistribution.map(item => ({
    name: item.grade,
    value: item.count
  }));

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A-') return 'bg-success/10 text-success hover:bg-success/20';
    if (grade === 'B+' || grade === 'B' || grade === 'B-') return 'bg-info/10 text-info hover:bg-info/20';
    if (grade === 'C+' || grade === 'C' || grade === 'C-') return 'bg-warning/10 text-warning hover:bg-warning/20';
    return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
  };


  // Get absence count for a student (from current page only)
  // Note: For accurate counts across all pages, we'd need to fetch all absences or have backend provide counts
  const getAbsenceCount = (studentId: number) => {
    return absences.filter(a => a.studentId === studentId).length;
  };

  // Column definitions
  const studentColumns: Column<Enrollment>[] = [
    { key: 'studentId', header: 'Student ID', render: (e) => <span className="font-medium">{e.student?.id}</span> },
    { key: 'name', header: 'Name', render: (e) => (
      <button onClick={() => navigate(`/students/${e.student?.id}`)} className="hover:underline text-primary font-medium">
        {e.student?.firstName} {e.student?.lastName}
      </button>
    )},
    { key: 'email', header: 'Email', render: (e) => e.student?.email },
    { key: 'department', header: 'Department', render: (e) => e.student?.department },
    { key: 'grade', header: 'Grade', render: (e) => {
      // Grades are always read-only in course profile page
      // Grading should be done in the Grades page
      return <span className="text-muted-foreground">{e.finalGrade || '-'}</span>;
    }},
    { key: 'absences', header: 'Absences', align: 'right', render: (e) => {
      const count = e.student?.id ? getAbsenceCount(e.student.id) : 0;
      return <span>{count}</span>;
    }},
  ];

  // Backend should include student data in absences via @ManyToOne relationship
  // Use student from absence if available, otherwise fallback to enrollment lookup
  const absenceColumns: Column<Absence>[] = [
    { key: 'date', header: 'Date', render: (a) => <span className="font-medium">{new Date(a.date).toLocaleDateString()}</span> },
    { key: 'studentId', header: 'Student ID', render: (a) => a.student?.id || a.studentId },
    { key: 'name', header: 'Name', render: (a) => {
      const student = a.student;
      if (!student) {
        // Fallback: try to find student from enrollments
        const enrollment = enrollments.find(e => e.student?.id === a.studentId);
        const fallbackStudent = enrollment?.student;
        if (fallbackStudent) {
          return (
            <button onClick={() => navigate(`/students/${fallbackStudent.id}`)} className="hover:underline text-primary font-medium">
              {fallbackStudent.firstName} {fallbackStudent.lastName}
            </button>
          );
        }
        return <span className="text-muted-foreground">Unknown</span>;
      }
      return (
        <button onClick={() => navigate(`/students/${student.id}`)} className="hover:underline text-primary font-medium">
          {student.firstName} {student.lastName}
        </button>
      );
    }},
    { key: 'department', header: 'Department', render: (a) => a.student?.department || enrollments.find(e => e.student?.id === a.studentId)?.student?.department || '-' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/courses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">
              {course.courseCode} - Section {course.section}
            </h2>
            <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
              {course.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {course.courseName} • {course.semester} • {course.credit} Credits
          </p>
        </div>
      </div>

      <div className={`grid gap-4 ${course.status === 'active' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Enrolled Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollmentsPagination?.total || enrollments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absencesPagination?.total || absences.length}</div>
          </CardContent>
        </Card>
        
        {course.status !== 'active' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const gradeToPoints: Record<string, number> = {
                    'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                    'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
                  };
                  const pointsToGrade: Record<number, string> = {
                    4.0: 'A', 3.7: 'A-', 3.3: 'B+', 3.0: 'B', 2.7: 'B-',
                    2.3: 'C+', 2.0: 'C', 1.7: 'C-', 1.3: 'D+', 1.0: 'D', 0.0: 'F'
                  };
                  
                  const gradedEnrollments = enrollments.filter(e => e.finalGrade);
                  if (gradedEnrollments.length === 0) return 'N/A';
                  
                  const avgPoints = gradedEnrollments.reduce((sum, e) => {
                    return sum + (gradeToPoints[e.finalGrade!] || 0);
                  }, 0) / gradedEnrollments.length;
                  
                  // Find closest grade
                  const closestGrade = Object.entries(pointsToGrade).reduce((closest, [points, grade]) => {
                    const diff = Math.abs(parseFloat(points) - avgPoints);
                    const closestDiff = Math.abs(parseFloat(closest[0]) - avgPoints);
                    return diff < closestDiff ? [points, grade] : closest;
                  }, ['0.0', 'F']);
                  
                  return closestGrade[1];
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Instructor</label>
              <p className="text-base font-medium mt-1">
                {course.teacher?.firstName} {course.teacher?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{course.teacher?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="text-base font-medium mt-1">{course.department}</p>
            </div>
          </div>
          {course.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-base mt-1">{course.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">{canEdit ? 'Students & Grades' : 'Students'}</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
          {course.status !== 'active' && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>
                    {enrollmentsPagination?.total || 0} student{(enrollmentsPagination?.total || 0) !== 1 ? 's' : ''} enrolled
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={enrollments}
                columns={studentColumns}
                keyExtractor={(e) => e.id.toString()}
                emptyMessage="No students enrolled"
                pagination={enrollmentsPagination ? {
                  enabled: true,
                  currentPage: enrollmentsPaginationHook.currentPage,
                  totalPages: enrollmentsPagination.totalPages || 1,
                  onPageChange: enrollmentsPaginationHook.setCurrentPage,
                  getPageNumbers: enrollmentsPaginationHook.getPageNumbers,
                } : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absence Records</CardTitle>
              <CardDescription>
                {absencesPagination?.total || 0} absence record{(absencesPagination?.total || 0) !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={absences}
                columns={absenceColumns}
                keyExtractor={(a) => `${a.studentId}-${a.courseId}-${a.date}`}
                emptyMessage="No absence records found"
                pagination={absencesPagination ? {
                  enabled: true,
                  currentPage: absencesPaginationHook.currentPage,
                  totalPages: absencesPagination.totalPages || 1,
                  onPageChange: absencesPaginationHook.setCurrentPage,
                  getPageNumbers: absencesPaginationHook.getPageNumbers,
                } : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {course.status !== 'active' && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Distribution</CardTitle>
                  <CardDescription>Current grade breakdown for enrolled students</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Proportions</CardTitle>
                  <CardDescription>Percentage distribution of grades</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={gradeDistributionPie}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {gradeDistributionPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
