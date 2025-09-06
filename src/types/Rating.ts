export interface Rating {
  id?: string;
  userId: string;
  professorId: string;
  professorName: string;
  university: string;
  rating: number; // 1-5 stars
  review?: string; // Optional text review
  createdAt: Date;
} 