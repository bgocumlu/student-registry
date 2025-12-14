import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { enrollmentsApi, studentsApi, coursesApi } from '@/services/api';
import type { Student, Course } from '@/types';

const enrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  courseId: z.string().min(1, 'Course is required'),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface EnrollStudentDialogProps {
  onSuccess?: () => void;
}

export function EnrollStudentDialog({ onSuccess }: EnrollStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      studentId: '',
      courseId: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchCourses();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await studentsApi.getAll({ status: 'active', limit: 1000 });
      setStudents(response.data || []);
    } catch (error) {
      toast.error('Failed to load students');
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await coursesApi.getAll({ status: 'active', limit: 1000 });
      setCourses(response.data || []);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const onSubmit = async (data: EnrollmentFormData) => {
    try {
      setIsSubmitting(true);
      await enrollmentsApi.enroll(parseInt(data.studentId), parseInt(data.courseId));
      toast.success('Student enrolled successfully');
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll student');
      console.error('Error enrolling student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Enroll Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll Student in Course</DialogTitle>
          <DialogDescription>Select a student and course to create an enrollment.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingStudents}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingStudents ? "Loading students..." : "Select a student"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName} (ID: {student.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loadingCourses}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.courseCode} - Section {course.section} - {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingStudents || loadingCourses}>
                {isSubmitting ? 'Enrolling...' : 'Enroll'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
