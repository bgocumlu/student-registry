// Core types matching the backend specification

export type UserRole = 'ADMIN' | 'TEACHER' | 'VIEWER';

export type StudentStatus = 'active' | 'graduated' | 'dropped' | 'inactive';
export type CourseStatus = 'active' | 'inactive';

export interface User {
  id: number;
  username: string;
  email: string;
  roleId: number;
  role: UserRole;
  createdBy?: number;
  teacherId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  email: string;
  phone?: string;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  department: string;
  enrollmentYear: number;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  section?: string;
  description?: string;
  credit: number;
  department: string;
  semester: string;
  teacherId: number;
  teacher?: Teacher;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  finalGrade?: string;
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
  updatedAt: string;
  student?: Student;
  course?: Course;
}

export interface Absence {
  id: number;
  studentId: number;
  courseId: number;
  date: string; // Now stores datetime in ISO format (YYYY-MM-DDTHH:mm)
  student?: Student;
  course?: Course;
}

export interface Log {
  id: number;
  userId?: number;
  action: string;
  details: string | object;
  timestamp: string;
  createdAt?: string; // Alias for timestamp
  user?: User;
}

export interface Settings {
  id: number;
  key: string;
  value: string;
}


// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isViewer: boolean;
}
