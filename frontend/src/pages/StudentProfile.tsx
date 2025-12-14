import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Mail, Phone, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { DataTable, Column } from '@/components/DataTable';
import type { Student, Enrollment, Absence, PaginatedResponse } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { studentsApi } from '@/services/api';
import { useServerPagination } from '@/hooks/useServerPagination';
import { useSemester } from '@/contexts/SemesterContext';

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { currentSemester } = useSemester();
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentsPagination, setEnrollmentsPagination] = useState<PaginatedResponse<Enrollment> | null>(null);
  const [absencesPagination, setAbsencesPagination] = useState<PaginatedResponse<Absence> | null>(null);

  const enrollmentsPaginationHook = useServerPagination({ initialPage: 1, initialLimit: 10 });
  const absencesPaginationHook = useServerPagination({ initialPage: 1, initialLimit: 10 });

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        // studentId from URL is actually the primary key id
        const studentIdNum = parseInt(studentId, 10);
        if (isNaN(studentIdNum)) {
          toast.error('Invalid student ID');
          return;
        }
        
        const fetchedStudent = await studentsApi.getById(studentIdNum);
        setStudent(fetchedStudent);
      } catch (error: any) {
        // Handle 403 gracefully - teachers might not have access
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          toast.error('You do not have permission to view student details');
        } else if (error.status === 404) {
          toast.error('Student not found');
        } else {
          toast.error('Failed to load student data');
        }
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!student?.id) return;
      
      try {
        const response = await studentsApi.getEnrollments(student.id, {
          page: enrollmentsPaginationHook.paginationParams.page, // Backend expects 1-based pages
          limit: enrollmentsPaginationHook.paginationParams.limit,
        });
        setEnrollments(response.data || []);
        setEnrollmentsPagination(response);
      } catch (error) {
        toast.error('Failed to load enrollments');
        console.error('Error fetching enrollments:', error);
      }
    };

    fetchEnrollments();
  }, [student?.id, enrollmentsPaginationHook.paginationParams]);

  useEffect(() => {
    const fetchAbsences = async () => {
      if (!student?.id) return;
      
      try {
        const response = await studentsApi.getAbsences(student.id, {
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
  }, [student?.id, absencesPaginationHook.paginationParams]);

  // Constants and memoized values - must be before any early returns
  const gradeToPoints: Record<string, number> = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'F': 0.0,
  };

  // Use enrollment status field only - don't infer from grades
  // Status should only be set manually, not automatically based on grades
  const activeEnrollments = useMemo(() => {
    return enrollments.filter(e => {
      // Only use enrollment.status field if available
      if (e.status) {
        return e.status === 'active';
      }
      // Default to active - status should be set manually
      return true;
    });
  }, [enrollments]);

  const completedEnrollments = useMemo(() => {
    return enrollments.filter(e => {
      // Only use enrollment.status field if available
      if (e.status) {
        return e.status === 'completed';
      }
      // Default to not completed - status should be set manually
      return false;
    });
  }, [enrollments]);

  // Early returns must come AFTER all hooks
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading student...</div>;
  }

  if (!student) {
    return <div className="text-center py-8 text-muted-foreground">Student not found</div>;
  }

  const calculateGPA = () => {
    // Calculate GPA based on enrollments with grades (regardless of status)
    const enrollmentsWithGrades = enrollments.filter(e => e.finalGrade && e.course);
    
    if (enrollmentsWithGrades.length === 0) return '0.00';
    
    let totalPoints = 0;
    let totalCredits = 0;

    enrollmentsWithGrades.forEach(enrollment => {
      if (enrollment.finalGrade && enrollment.course) {
        const points = gradeToPoints[enrollment.finalGrade] || 0;
        const credits = enrollment.course.credit || 0;
        totalPoints += points * credits;
        totalCredits += credits;
      }
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success hover:bg-success/20';
      case 'graduated':
        return 'bg-info/10 text-info hover:bg-info/20';
      case 'inactive':
        return 'bg-muted/10 text-muted-foreground hover:bg-muted/20';
      case 'dropped':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default:
        return '';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A-') return 'bg-success/10 text-success hover:bg-success/20';
    if (grade === 'B+' || grade === 'B' || grade === 'B-') return 'bg-info/10 text-info hover:bg-info/20';
    if (grade === 'C+' || grade === 'C' || grade === 'C-') return 'bg-warning/10 text-warning hover:bg-warning/20';
    return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
  };

  const downloadTranscript = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Official Academic Transcript', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);
    
    // Student Information
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Student Information', 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Student ID: ${student.id}`, 14, 48);
    doc.text(`Name: ${student.firstName} ${student.lastName}`, 14, 54);
    doc.text(`Department: ${student.department}`, 14, 60);
    doc.text(`Enrollment Year: ${student.enrollmentYear}`, 14, 66);
    doc.text(`Status: ${student.status.toUpperCase()}`, 14, 72);
    
    // Academic Record
    doc.setFontSize(14);
    doc.text('Academic Record', 14, 85);
    
    const enrollmentsWithGrades = enrollments.filter(e => e.finalGrade && e.course);
    const tableData = enrollmentsWithGrades.map(enrollment => [
      enrollment.course?.courseCode || '',
      enrollment.course?.courseName || '',
      enrollment.course?.credit.toString() || '',
      enrollment.course?.semester || '',
      enrollment.finalGrade || '',
      (gradeToPoints[enrollment.finalGrade || ''] * (enrollment.course?.credit || 0)).toFixed(2),
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['Course Code', 'Course Name', 'Credits', 'Semester', 'Grade', 'Points']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // GPA Summary
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    doc.setFontSize(12);
    doc.text(`Cumulative GPA: ${calculateGPA()}`, 14, finalY + 15);
    doc.text(`Total Credits with Grades: ${enrollmentsWithGrades.reduce((sum, e) => sum + (e.course?.credit || 0), 0)}`, 14, finalY + 22);
    
    // Absence Records
    doc.setFontSize(14);
    doc.text('Absence Records', 14, finalY + 35);
    
    const absenceData = absences.map(absence => [
      `${new Date(absence.date).toLocaleDateString()} ${new Date(absence.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      absence.course?.courseCode || '',
      absence.course?.courseName || '',
      absence.course?.semester || '',
    ]);
    
    autoTable(doc, {
      startY: finalY + 40,
      head: [['Date & Time', 'Course Code', 'Course Name', 'Semester']],
      body: absenceData,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] },
    });
    
    const absenceFinalY = (doc as any).lastAutoTable.finalY || finalY + 40;
    doc.setFontSize(12);
    doc.text(`Total Absences: ${absences.length}`, 14, absenceFinalY + 10);
    
    doc.save(`student_${student.id}_transcript.pdf`);
    toast.success('Transcript downloaded successfully');
  };

  // Column definitions for tables
  const activeEnrollmentColumns: Column<Enrollment>[] = [
    { key: 'courseCode', header: 'Course Code', render: (e) => <span className="font-medium">{e.course?.courseCode}</span> },
    { key: 'courseName', header: 'Course Name', render: (e) => e.course?.courseName },
    { key: 'section', header: 'Section', render: (e) => e.course?.section || '-' },
    { key: 'credits', header: 'Credits', render: (e) => e.course?.credit },
    { key: 'semester', header: 'Semester', render: (e) => e.course?.semester },
    { key: 'status', header: 'Status', render: () => <Badge className="bg-info/10 text-info hover:bg-info/20">In Progress</Badge> },
  ];

  const completedEnrollmentColumns: Column<Enrollment>[] = [
    { key: 'courseCode', header: 'Course Code', render: (e) => <span className="font-medium">{e.course?.courseCode}</span> },
    { key: 'courseName', header: 'Course Name', render: (e) => e.course?.courseName },
    { key: 'credits', header: 'Credits', render: (e) => e.course?.credit },
    { key: 'semester', header: 'Semester', render: (e) => e.course?.semester },
    { key: 'grade', header: 'Grade', render: (e) => <Badge className={getGradeColor(e.finalGrade || '')}>{e.finalGrade}</Badge> },
  ];

  const gradeColumns: Column<Enrollment>[] = [
    { key: 'courseCode', header: 'Course Code', render: (e) => <span className="font-medium">{e.course?.courseCode}</span> },
    { key: 'courseName', header: 'Course Name', render: (e) => e.course?.courseName },
    { key: 'credits', header: 'Credits', render: (e) => e.course?.credit },
    { key: 'semester', header: 'Semester', render: (e) => e.course?.semester },
    { key: 'grade', header: 'Grade', render: (e) => <Badge className={getGradeColor(e.finalGrade || '')}>{e.finalGrade}</Badge> },
    { key: 'points', header: 'Grade Points', align: 'right', render: (e) => {
      const gradePoints = e.finalGrade ? (gradeToPoints[e.finalGrade] * (e.course?.credit || 0)).toFixed(2) : '0.00';
      return <span className="font-medium">{gradePoints}</span>;
    }},
  ];

  const absenceColumns: Column<Absence>[] = [
    { key: 'dateTime', header: 'Date & Time', render: (a) => (
      <span className="font-medium">
        {new Date(a.date).toLocaleDateString()} {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    )},
    { key: 'courseCode', header: 'Course Code', render: (a) => a.course?.courseCode },
    { key: 'courseName', header: 'Course Name', render: (a) => a.course?.courseName },
    { key: 'semester', header: 'Semester', render: (a) => a.course?.semester },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Student Profile</h2>
          <p className="text-muted-foreground">View detailed student information and academic records</p>
        </div>
        <Button onClick={downloadTranscript}>
          <Download className="h-4 w-4 mr-2" />
          Download Transcript
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calculateGPA()}</div>
            <p className="text-sm text-muted-foreground mt-1">Cumulative</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Credits Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {enrollments.filter(e => e.finalGrade && e.course).reduce((sum, e) => sum + (e.course?.credit || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total with grades</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Absences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{absencesPagination?.total || absences.length}</div>
            <p className="text-sm text-muted-foreground mt-1">This academic year</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="grades">Grades & GPA</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Student details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                    <p className="text-base font-medium">{student.id}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-base font-medium">{student.firstName} {student.lastName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{student.dateOfBirth}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-base">{student.gender}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{student.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{student.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-base">{student.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 grid gap-6 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <div className="flex items-center gap-2 mt-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base font-medium">{student.department}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Enrollment Year</label>
                  <p className="text-base font-medium mt-1">{student.enrollmentYear}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(student.status)}>
                      {student.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Enrollments</CardTitle>
              <CardDescription>Active courses for current semester ({currentSemester})</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={activeEnrollments}
                columns={activeEnrollmentColumns}
                keyExtractor={(e) => e.id.toString()}
                emptyMessage="No active enrollments"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment History</CardTitle>
              <CardDescription>Previously completed courses with grades</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={completedEnrollments}
                columns={completedEnrollmentColumns}
                keyExtractor={(e) => e.id.toString()}
                emptyMessage="No completed enrollments"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Enrollments</CardTitle>
              <CardDescription>Complete enrollment history with pagination</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={enrollments}
                columns={activeEnrollmentColumns}
                keyExtractor={(e) => e.id.toString()}
                emptyMessage="No enrollments found"
                pagination={enrollmentsPagination ? {
                  enabled: true,
                  currentPage: enrollmentsPaginationHook.currentPage,
                  totalPages: enrollmentsPagination.totalPages || 1,
                  onPageChange: (page) => {
                    enrollmentsPaginationHook.setCurrentPage(page);
                  },
                  getPageNumbers: () => {
                    const total = enrollmentsPagination.totalPages || 1;
                    const current = enrollmentsPaginationHook.currentPage;
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
                  },
                } : undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Report</CardTitle>
              <CardDescription>Complete grade history with GPA calculation</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={enrollments.filter(e => e.finalGrade && e.course)}
                columns={gradeColumns}
                keyExtractor={(e) => e.id.toString()}
                emptyMessage="No grades available"
              />

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-2xl font-bold">
                      {enrollments.filter(e => e.finalGrade && e.course).reduce((sum, e) => sum + (e.course?.credit || 0), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Courses with Grades</p>
                    <p className="text-2xl font-bold">{enrollments.filter(e => e.finalGrade).length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cumulative GPA</p>
                    <p className="text-2xl font-bold">{calculateGPA()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absence Records</CardTitle>
              <CardDescription>Complete absence history across all courses</CardDescription>
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
                  onPageChange: (page) => {
                    absencesPaginationHook.setCurrentPage(page);
                  },
                  getPageNumbers: () => {
                    const total = absencesPagination.totalPages || 1;
                    const current = absencesPaginationHook.currentPage;
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
                  },
                } : undefined}
              />

              {absencesPagination && absencesPagination.total > 0 && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Absences</p>
                    <p className="text-2xl font-bold">{absencesPagination.total}</p>
                  </div>
                  {absencesPagination.total > 5 && (
                    <Badge variant="destructive">High Absence Rate</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
