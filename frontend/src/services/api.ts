// API Service Layer - Easy to connect to your backend
// Replace BASE_URL and implement actual HTTP calls

import type {
  User,
  Student,
  Teacher,
  Course,
  Enrollment,
  Absence,
  Log,
  Settings,
  LoginCredentials,
  AuthResponse,
  PaginationParams,
  PaginatedResponse,
} from '@/types';

// TODO: Replace with your actual backend URL
const BASE_URL = '/api';

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Helper function for API calls - customize as needed
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  // Create a cache key for GET requests to prevent duplicates
  // The endpoint already includes query params from buildQuery, so use the full endpoint as key
  const isGetRequest = !options?.method || options.method === 'GET';
  const cacheKey = isGetRequest ? `GET:${endpoint}` : null;
  
  // If this is a duplicate GET request, return the pending promise
  if (cacheKey && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }
  
  const requestPromise = (async () => {
    try {
      // Get token fresh for each request (in case it was updated)
      const currentToken = localStorage.getItem('auth_token');
      
      if (!currentToken) {
        console.warn(`No auth token found for request to ${endpoint}`);
        throw new Error('Not authenticated. Please log in again.');
      }
      
      // Debug: Log token info for POST/PUT/DELETE requests to /users
      if ((endpoint.includes('/users') && options?.method && options.method !== 'GET') || 
          (endpoint === '/users' && (!options?.method || options.method === 'POST'))) {
        try {
          // Try to decode JWT to check role (basic check, not full validation)
          const tokenParts = currentToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token payload:', { username: payload.sub, role: payload.role, exp: payload.exp });
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              console.warn('Token appears to be expired');
            }
          }
        } catch (e) {
          console.warn('Could not decode token for debugging:', e);
        }
      }
      
      // Merge headers properly - ensure Authorization is always included if token exists
      // First spread any existing headers from options, then add our defaults, then add Authorization last
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
      };
      
      // Create fetch options without headers, then add our merged headers
      // This prevents options.headers from overriding our merged headers
      const { headers: _, ...restOptions } = options || {};
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...restOptions,
        headers,
      });

      if (!response.ok) {
        // For 403 errors, provide more context
        if (response.status === 403) {
          const errorText = await response.text();
          let errorMessage = 'Access forbidden. You do not have permission to access this resource.';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // Use default message
          }
          // Add helpful suggestion for 403 errors
          if (endpoint.includes('/users') && endpoint.includes('POST')) {
            errorMessage += ' Make sure you are logged in as an ADMIN. If you recently changed roles, please log out and log back in.';
          }
          const error = new Error(errorMessage);
          (error as any).status = 403;
          throw error;
        }
        
        const errorText = await response.text();
        let errorMessage = `API Error (${response.status}): ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // If not JSON, use the text or status text
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      // Handle empty responses (204 No Content, or 200 OK with no body)
      if (response.status === 204 || contentLength === '0' || 
          (contentType && !contentType.includes('application/json'))) {
        return undefined as T;
      }
      
      // Try to get text first to check if it's empty
      const text = await response.text();
      
      // If response body is empty, return undefined
      if (!text || text.trim() === '') {
        return undefined as T;
      }
      
      // Parse JSON only if we have content
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // If it's not valid JSON, return the text as-is (for text responses)
        return text as T;
      }
      
      // Handle Spring Page format (has 'content' field) and convert to PaginatedResponse format
      if (data && typeof data === 'object' && 'content' in data && 'totalElements' in data) {
        // Convert Spring Page to PaginatedResponse format
        return {
          data: data.content,
          total: data.totalElements,
          totalPages: data.totalPages,
          currentPage: (data.number || 0) + 1, // Convert 0-based to 1-based
          limit: data.size || data.content.length,
        } as T;
      }
      
      return data;
    } catch (error) {
      // Re-throw error but still clean up cache
      throw error;
    } finally {
      // Remove from pending requests after completion (with small delay for rapid re-requests)
      if (cacheKey) {
        setTimeout(() => {
          pendingRequests.delete(cacheKey);
        }, 50);
      }
    }
  })();
  
  // Store pending request for deduplication
  if (cacheKey) {
    pendingRequests.set(cacheKey, requestPromise);
  }
  
  return requestPromise;
}

// Helper to build query string with pagination
function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  return new URLSearchParams(filtered as any).toString();
}

// ============= AUTHENTICATION =============

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Don't use apiCall for login - it adds Authorization header which we don't want
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the text or status text
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    // Map roleName to role for frontend compatibility
    if (data.user && data.user.roleName) {
      data.user = {
        ...data.user,
        role: data.user.roleName,
      };
    }
    return data as AuthResponse;
  },

  logout: (): Promise<void> =>
    apiCall('/auth/logout', { method: 'POST' }),

  getMe: async (): Promise<User> => {
    const response = await apiCall<any>('/auth/me');
    // Map roleName to role for frontend compatibility
    return {
      ...response,
      role: response.roleName || response.role,
    } as User;
  },

  changePassword: (oldPassword: string, newPassword: string): Promise<void> =>
    apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

// ============= STUDENTS =============

export const studentsApi = {
  getAll: (params?: {
    name?: string;
    department?: string;
    enrollmentYear?: number;
    status?: string;
  } & PaginationParams): Promise<PaginatedResponse<Student>> => {
    const query = buildQuery(params);
    return apiCall(`/students${query ? `?${query}` : ''}`);
  },

  getById: (id: number): Promise<Student> =>
    apiCall(`/students/${id}`),

  create: (student: Partial<Student>): Promise<Student> =>
    apiCall('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    }),

  update: (id: number, student: Partial<Student>): Promise<Student> =>
    apiCall(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    }),

  delete: (id: number): Promise<void> =>
    apiCall(`/students/${id}`, { method: 'DELETE' }),

  getEnrollments: (id: number, params?: PaginationParams): Promise<PaginatedResponse<Enrollment>> => {
    const query = buildQuery(params);
    return apiCall(`/students/${id}/enrollments${query ? `?${query}` : ''}`);
  },

  getAbsences: (id: number, params?: PaginationParams): Promise<PaginatedResponse<Absence>> => {
    const query = buildQuery(params);
    return apiCall(`/students/${id}/absences${query ? `?${query}` : ''}`);
  },
};

// ============= TEACHERS =============

export const teachersApi = {
  getAll: (params?: { 
    name?: string; 
    department?: string;
  } & PaginationParams): Promise<PaginatedResponse<Teacher>> => {
    const query = buildQuery(params);
    return apiCall(`/teachers${query ? `?${query}` : ''}`);
  },

  getById: (id: number): Promise<Teacher> =>
    apiCall(`/teachers/${id}`),

  create: (teacher: Partial<Teacher>): Promise<Teacher> =>
    apiCall('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher),
    }),

  update: (id: number, teacher: Partial<Teacher>): Promise<Teacher> =>
    apiCall(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacher),
    }),

  delete: (id: number): Promise<void> =>
    apiCall(`/teachers/${id}`, { method: 'DELETE' }),

  assignUser: (id: number, userId: number): Promise<void> =>
    apiCall(`/teachers/${id}/assign-user`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  revokeUser: (id: number): Promise<void> =>
    apiCall(`/teachers/${id}/revoke-user`, { method: 'DELETE' }),
};

// ============= COURSES =============

export const coursesApi = {
  getAll: (params?: {
    name?: string;
    department?: string;
    semester?: string;
    teacherId?: number;
  } & PaginationParams): Promise<PaginatedResponse<Course>> => {
    const query = buildQuery(params);
    return apiCall(`/courses${query ? `?${query}` : ''}`);
  },

  getById: (id: number): Promise<Course> =>
    apiCall(`/courses/${id}`),

  create: (course: Partial<Course>): Promise<Course> =>
    apiCall('/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    }),

  update: (id: number, course: Partial<Course>): Promise<Course> =>
    apiCall(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(course),
    }),

  delete: (id: number): Promise<void> =>
    apiCall(`/courses/${id}`, { method: 'DELETE' }),

  getEnrollments: (id: number, params?: PaginationParams): Promise<PaginatedResponse<Enrollment>> => {
    const query = buildQuery(params);
    return apiCall(`/courses/${id}/enrollments${query ? `?${query}` : ''}`);
  },

  getAbsences: (id: number, params?: PaginationParams): Promise<PaginatedResponse<Absence>> => {
    const query = buildQuery(params);
    return apiCall(`/courses/${id}/absences${query ? `?${query}` : ''}`);
  },
};

// ============= ENROLLMENTS =============

export const enrollmentsApi = {
  enroll: (studentId: number, courseId: number): Promise<void> =>
    apiCall('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId }),
    }),

  remove: (studentId: number, courseId: number): Promise<void> =>
    apiCall('/enrollments', {
      method: 'DELETE',
      body: JSON.stringify({ studentId, courseId }),
    }),
};

// ============= GRADES =============

export const gradesApi = {
  updateGrade: (courseId: number, studentId: number, finalGrade: string | null): Promise<void> =>
    apiCall(`/courses/${courseId}/students/${studentId}/grade`, {
      method: 'PUT',
      body: JSON.stringify({ finalGrade: finalGrade || null }),
    }),
};

// ============= ABSENCES =============

export const absencesApi = {
  addAbsence: (courseId: number, studentId: number, date: string): Promise<void> =>
    apiCall(`/courses/${courseId}/absences`, {
      method: 'POST',
      body: JSON.stringify({ studentId, date }),
    }),

  removeAbsence: (courseId: number, studentId: number, date: string): Promise<void> =>
    apiCall(`/courses/${courseId}/absences`, {
      method: 'DELETE',
      body: JSON.stringify({ studentId, date }),
    }),
};

// ============= LOGS =============

export const logsApi = {
  getAll: (params?: {
    action?: string;
    userId?: number;
    courseId?: number;
    studentId?: number;
    dateFrom?: string;
    dateTo?: string;
  } & PaginationParams): Promise<PaginatedResponse<Log>> => {
    const query = buildQuery(params);
    return apiCall(`/logs${query ? `?${query}` : ''}`);
  },
};

// ============= SETTINGS =============

export const settingsApi = {
  getCurrentSemester: (): Promise<Settings> =>
    apiCall('/settings/current-semester'),

  setCurrentSemester: (semester: string): Promise<void> =>
    apiCall('/settings/current-semester', {
      method: 'PUT',
      body: JSON.stringify({ semester }),
    }),
};

// ============= ROLES =============

export const rolesApi = {
  getAll: (): Promise<Array<{ id: number; name: string }>> =>
    apiCall('/roles'),

  getByName: async (name: string): Promise<{ id: number; name: string }> => {
    const response = await apiCall<any>(`/roles/name/${name}`);
    return response;
  },
};

// ============= USERS =============

export const usersApi = {
  getAll: async (params?: {
    email?: string;
    role?: string;
  } & PaginationParams): Promise<PaginatedResponse<User>> => {
    const query = buildQuery(params);
    const response = await apiCall<any>(`/users${query ? `?${query}` : ''}`);
    // Map roleName to role for all users in the response
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map((user: any) => ({
        ...user,
        role: user.roleName || user.role,
      }));
    }
    return response as PaginatedResponse<User>;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiCall<any>(`/users/${id}`);
    // Map roleName to role for frontend compatibility
    return {
      ...response,
      role: response.roleName || response.role,
    } as User;
  },

  getByEmail: async (email: string): Promise<User | null> => {
    try {
      const response = await apiCall<any>(`/users/email/${encodeURIComponent(email)}`);
      // Map roleName to role for frontend compatibility
      return {
        ...response,
        role: response.roleName || response.role,
      } as User;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (user: { email: string; password: string; role: string; username?: string }): Promise<User> => {
    // Get roleId from role name
    const role = await rolesApi.getByName(user.role);
    
    // Use username if provided, otherwise use email
    const username = user.username || user.email.split('@')[0];
    
    // Create user with all required fields
    const createUserDto = {
      username,
      email: user.email,
      password: user.password,
      roleId: role.id,
      status: 'active' as const, // Backend expects lowercase
    };
    
    const response = await apiCall<any>('/users', {
      method: 'POST',
      body: JSON.stringify(createUserDto),
    });
    
    // Map roleName to role for frontend compatibility
    return {
      ...response,
      role: response.roleName || response.role,
    } as User;
  },

  update: (id: number, user: Partial<User>): Promise<User> =>
    apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    }),

  delete: (id: number): Promise<void> =>
    apiCall(`/users/${id}`, { method: 'DELETE' }),
};
