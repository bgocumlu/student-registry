import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSemester } from '@/contexts/SemesterContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Calendar, ClipboardList, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentsApi, coursesApi, teachersApi, enrollmentsApi, absencesApi, logsApi } from '@/services/api';
import { toast } from 'sonner';
import type { Log } from '@/types';

export default function Dashboard() {
  const { user, isAdmin, isTeacher, isViewer } = useAuth();
  const { currentSemester } = useSemester();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        if (isAdmin) {
          // Admin stats - only fetch if admin
          try {
            const promises: Promise<any>[] = [];
            
            // Fetch students count
            promises.push(
              studentsApi.getAll({ status: 'active', limit: 1 })
                .catch((error: any) => {
                  if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                    console.warn('No permission to fetch students');
                    return { total: 0, data: [] };
                  }
                  throw error;
                })
            );
            
            // Fetch courses count
            promises.push(
              coursesApi.getAll({ semester: currentSemester, limit: 1 })
                .catch((error: any) => {
                  if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                    console.warn('No permission to fetch courses');
                    return { total: 0, data: [] };
                  }
                  throw error;
                })
            );
            
            // Fetch teachers count
            promises.push(
              teachersApi.getAll({ limit: 1 })
                .catch((error: any) => {
                  if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                    console.warn('No permission to fetch teachers');
                    return { total: 0, data: [] };
                  }
                  throw error;
                })
            );
            
            // Fetch enrollments count
            promises.push(
              studentsApi.getAll({ status: 'active', limit: 1 })
                .then(() => ({ total: 0 })) // We'll calculate from enrollments if needed
                .catch(() => ({ total: 0 }))
            );
            
            const [studentsRes, coursesRes, teachersRes] = await Promise.all(promises);
          
          setStats([
            {
              title: 'Total Students',
              value: studentsRes?.total?.toLocaleString() || '0',
              icon: GraduationCap,
              description: 'Active students',
              color: 'text-primary',
            },
            {
              title: 'Active Courses',
              value: coursesRes?.total?.toLocaleString() || '0',
              icon: BookOpen,
              description: 'This semester',
              color: 'text-success',
            },
            {
              title: 'Total Teachers',
              value: teachersRes?.total?.toLocaleString() || '0',
              icon: Users,
              description: 'Faculty members',
              color: 'text-info',
            },
            {
              title: 'Current Semester',
              value: currentSemester || 'Not set',
              icon: Calendar,
              description: 'Active semester',
              color: 'text-warning',
            },
          ]);
          
          // Fetch recent logs for admin (only 2)
          try {
            const logsRes = await logsApi.getAll({ limit: 2 });
            setRecentLogs((logsRes.data || []).slice(0, 2));
          } catch (error) {
            console.warn('Failed to fetch recent logs:', error);
            setRecentLogs([]);
          }
          
          } catch (error: any) {
            console.error('Error fetching admin dashboard stats:', error);
            setStats([
              {
                title: 'Total Students',
                value: '0',
                icon: GraduationCap,
                description: 'Unable to load',
                color: 'text-muted',
              },
              {
                title: 'Active Courses',
                value: '0',
                icon: BookOpen,
                description: 'Unable to load',
                color: 'text-muted',
              },
              {
                title: 'Total Teachers',
                value: '0',
                icon: Users,
                description: 'Unable to load',
                color: 'text-muted',
              },
              {
                title: 'Current Semester',
                value: currentSemester || 'Not set',
                icon: Calendar,
                description: 'Active semester',
                color: 'text-warning',
              },
            ]);
            setRecentLogs([]);
          }
        } else if (isTeacher && user) {
          // Teacher stats - only fetch their courses
          // Wait for teacherId to be loaded before making the API call
          if (!teacherId) {
            setLoading(false);
            return;
          }
          try {
            const params: any = {
              semester: currentSemester,
              limit: 100,
              teacherId: teacherId
            };
            const coursesRes = await coursesApi.getAll(params);
            
            const myCourses = coursesRes.data || [];
            let totalStudents = 0;
            let pendingGrades = 0;
            
            // Count unique students and pending grades across all courses
            const studentIds = new Set<number>();
            for (const course of myCourses.slice(0, 10)) { // Limit to first 10 courses
              try {
                const enrollmentsRes = await coursesApi.getEnrollments(course.id, { limit: 100 });
                const enrollments = enrollmentsRes.data || [];
                
                enrollments.forEach((e: any) => {
                  if (e.student?.id) {
                    studentIds.add(e.student.id);
                  }
                  if (!e.finalGrade) {
                    pendingGrades++;
                  }
                });
              } catch (e) {
                // Skip if error
                console.warn('Failed to fetch enrollments for course:', course.id, e);
              }
            }
            
            totalStudents = studentIds.size;
            
            setStats([
              {
                title: 'My Courses',
                value: myCourses.length.toString(),
                icon: BookOpen,
                description: 'Courses assigned to you',
                color: 'text-primary',
              },
              {
                title: 'My Students',
                value: totalStudents.toString(),
                icon: GraduationCap,
                description: 'Enrolled in your courses',
                color: 'text-info',
              },
              {
                title: 'Pending Grades',
                value: pendingGrades.toString(),
                icon: ClipboardList,
                description: 'Students awaiting grades',
                color: 'text-success',
              },
              {
                title: 'Current Semester',
                value: currentSemester || 'Not set',
                icon: Calendar,
                description: 'Active semester',
                color: 'text-warning',
              },
            ]);
            
            // Fetch recent logs for teacher (filtered by their user ID, only 2)
            try {
              const logsRes = await logsApi.getAll({ userId: user.id, limit: 2 });
              setRecentLogs((logsRes.data || []).slice(0, 2));
            } catch (error) {
              console.warn('Failed to fetch recent logs:', error);
              setRecentLogs([]);
            }
          } catch (error: any) {
            console.error('Error fetching teacher dashboard stats:', error);
            toast.error('Failed to load dashboard statistics');
            setStats([
              {
                title: 'My Courses',
                value: '0',
                icon: BookOpen,
                description: 'Unable to load',
                color: 'text-muted',
              },
              {
                title: 'My Students',
                value: '0',
                icon: GraduationCap,
                description: 'Unable to load',
                color: 'text-muted',
              },
              {
                title: 'Pending Grades',
                value: '0',
                icon: ClipboardList,
                description: 'Unable to load',
                color: 'text-muted',
              },
              {
                title: 'Current Semester',
                value: currentSemester || 'Not set',
                icon: Calendar,
                description: 'Active semester',
                color: 'text-warning',
              },
            ]);
            setRecentLogs([]);
          }
        } else {
          // Viewer or fallback
          setStats([]);
          setRecentLogs([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, isTeacher, user, currentSemester, teacherId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.username}!
        </h2>
        <p className="text-muted-foreground mt-1">
          {isAdmin && 'You have full administrative access to the system.'}
          {isTeacher && 'Manage your courses, grades, and attendance.'}
          {isViewer && 'View all system data in read-only mode.'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading statistics...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isAdmin && (
              <>
                <Link to="/students" className="block">
                  <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="font-medium">Add New Student</div>
                    <div className="text-sm text-muted-foreground">Register a new student</div>
                  </div>
                </Link>
                <Link to="/courses" className="block">
                  <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="font-medium">Create Course</div>
                    <div className="text-sm text-muted-foreground">Set up a new course</div>
                  </div>
                </Link>
              </>
            )}
            {isTeacher && (
              <>
                <Link to="/absences" className="block">
                  <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="font-medium">Record Absence</div>
                    <div className="text-sm text-muted-foreground">Mark absences for your courses</div>
                  </div>
                </Link>
                <Link to="/grades" className="block">
                  <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="font-medium">Enter Grades</div>
                    <div className="text-sm text-muted-foreground">Update student grades</div>
                  </div>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity. Check the Logs page for detailed activity history.
              </p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.user?.username || 'System'} • {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}
                      </p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {typeof log.details === 'string' 
                            ? log.details 
                            : typeof log.details === 'object' 
                              ? JSON.stringify(log.details)
                              : String(log.details)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(isAdmin || isTeacher) && (
                  <Link to="/logs" className="block text-center text-sm text-primary hover:underline pt-2">
                    View all logs →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
