/**
 * Mock Data Generator Script
 * 
 * This script generates and sends mock data to the Student Registry API.
 * 
 * Requirements:
 *   - Node.js 18+ (for native fetch) OR install node-fetch: npm install node-fetch
 * 
 * Usage:
 *   node generate-mock-data.js <AUTH_TOKEN> [BASE_URL]
 * 
 * Example:
 *   node generate-mock-data.js "Bearer your-token-here" "http://localhost:8080"
 * 
 * Note: If your token doesn't include "Bearer", it will be added automatically.
 */

// Handle fetch for older Node.js versions
let fetch;
try {
    fetch = globalThis.fetch;
} catch (e) {
    try {
        fetch = require('node-fetch');
    } catch (e2) {
        console.error('Error: fetch is not available. Please use Node.js 18+ or install node-fetch: npm install node-fetch');
        process.exit(1);
    }
}

const BASE_URL = process.argv[3] || 'http://localhost:8080';
let AUTH_TOKEN = process.argv[2];

if (!AUTH_TOKEN) {
    console.error('Error: Authorization token is required');
    console.error('Usage: node generate-mock-data.js <AUTH_TOKEN> [BASE_URL]');
    console.error('Example: node generate-mock-data.js "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." "http://localhost:8080"');
    process.exit(1);
}

// Ensure token starts with "Bearer" if not already
if (!AUTH_TOKEN.startsWith('Bearer ')) {
    AUTH_TOKEN = `Bearer ${AUTH_TOKEN}`;
}

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_TOKEN
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        
        // Get response text first
        const responseText = await response.text();
        
        // Handle empty responses (like 204 No Content)
        if (!responseText || responseText.trim() === '') {
            if (!response.ok) {
                const statusText = response.statusText || 'Unknown error';
                throw new Error(`HTTP ${response.status} ${statusText}: Empty response body`);
            }
            return null; // Return null for empty successful responses
        }
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            // If it's not JSON, it might be an HTML error page or plain text
            if (!response.ok) {
                // Truncate long responses for readability
                const preview = responseText.length > 200 
                    ? responseText.substring(0, 200) + '...' 
                    : responseText;
                throw new Error(`HTTP ${response.status}: ${preview}`);
            }
            // If successful but not JSON, return the text
            return responseText;
        }
        
        if (!response.ok) {
            // Include error details if available
            const errorMsg = data.message || data.error || JSON.stringify(data);
            throw new Error(`HTTP ${response.status}: ${errorMsg}`);
        }
        
        return data;
    } catch (error) {
        // Only log if it's a network error, not if it's a handled HTTP error
        if (error.message.includes('fetch')) {
            console.error(`Error ${method} ${endpoint}:`, error.message);
        }
        throw error;
    }
}

// Helper to delay between requests
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock data generators
const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
    'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Jason', 'Rebecca', 'Edward', 'Sharon'
];

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
    'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
    'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
    'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const departments = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Economics', 'Psychology', 'History',
    'English', 'Philosophy', 'Art', 'Music', 'Education'
];

const programs = [
    'Bachelor of Science', 'Bachelor of Arts', 'Master of Science',
    'Master of Arts', 'PhD Program', 'Associate Degree'
];

const courseNames = [
    'Introduction to Programming', 'Data Structures', 'Algorithms', 'Database Systems',
    'Web Development', 'Software Engineering', 'Computer Networks', 'Operating Systems',
    'Machine Learning', 'Artificial Intelligence', 'Calculus I', 'Calculus II',
    'Linear Algebra', 'Discrete Mathematics', 'Statistics', 'Physics I',
    'Chemistry Fundamentals', 'Biology 101', 'English Composition', 'World History'
];

const courseCodes = [
    'CS101', 'CS201', 'CS301', 'CS401', 'CS501',
    'MATH101', 'MATH201', 'MATH301', 'MATH401',
    'PHYS101', 'PHYS201', 'CHEM101', 'BIO101',
    'ENG101', 'HIST101', 'STAT101', 'NET101',
    'OS101', 'AI101', 'ML101', 'WEB101'
];

const semesters = ['2023-Fall', '2024-Spring', '2024-Fall', '2025-Spring', '2025-Fall'];
const sections = ['1', '2', '3'];
const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];
const currentSemester = '2025-Fall';

// Generate random data
function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEmail(firstName, lastName) {
    const domains = ['gmail.com', 'yahoo.com', 'university.edu', 'student.edu'];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@${randomElement(domains)}`;
}

function generatePhone() {
    return `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

// Create students
async function createStudents(count = 50) {
    console.log(`\n📚 Creating ${count} students...`);
    const students = [];
    
    for (let i = 0; i < count; i++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        const dateOfBirth = randomDate(new Date(1995, 0, 1), new Date(2005, 11, 31));
        
        const student = {
            firstName,
            lastName,
            dateOfBirth: dateOfBirth.toISOString().split('T')[0],
            gender: randomElement(['Male', 'Female', 'Other']),
            phone: generatePhone(),
            email: generateEmail(firstName, lastName),
            address: `${randomInt(1, 9999)} ${randomElement(['Main St', 'Oak Ave', 'Park Blvd', 'University Dr'])}`,
            department: randomElement(departments),
            program: randomElement(programs),
            enrollmentYear: randomInt(2020, 2024),
            status: randomElement(['active', 'active', 'active', 'inactive', 'graduated', 'dropped']) // More active students
        };
        
        try {
            const created = await apiRequest('/api/students', 'POST', student);
            if (created) {
                students.push(created);
                process.stdout.write(`✓ Created student ${i + 1}/${count}: ${firstName} ${lastName}\r`);
            } else {
                console.error(`\n✗ Failed to create student ${i + 1}: Empty response from server`);
            }
            await delay(50); // Small delay to avoid overwhelming the server
        } catch (error) {
            console.error(`\n✗ Failed to create student ${i + 1}:`, error.message);
        }
    }
    
    console.log(`\n✅ Created ${students.length} students successfully`);
    return students;
}

// Create teachers with specific departments
async function createTeachers() {
    console.log(`\n👨‍🏫 Creating teachers...`);
    const teachers = [];
    
    // Create teachers for each major department
    const teachersByDepartment = {
        'Computer Science': [
            { firstName: 'Robert', lastName: 'Johnson' },
            { firstName: 'Emily', lastName: 'Davis' },
            { firstName: 'Michael', lastName: 'Wilson' }
        ],
        'Mathematics': [
            { firstName: 'Sarah', lastName: 'Anderson' },
            { firstName: 'David', lastName: 'Thompson' }
        ],
        'Physics': [
            { firstName: 'Jennifer', lastName: 'Martinez' },
            { firstName: 'James', lastName: 'Garcia' }
        ],
        'Chemistry': [
            { firstName: 'Linda', lastName: 'Rodriguez' }
        ],
        'Biology': [
            { firstName: 'Patricia', lastName: 'Brown' }
        ],
        'Engineering': [
            { firstName: 'William', lastName: 'Miller' },
            { firstName: 'Barbara', lastName: 'Moore' }
        ],
        'Business': [
            { firstName: 'Richard', lastName: 'Taylor' }
        ],
        'Economics': [
            { firstName: 'Susan', lastName: 'Thomas' }
        ],
        'History': [
            { firstName: 'Joseph', lastName: 'Jackson' }
        ],
        'English': [
            { firstName: 'Mary', lastName: 'White' }
        ]
    };
    
    let count = 0;
    for (const [department, teacherList] of Object.entries(teachersByDepartment)) {
        for (const teacher of teacherList) {
            const teacherData = {
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                department,
                email: generateEmail(teacher.firstName, teacher.lastName),
                phone: generatePhone()
            };
            
            try {
                const created = await apiRequest('/api/teachers', 'POST', teacherData);
                teachers.push(created);
                count++;
                process.stdout.write(`✓ Created teacher ${count}: ${teacher.firstName} ${teacher.lastName} (${department})\r`);
                await delay(50);
            } catch (error) {
                console.error(`\n✗ Failed to create teacher ${count}:`, error.message);
            }
        }
    }
    
    console.log(`\n✅ Created ${teachers.length} teachers successfully`);
    return teachers;
}

// Create courses with proper teacher assignments
async function createCourses(teachers = []) {
    console.log(`\n📖 Creating courses...`);
    const courses = [];
    
    // Define courses with their departments
    const courseDefs = [
        { code: 'CS101', name: 'Introduction to Programming', dept: 'Computer Science', credit: 3, semesters: ['2024-Fall', '2025-Spring'] },
        { code: 'CS201', name: 'Data Structures', dept: 'Computer Science', credit: 4, semesters: ['2024-Fall', '2025-Spring', '2025-Fall'] },
        { code: 'CS301', name: 'Algorithms', dept: 'Computer Science', credit: 4, semesters: ['2024-Spring', '2025-Fall'] },
        { code: 'CS401', name: 'Database Systems', dept: 'Computer Science', credit: 3, semesters: ['2024-Spring', '2025-Spring'] },
        { code: 'WEB101', name: 'Web Development', dept: 'Computer Science', credit: 3, semesters: ['2024-Fall', '2025-Fall'] },
        { code: 'AI101', name: 'Artificial Intelligence', dept: 'Computer Science', credit: 4, semesters: ['2025-Spring'] },
        { code: 'MATH101', name: 'Calculus I', dept: 'Mathematics', credit: 4, semesters: ['2023-Fall', '2024-Fall', '2025-Fall'] },
        { code: 'MATH201', name: 'Calculus II', dept: 'Mathematics', credit: 4, semesters: ['2024-Spring', '2025-Spring'] },
        { code: 'MATH301', name: 'Linear Algebra', dept: 'Mathematics', credit: 3, semesters: ['2024-Fall', '2025-Fall'] },
        { code: 'STAT101', name: 'Statistics', dept: 'Mathematics', credit: 3, semesters: ['2024-Spring', '2025-Spring', '2025-Fall'] },
        { code: 'PHYS101', name: 'Physics I', dept: 'Physics', credit: 4, semesters: ['2024-Fall', '2025-Fall'] },
        { code: 'PHYS201', name: 'Physics II', dept: 'Physics', credit: 4, semesters: ['2024-Spring', '2025-Spring'] },
        { code: 'CHEM101', name: 'Chemistry Fundamentals', dept: 'Chemistry', credit: 4, semesters: ['2024-Fall', '2025-Fall'] },
        { code: 'BIO101', name: 'Biology 101', dept: 'Biology', credit: 3, semesters: ['2024-Spring', '2025-Spring', '2025-Fall'] },
        { code: 'ENG101', name: 'Engineering Mechanics', dept: 'Engineering', credit: 3, semesters: ['2024-Fall', '2025-Spring'] },
        { code: 'BUS101', name: 'Business Fundamentals', dept: 'Business', credit: 3, semesters: ['2024-Spring', '2025-Fall'] },
        { code: 'ECON101', name: 'Microeconomics', dept: 'Economics', credit: 3, semesters: ['2024-Fall', '2025-Spring'] },
        { code: 'HIST101', name: 'World History', dept: 'History', credit: 3, semesters: ['2024-Spring', '2025-Fall'] },
        { code: 'ENGL101', name: 'English Composition', dept: 'English', credit: 3, semesters: ['2023-Fall', '2024-Fall', '2025-Fall'] }
    ];
    
    let count = 0;
    for (const courseDef of courseDefs) {
        for (const semester of courseDef.semesters) {
            // Find a teacher from the same department
            const departmentTeachers = teachers.filter(t => t.department === courseDef.dept);
            const teacher = departmentTeachers.length > 0 ? randomElement(departmentTeachers) : randomElement(teachers);
            
            const section = randomElement(sections);
            const course = {
                courseCode: courseDef.code,
                section,
                courseName: courseDef.name,
                description: `This course covers the fundamentals of ${courseDef.name.toLowerCase()}.`,
                credit: courseDef.credit,
                department: courseDef.dept,
                semester,
                teacherId: teacher ? teacher.id : null,
                status: semester === currentSemester ? 'active' : (Math.random() > 0.3 ? 'active' : 'inactive')
            };
            
            try {
                const created = await apiRequest('/api/courses', 'POST', course);
                if (created) {
                    courses.push(created);
                    count++;
                    process.stdout.write(`✓ Created course ${count}: ${courseDef.code}-${section} ${semester}\r`);
                } else {
                    console.error(`\n✗ Failed to create course: Empty response from server`);
                }
                await delay(50);
            } catch (error) {
                console.error(`\n✗ Failed to create course:`, error.message);
            }
        }
    }
    
    console.log(`\n✅ Created ${courses.length} courses successfully`);
    return courses;
}

// Create enrollments
async function createEnrollments(students = [], courses = []) {
    console.log(`\n📝 Creating enrollments...`);
    let enrollmentCount = 0;
    
    for (const student of students) {
        // Determine student's year based on enrollment year
        const currentYear = 2025;
        const yearsSinceEnrollment = currentYear - student.enrollmentYear;
        
        // Students take courses from multiple semesters based on their year
        let relevantSemesters = [];
        if (yearsSinceEnrollment === 0) {
            relevantSemesters = ['2025-Fall']; // Freshmen
        } else if (yearsSinceEnrollment === 1) {
            relevantSemesters = ['2024-Fall', '2025-Spring', '2025-Fall']; // Sophomores
        } else if (yearsSinceEnrollment === 2) {
            relevantSemesters = ['2023-Fall', '2024-Spring', '2024-Fall', '2025-Spring', '2025-Fall']; // Juniors
        } else {
            relevantSemesters = ['2023-Fall', '2024-Spring', '2024-Fall', '2025-Spring', '2025-Fall']; // Seniors and beyond
        }
        
        // Filter courses by student's department and relevant semesters
        const studentCourses = courses.filter(c => 
            relevantSemesters.includes(c.semester) &&
            (c.department === student.department || 
             c.department === 'Mathematics' || 
             c.department === 'English' ||
             Math.random() > 0.7) // Some random electives
        );
        
        // Enroll in 3-5 courses
        const numCourses = Math.min(randomInt(3, 5), studentCourses.length);
        const shuffled = [...studentCourses].sort(() => Math.random() - 0.5);
        const selectedCourses = shuffled.slice(0, numCourses);
        
        for (const course of selectedCourses) {
            // Don't assign grades for current semester courses
            const finalGrade = course.semester === currentSemester ? null : randomElement([...grades, null, null]);
            
            const enrollment = {
                studentId: student.id,
                courseId: course.id,
                finalGrade
            };
            
            try {
                await apiRequest('/api/enrollments', 'POST', enrollment);
                enrollmentCount++;
                process.stdout.write(`✓ Created enrollment ${enrollmentCount}\r`);
                await delay(50);
            } catch (error) {
                // Enrollment might already exist, skip
                if (!error.message.includes('already enrolled')) {
                    console.error(`\n✗ Failed to create enrollment:`, error.message);
                }
            }
        }
    }
    
    console.log(`\n✅ Created ${enrollmentCount} enrollments successfully`);
    return enrollmentCount;
}

// Create absences
async function createAbsences(students = [], courses = [], absencesPerStudent = 2) {
    console.log(`\n🚫 Creating absences (${absencesPerStudent} per student)...`);
    let absenceCount = 0;
    
    // Only create absences for enrolled students
    for (const student of students.slice(0, Math.min(students.length, 30))) { // Limit to 30 students
        const studentCourses = courses.slice(0, Math.min(3, courses.length));
        
        for (const course of studentCourses) {
            // Randomly decide if this student was absent
            if (Math.random() > 0.7) { // 30% chance
                const absenceDate = randomDate(new Date(2024, 0, 1), new Date());
                const dateString = absenceDate.toISOString().split('T')[0];
                
                const absenceRequest = {
                    studentId: student.id,
                    date: dateString
                };
                
                try {
                    await apiRequest(`/api/courses/${course.id}/absences`, 'POST', absenceRequest);
                    absenceCount++;
                    process.stdout.write(`✓ Created absence ${absenceCount}\r`);
                    await delay(50);
                } catch (error) {
                    // Absence might already exist or student not enrolled, skip
                }
            }
        }
    }
    
    console.log(`\n✅ Created ${absenceCount} absences successfully`);
    return absenceCount;
}

// Update some grades for past semester courses only
async function updateGrades(students = [], courses = []) {
    console.log(`\n📊 Updating grades for past semester courses...`);
    let gradeCount = 0;
    
    // Only update grades for courses NOT in the current semester
    const pastCourses = courses.filter(c => c.semester !== currentSemester);
    
    for (const student of students.slice(0, Math.min(students.length, 40))) {
        for (const course of pastCourses.slice(0, Math.min(3, pastCourses.length))) {
            // 70% chance to assign a grade
            if (Math.random() > 0.3) {
                const grade = randomElement(grades);
                
                try {
                    await apiRequest(`/api/courses/${course.id}/students/${student.id}/grade`, 'PUT', {
                        finalGrade: grade
                    });
                    gradeCount++;
                    process.stdout.write(`✓ Updated grade ${gradeCount}\r`);
                    await delay(50);
                } catch (error) {
                    // Student might not be enrolled, skip
                }
            }
        }
    }
    
    console.log(`\n✅ Updated ${gradeCount} grades successfully`);
    return gradeCount;
}

// Main execution
async function main() {
    console.log('🚀 Starting mock data generation...');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`🔑 Using provided authorization token`);
    
    try {
        // Step 1: Create teachers first (needed for courses)
        const teachers = await createTeachers();
        
        // Step 2: Create students
        const students = await createStudents(50);
        
        // Step 3: Create courses with proper teacher assignments
        const courses = await createCourses(teachers);
        
        // Step 4: Create realistic enrollments
        await createEnrollments(students, courses);
        
        // Step 5: Create some absences
        await createAbsences(students, courses, 2);
        
        // Step 6: Update grades for past semester courses only
        await updateGrades(students, courses);
        
        console.log('\n🎉 Mock data generation completed successfully!');
        console.log(`\nSummary:`);
        console.log(`  - Teachers: ${teachers.length}`);
        console.log(`  - Students: ${students.length}`);
        console.log(`  - Courses: ${courses.length}`);
        
    } catch (error) {
        console.error('\n❌ Error during mock data generation:', error);
        process.exit(1);
    }
}

// Run the script
main();
