export interface Professor {
  id?: string;
  name: string;
  university: string;
  department: string;
  title: string; // Professor, Associate Professor, Assistant Professor, Lecturer, etc.
  email?: string;
  subjects: string[]; // Subjects they teach
  createdAt?: Date;
  addedBy?: string; // User ID who added this professor
  isVerified?: boolean;
} 