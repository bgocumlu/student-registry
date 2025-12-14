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

const semesters = ['2023-Fall', '2023-Spring', '2024-Fall', '2024-Spring', '2025-Fall', '2025-Spring'];
const sections = ['1', '2', '3'];
const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', null];

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

// Create teachers
async function createTeachers(count = 10) {
    console.log(`\n👨‍🏫 Creating ${count} teachers...`);
    const teachers = [];
    
    for (let i = 0; i < count; i++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        
        const teacher = {
            firstName,
            lastName,
            department: randomElement(departments),
            email: generateEmail(firstName, lastName),
            phone: generatePhone()
        };
        
        try {
            const created = await apiRequest('/api/teachers', 'POST', teacher);
            teachers.push(created);
            process.stdout.write(`✓ Created teacher ${i + 1}/${count}: ${firstName} ${lastName}\r`);
            await delay(50);
        } catch (error) {
            console.error(`\n✗ Failed to create teacher ${i + 1}:`, error.message);
        }
    }
    
    console.log(`\n✅ Created ${teachers.length} teachers successfully`);
    return teachers;
}

// Create courses
async function createCourses(count = 20, teachers = []) {
    console.log(`\n📖 Creating ${count} courses...`);
    const courses = [];
    
    for (let i = 0; i < count; i++) {
        const courseCode = courseCodes[i % courseCodes.length];
        const courseName = courseNames[i % courseNames.length];
        const section = randomElement(sections);
        const semester = randomElement(semesters);
        const teacher = teachers.length > 0 ? randomElement(teachers) : null;
        
        const course = {
            courseCode: courseCode,
            section,
            courseName,
            description: `This course covers the fundamentals of ${courseName.toLowerCase()}.`,
            credit: randomInt(2, 4),
            department: randomElement(departments),
            semester,
            teacherId: teacher ? teacher.id : null,
            status: randomElement(['active', 'active', 'inactive']) // More active courses
        };
        
        try {
            const created = await apiRequest('/api/courses', 'POST', course);
            if (created) {
                courses.push(created);
                process.stdout.write(`✓ Created course ${i + 1}/${count}: ${courseCode} Section ${section}\r`);
            } else {
                console.error(`\n✗ Failed to create course ${i + 1}: Empty response from server`);
            }
            await delay(50);
        } catch (error) {
            console.error(`\n✗ Failed to create course ${i + 1}:`, error.message);
        }
    }
    
    console.log(`\n✅ Created ${courses.length} courses successfully`);
    return courses;
}

// Create enrollments
async function createEnrollments(students = [], courses = [], countPerStudent = 3) {
    console.log(`\n📝 Creating enrollments (${countPerStudent} courses per student)...`);
    let enrollmentCount = 0;
    const totalEnrollments = students.length * countPerStudent;
    
    for (const student of students) {
        // Randomly select courses for each student
        const shuffledCourses = [...courses].sort(() => Math.random() - 0.5);
        const studentCourses = shuffledCourses.slice(0, Math.min(countPerStudent, courses.length));
        
        for (const course of studentCourses) {
            const enrollment = {
                studentId: student.id,
                courseId: course.id,
                finalGrade: randomElement(grades) // Some students have grades, some don't
            };
            
            try {
                await apiRequest('/api/enrollments', 'POST', enrollment);
                enrollmentCount++;
                process.stdout.write(`✓ Created enrollment ${enrollmentCount}/${totalEnrollments}\r`);
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

// Update some grades
async function updateGrades(students = [], courses = []) {
    console.log(`\n📊 Updating grades for enrolled students...`);
    let gradeCount = 0;
    
    for (const student of students.slice(0, Math.min(students.length, 30))) {
        for (const course of courses.slice(0, Math.min(2, courses.length))) {
            // Randomly assign grades
            if (Math.random() > 0.5) {
                const grade = randomElement(grades.filter(g => g !== null));
                
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
        const teachers = await createTeachers(10);
        
        // Step 2: Create students
        const students = await createStudents(50);
        
        // Step 3: Create courses
        const courses = await createCourses(20, teachers);
        
        // Step 4: Create enrollments
        await createEnrollments(students, courses, 3);
        
        // Step 5: Create some absences
        await createAbsences(students, courses, 2);
        
        // Step 6: Update some grades
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
