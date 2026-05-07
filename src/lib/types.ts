export interface Course {
  id: string;
  title: string;
  instructor: string;
  price: number;
  duration: string;
  lessons: number;
  rating: number;
  category: string;
  image: string;
  description: string;
  level?: string;
  enrolled?: number;
  outcomes?: string[];
  curriculum?: {
    title: string;
    lessons: number;
    time: string;
  }[];
}

export interface Exam {
  id: string;
  title: string;
  category: string;
  type: 'MCQ' | 'Written';
  fee: number;
  date: string;
  duration: string;
  totalMarks: number;
  syllabus: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  author?: string;
  date?: string;
  content?: string;
}

export interface Category {
  id?: string;
  title: string;
  description: string;
  color?: string;
  icon?: string;
  order?: number;
}

export interface StudentStats {
  activeCourses: number;
  completedCourses: number;
  upcomingExams: number;
  certificates: number;
  averageScore: string;
}

export interface AdminStats {
  totalStudents: number;
  activeCourses: number;
  totalRevenue: string;
  upcomingExams: number;
}
