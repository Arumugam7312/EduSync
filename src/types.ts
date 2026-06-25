export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  classId: string;
  sectionId: string;
  parentId: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  phone?: string;
  address?: string;
  admissionDate: string;
  bloodGroup?: string;
  medicalInfo?: string;
  previousSchool?: string;
  academicHistory?: string;
}

export interface Parent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  occupation?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  joiningDate: string;
  assignedClasses: { classId: string; sectionId: string; subjectId: string }[];
  salary: number;
}

export type StaffDepartment = 'RECEPTION' | 'ACCOUNTING' | 'LIBRARY' | 'TRANSPORT';

export interface Staff {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  department: StaffDepartment;
  joiningDate: string;
  salary: number;
}

export interface Class {
  id: string;
  name: string; // e.g., "Grade 10"
}

export interface Section {
  id: string;
  classId: string;
  name: string; // e.g., "Section A"
  roomNumber?: string;
}

export interface Subject {
  id: string;
  name: string; // e.g., "Mathematics"
  code: string;  // e.g., "MATH101"
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  academicYear: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export interface Exam {
  id: string;
  name: string; // e.g., "Midterm Exam 2026"
  academicYear: string;
  startDate: string;
  endDate: string;
}

export interface ExamSubject {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  date: string;
  timeSlot: string; // e.g., "09:00 AM - 12:00 PM"
  maxMarks: number;
  passMarks: number;
}

export interface Mark {
  id: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number;
  remarks?: string;
}

export interface Grade {
  id: string;
  name: string; // A+, A, B, C, D, F
  minPercentage: number;
  maxPercentage: number;
  gradePoints: number;
  remarks?: string;
}

export interface Assignment {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  attachmentUrl?: string;
  attachmentName?: string;
  maxMarks: number;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionDate: string;
  fileUrl: string;
  fileName: string;
  submittedText?: string;
  marksObtained?: number;
  feedback?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
}

export interface StudyMaterial {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: 'pdf' | 'ppt' | 'video' | 'image' | 'doc';
  uploadedAt: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:MM (24h)
  endTime: string;   // HH:MM (24h)
  roomNumber: string;
}

export interface FeeStructure {
  id: string;
  classId: string;
  name: string; // Tuition Fee, Library Fee, etc.
  amount: number;
  dueDate: string;
  academicYear: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  transactionId?: string;
  discount?: number;
}

export interface Receipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  issuedDate: string;
  issuedBy: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  senderId: string;
  targetRole?: UserRole; // Broadcast to a specific role
  targetUserId?: string; // Private notification to specific user
  targetClassId?: string; // Broadcast to specific class
  createdAt: string;
  isReadBy?: string[]; // Array of userIds who read it
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface LeaveRequest {
  id: string;
  applicantId: string; // Teacher or Staff userId
  role: 'TEACHER' | 'STAFF';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface VisitorLog {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  checkIn: string;
  checkOut?: string;
  hostName?: string;
  remarks?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  available: number;
  location?: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fineAmount?: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
}

export interface TransportRoute {
  id: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  capacity: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface SchoolSettings {
  schoolName: string;
  logoUrl?: string;
  academicYear: string;
  phone: string;
  email: string;
  address: string;
  workingDays: ('MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')[];
}
