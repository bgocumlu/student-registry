import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, FileDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddStudentDialog } from '@/components/forms/AddStudentDialog';
import { EditStudentDialog } from '@/components/forms/EditStudentDialog';
import { DeleteStudentDialog } from '@/components/forms/DeleteStudentDialog';
import { DataTable, Column } from '@/components/DataTable';
import type { Student, PaginatedResponse } from '@/types';
import { studentsApi } from '@/services/api';
import { toast } from 'sonner';
import { useServerPagination } from '@/hooks/useServerPagination';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Students() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  // This page should only be accessible to admins (route protection)
  // But add guard here too to prevent API calls if somehow accessed
  if (!isAdmin) {
    return <div className="text-center py-8 text-muted-foreground">Access denied. Admin only.</div>;
  }
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [paginationData, setPaginationData] = useState<PaginatedResponse<Student> | null>(null);
  
  const pagination = useServerPagination({ initialPage: 1, initialLimit: 10 });

  const fetchStudents = async () => {
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
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await studentsApi.getAll(params);
      setStudents(response.data || []);
      setPaginationData(response);
    } catch (error) {
      toast.error('Failed to load students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [pagination.paginationParams, activeSearchTerm, departmentFilter, statusFilter]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveSearchTerm(searchTerm);
      pagination.setCurrentPage(1);
    }
  };

  // Get unique departments from all students (may need to fetch separately if needed)
  const departments = useMemo(() => {
    // For now, we'll use a static list or fetch separately if needed
    // This could be improved by having a separate endpoint for departments
    return Array.from(new Set(students.map(s => s.department)));
  }, [students]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success border-success/30 hover:bg-success/30 hover:border-success/50 transition-colors';
      case 'graduated':
        return 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 hover:border-primary/50 transition-colors';
      case 'suspended':
        return 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30 hover:border-destructive/50 transition-colors';
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted/80 transition-colors';
    }
  };

  const exportStudentPDF = async (student: Student) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Student Grade Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Student: ${student.firstName} ${student.lastName}`, 14, 35);
    doc.text(`Student ID: ${student.id}`, 14, 42);
    doc.text(`Department: ${student.department}`, 14, 49);
    doc.text(`Status: ${student.status}`, 14, 56);
    
    try {
      const enrollments = await studentsApi.getEnrollments(student.id);
      const grades = enrollments.data?.map(e => [
        e.course?.courseCode || '',
        e.course?.courseName || '',
        e.course?.semester || '',
        e.finalGrade || 'In Progress',
        e.finalGrade ? (e.finalGrade === 'A' ? '4.0' : e.finalGrade === 'A-' ? '3.7' : e.finalGrade === 'B+' ? '3.3' : e.finalGrade === 'B' ? '3.0' : e.finalGrade === 'B-' ? '2.7' : e.finalGrade === 'C+' ? '2.3' : e.finalGrade === 'C' ? '2.0' : e.finalGrade === 'C-' ? '1.7' : e.finalGrade === 'D+' ? '1.3' : e.finalGrade === 'D' ? '1.0' : '0.0') : '-',
      ]) || [];
    
    autoTable(doc, {
      startY: 65,
      head: [['Course Code', 'Course Name', 'Semester', 'Grade', 'GPA']],
        body: grades,
    });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
    
    doc.save(`student_${student.id}_grades.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">Manage student records and enrollments</p>
        </div>
        {isAdmin && <AddStudentDialog onSuccess={fetchStudents} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            {paginationData?.total || 0} student{(paginationData?.total || 0) !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading students...</div>
          ) : (
            <>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, ID or email... (Press Enter to search)"
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
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              pagination.setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            data={students}
            keyExtractor={(student) => student.id}
            pagination={paginationData ? {
              enabled: true,
              currentPage: pagination.currentPage,
              totalPages: paginationData.totalPages || 1,
              onPageChange: pagination.setCurrentPage,
              getPageNumbers: pagination.getPageNumbers,
            } : undefined}
            columns={[
              { 
                key: 'id', 
                header: 'Student ID', 
                width: '100px',
                render: (student) => student.id.toString()
              },
              { 
                key: 'name', 
                header: 'Name', 
                width: '160px',
                render: (student) => (
                  <button 
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="hover:underline text-primary font-medium"
                  >
                    {student.firstName} {student.lastName}
                  </button>
                )
              },
              { key: 'email', header: 'Email', width: '180px', accessor: 'email' },
              { key: 'department', header: 'Department', width: '160px', accessor: 'department' },
              { key: 'year', header: 'Year', width: '60px', accessor: 'enrollmentYear' },
              { 
                key: 'status', 
                header: 'Status', 
                width: '80px',
                render: (student) => (
                  <Badge className={getStatusColor(student.status)}>
                    {student.status}
                  </Badge>
                )
              },
              { 
                key: 'actions', 
                header: 'Actions', 
                width: '120px',
                align: 'right',
                render: (student) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => exportStudentPDF(student)}
                      title="Export grades PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingStudent(student)}
                          title="Edit student"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeletingStudent(student)}
                          title="Delete student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )
              },
            ] as Column<Student>[]}
          />
          </>
          )}
        </CardContent>
      </Card>

      {editingStudent && (
        <EditStudentDialog 
          student={editingStudent} 
          open={!!editingStudent} 
          onOpenChange={(open) => !open && setEditingStudent(null)} 
          onSuccess={fetchStudents}
        />
      )}

      {deletingStudent && (
        <DeleteStudentDialog 
          student={deletingStudent} 
          open={!!deletingStudent} 
          onOpenChange={(open) => !open && setDeletingStudent(null)} 
          onSuccess={fetchStudents}
        />
      )}
    </div>
  );
}
