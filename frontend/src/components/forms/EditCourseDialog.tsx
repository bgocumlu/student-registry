import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { coursesApi } from '@/services/api';
import type { Teacher, Course } from '@/types';

const courseSchema = z.object({
  courseCode: z.string().trim().min(1, 'Course code is required').max(20, 'Course code must be less than 20 characters'),
  courseName: z.string().trim().min(1, 'Course name is required').max(100, 'Course name must be less than 100 characters'),
  section: z.string().trim().min(1, 'Section is required').max(10, 'Section must be less than 10 characters'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
  credit: z.coerce.number().min(0, 'Credit must be at least 0').max(10, 'Credit must be at most 10'),
  department: z.string().trim().min(1, 'Department is required').max(100, 'Department must be less than 100 characters'),
  semester: z.string().trim().min(1, 'Semester is required').max(50, 'Semester must be less than 50 characters'),
  teacherId: z.coerce.number().min(1, 'Teacher is required'),
  status: z.enum(['active', 'inactive']),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface EditCourseDialogProps {
  course: Course;
  teachers: Teacher[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditCourseDialog({ 
  course, 
  teachers, 
  open, 
  onOpenChange,
  onSuccess 
}: EditCourseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseCode: course.courseCode,
      courseName: course.courseName,
      section: course.section || '',
      description: course.description || '',
      credit: course.credit,
      department: course.department,
      semester: course.semester,
      teacherId: course.teacherId || course.teacher?.id || 0,
      status: course.status,
    },
  });

  // Reset form when course changes
  useEffect(() => {
    form.reset({
      courseCode: course.courseCode,
      courseName: course.courseName,
      section: course.section || '',
      description: course.description || '',
      credit: course.credit,
      department: course.department,
      semester: course.semester,
      teacherId: course.teacherId || course.teacher?.id || 0,
      status: course.status,
    });
  }, [course, form]);

  const onSubmit = async (data: CourseFormValues) => {
    setIsSubmitting(true);
    try {
      await coursesApi.update(course.id, {
        courseCode: data.courseCode,
        courseName: data.courseName,
        section: data.section,
        description: data.description || undefined,
        credit: data.credit,
        department: data.department,
        semester: data.semester,
        teacherId: data.teacherId,
        status: data.status,
      });
      
      toast.success('Course updated successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update course');
      console.error('Error updating course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the course information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="courseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section *</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduction to Programming" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Course description..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester *</FormLabel>
                    <FormControl>
                      <Input placeholder="Fall 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => {
                // Get current department from form
                const currentDepartment = form.watch('department');
                
                // Filter teachers by department
                const filteredTeachers = currentDepartment
                  ? teachers.filter(teacher => teacher.department === currentDepartment)
                  : teachers;

                // Reset teacherId if current selection is not in filtered list
                const currentTeacherId = field.value;
                const isCurrentTeacherValid = filteredTeachers.some(t => t.id === currentTeacherId);
                if (currentTeacherId && !isCurrentTeacherValid && filteredTeachers.length > 0) {
                  // Only reset if there are other teachers available
                  field.onChange(0);
                }

                return (
                  <FormItem>
                    <FormLabel>Assigned Teacher *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value, 10))} 
                      value={field.value && isCurrentTeacherValid ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={currentDepartment ? "Select a teacher from " + currentDepartment : "Select a teacher"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredTeachers.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {currentDepartment ? `No teachers found in ${currentDepartment}` : 'No teachers available'}
                          </div>
                        ) : (
                          filteredTeachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.firstName} {teacher.lastName} - {teacher.department}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Course'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
