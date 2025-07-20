# EduHub API Documentation

## Database Structure (Hierarchical)

The database is now organized in a hierarchical structure:

```
Semester (1-8)
├── Subject (e.g., "Mathematics", "Physics")
│   ├── Category: teacher-notes
│   ├── Category: student-notes
│   ├── Category: resources
│   ├── Category: assignments
│   ├── Category: pyqs (Previous Year Questions)
│   └── Category: syllabus
```

## API Endpoints

### 1. Content Management

#### Get Content (with hierarchical filtering)
```
GET /api/content?semester=1&subject=Mathematics&category=teacher-notes
```

**Query Parameters:**
- `semester` (optional): Filter by semester (1-8)
- `subject` (optional): Filter by subject name
- `category` (optional): Filter by category (teacher-notes, student-notes, etc.)

#### Upload Content
```
POST /api/content/upload
Content-Type: multipart/form-data
```

**Required Fields:**
- `semester`: Semester number (1-8)
- `subject`: Subject name
- `category`: Content category
- `title`: Content title
- `description`: Content description
- `type`: File type
- `file`: File to upload (optional)

**Optional Fields:**
- `tags`: Comma-separated tags
- `priority`: low, medium, high (default: medium)

#### Add Content (without file)
```
POST /api/content
Content-Type: application/json
```

#### Update Content
```
PUT /api/content/:id
```

#### Delete Content
```
DELETE /api/content/:id
```

### 2. Hierarchical Structure APIs

#### Get Complete Structure
```
GET /api/structure
```
Returns the complete hierarchical structure with content counts.

#### Get Subjects for Semester
```
GET /api/semesters/:semester/subjects
```
Example: `GET /api/semesters/1/subjects`

#### Get Categories for Semester and Subject
```
GET /api/semesters/:semester/subjects/:subject/categories
```
Example: `GET /api/semesters/1/subjects/Mathematics/categories`

### 3. Statistics
```
GET /api/stats
```

### 4. Health Check
```
GET /api/health
```

## Data Model

### Content Schema
```javascript
{
  semester: Number (1-8, indexed),
  subject: String (indexed),
  category: String (indexed, enum),
  title: String,
  description: String,
  type: String,
  size: String,
  tags: [String],
  priority: String (low/medium/high),
  filePath: String,
  originalFileName: String,
  fileUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexes
- Compound index: `{ semester: 1, subject: 1, category: 1 }`
- Index: `{ semester: 1, subject: 1 }`
- Index: `{ createdAt: -1 }`

## Example Usage

### 1. Get all Mathematics content for Semester 1
```
GET /api/content?semester=1&subject=Mathematics
```

### 2. Get only teacher notes for Semester 2 Physics
```
GET /api/content?semester=2&subject=Physics&category=teacher-notes
```

### 3. Upload a new assignment
```
POST /api/content/upload
Form Data:
- semester: 3
- subject: Computer Science
- category: assignments
- title: Data Structures Assignment 1
- description: Implementation of linked lists
- type: PDF
- tags: programming, data-structures
- priority: high
- file: [assignment.pdf]
```

### 4. Get the hierarchical structure
```
GET /api/structure

Response:
{
  "success": true,
  "data": {
    "1": {
      "Mathematics": {
        "teacher-notes": 5,
        "student-notes": 3,
        "assignments": 2
      },
      "Physics": {
        "teacher-notes": 4,
        "pyqs": 1
      }
    },
    "2": {
      "Computer Science": {
        "resources": 6,
        "assignments": 4
      }
    }
  }
}
```

## Frontend Integration

The frontend should now organize content hierarchically:

1. **Semester Selection**: Show available semesters
2. **Subject Selection**: Show subjects for selected semester
3. **Category Navigation**: Show categories for selected subject
4. **Content Display**: Show actual content items

This structure provides better organization and easier navigation for students and teachers.
