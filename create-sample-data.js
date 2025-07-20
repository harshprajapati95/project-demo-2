import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Content Schema - Same as in server.js
const contentSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['teacher-notes', 'student-notes', 'resources', 'assignments', 'pyqs', 'syllabus'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound indexes for hierarchical structure
contentSchema.index({ semester: 1, subject: 1, category: 1 });
contentSchema.index({ semester: 1, subject: 1 });
contentSchema.index({ createdAt: -1 });

const Content = mongoose.model('Content', contentSchema);

// Sample hierarchical data
const sampleData = [
  // Semester 1 - Mathematics
  {
    semester: 1,
    subject: "Mathematics",
    category: "teacher-notes",
    title: "Calculus Introduction",
    description: "Basic concepts of differentiation and integration",
    type: "PDF",
    size: "2.5 MB",
    tags: ["calculus", "derivatives", "integrals"],
    priority: "high"
  },
  {
    semester: 1,
    subject: "Mathematics",
    category: "student-notes",
    title: "Algebra Practice Problems",
    description: "Student compiled practice problems for algebra",
    type: "PDF",
    size: "1.8 MB",
    tags: ["algebra", "practice", "problems"],
    priority: "medium"
  },
  {
    semester: 1,
    subject: "Mathematics",
    category: "assignments",
    title: "Assignment 1 - Linear Equations",
    description: "Solve linear equations and systems",
    type: "PDF",
    size: "500 KB",
    tags: ["assignment", "linear-equations"],
    priority: "high"
  },
  {
    semester: 1,
    subject: "Mathematics",
    category: "pyqs",
    title: "Previous Year Questions 2023",
    description: "Mathematics previous year question papers",
    type: "PDF",
    size: "3.2 MB",
    tags: ["pyq", "2023", "exam"],
    priority: "high"
  },

  // Semester 1 - Physics
  {
    semester: 1,
    subject: "Physics",
    category: "teacher-notes",
    title: "Mechanics Fundamentals",
    description: "Newton's laws and motion principles",
    type: "PDF",
    size: "4.1 MB",
    tags: ["mechanics", "newton", "motion"],
    priority: "high"
  },
  {
    semester: 1,
    subject: "Physics",
    category: "student-notes",
    title: "Lab Report - Pendulum Experiment",
    description: "Student lab report on simple pendulum",
    type: "DOC",
    size: "1.2 MB",
    tags: ["lab", "pendulum", "experiment"],
    priority: "medium"
  },
  {
    semester: 1,
    subject: "Physics",
    category: "resources",
    title: "Physics Formula Sheet",
    description: "Important formulas for physics concepts",
    type: "PDF",
    size: "800 KB",
    tags: ["formulas", "reference", "physics"],
    priority: "medium"
  },

  // Semester 2 - Computer Science
  {
    semester: 2,
    subject: "Computer Science",
    category: "teacher-notes",
    title: "Data Structures Introduction",
    description: "Arrays, linked lists, and basic algorithms",
    type: "PDF",
    size: "5.2 MB",
    tags: ["data-structures", "algorithms", "programming"],
    priority: "high"
  },
  {
    semester: 2,
    subject: "Computer Science",
    category: "assignments",
    title: "Programming Assignment - Linked Lists",
    description: "Implement singly and doubly linked lists",
    type: "ZIP",
    size: "1.5 MB",
    tags: ["programming", "linked-lists", "assignment"],
    priority: "high"
  },
  {
    semester: 2,
    subject: "Computer Science",
    category: "resources",
    title: "C++ Programming Tutorial",
    description: "Complete C++ programming guide",
    type: "PDF",
    size: "8.7 MB",
    tags: ["cpp", "programming", "tutorial"],
    priority: "medium"
  },

  // Semester 2 - Chemistry
  {
    semester: 2,
    subject: "Chemistry",
    category: "teacher-notes",
    title: "Organic Chemistry Basics",
    description: "Introduction to organic compounds and reactions",
    type: "PDF",
    size: "6.3 MB",
    tags: ["organic", "chemistry", "reactions"],
    priority: "high"
  },
  {
    semester: 2,
    subject: "Chemistry",
    category: "syllabus",
    title: "Chemistry Syllabus 2024-25",
    description: "Complete syllabus for chemistry course",
    type: "PDF",
    size: "400 KB",
    tags: ["syllabus", "course", "2024"],
    priority: "medium"
  },

  // Semester 3 - Advanced Topics
  {
    semester: 3,
    subject: "Advanced Mathematics",
    category: "teacher-notes",
    title: "Differential Equations",
    description: "Solving ordinary and partial differential equations",
    type: "PDF",
    size: "7.8 MB",
    tags: ["differential", "equations", "advanced"],
    priority: "high"
  },
  {
    semester: 3,
    subject: "Database Systems",
    category: "teacher-notes",
    title: "SQL Fundamentals",
    description: "Database design and SQL query optimization",
    type: "PDF",
    size: "4.9 MB",
    tags: ["sql", "database", "optimization"],
    priority: "high"
  },
  {
    semester: 3,
    subject: "Database Systems",
    category: "assignments",
    title: "Database Design Project",
    description: "Design a complete database system for library management",
    type: "PDF",
    size: "2.1 MB",
    tags: ["database", "design", "project", "library"],
    priority: "high"
  }
];

async function createSampleData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduhub';
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Clear existing data (optional)
    console.log('🧹 Clearing existing data...');
    await Content.deleteMany({});
    
    // Insert sample data
    console.log('📝 Creating sample hierarchical data...');
    const result = await Content.insertMany(sampleData);
    
    console.log(`✅ Successfully created ${result.length} sample records`);
    
    // Display the hierarchical structure
    console.log('\n📊 Hierarchical Structure Created:');
    
    const semesters = await Content.distinct('semester');
    
    for (const semester of semesters.sort()) {
      console.log(`\n📚 Semester ${semester}:`);
      
      const subjects = await Content.distinct('subject', { semester });
      
      for (const subject of subjects.sort()) {
        console.log(`  📖 ${subject}:`);
        
        const categories = await Content.distinct('category', { semester, subject });
        
        for (const category of categories.sort()) {
          const count = await Content.countDocuments({ semester, subject, category });
          console.log(`    📄 ${category}: ${count} items`);
        }
      }
    }
    
    console.log('\n🎉 Sample data created successfully!');
    console.log('👀 Check MongoDB Compass to see the hierarchical structure');
    console.log('🌐 Visit http://localhost:5000 to see the data in your app');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the script
createSampleData();
