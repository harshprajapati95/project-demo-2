# MongoDB Aggregation Queries for Hierarchical Structure

## Use these queries in MongoDB Compass to view your data hierarchically:

### 1. View Complete Hierarchical Structure
```javascript
[
  {
    $group: {
      _id: {
        semester: "$semester",
        subject: "$subject",
        category: "$category"
      },
      count: { $sum: 1 },
      titles: { $push: "$title" },
      totalSize: { $sum: { $toInt: { $replaceAll: { input: { $replaceAll: { input: "$size", find: " MB", replacement: "" } }, find: " KB", replacement: "" } } } }
    }
  },
  {
    $sort: {
      "_id.semester": 1,
      "_id.subject": 1,
      "_id.category": 1
    }
  },
  {
    $group: {
      _id: {
        semester: "$_id.semester",
        subject: "$_id.subject"
      },
      categories: {
        $push: {
          category: "$_id.category",
          count: "$count",
          titles: "$titles"
        }
      },
      totalItems: { $sum: "$count" }
    }
  },
  {
    $group: {
      _id: "$_id.semester",
      subjects: {
        $push: {
          subject: "$_id.subject",
          categories: "$categories",
          totalItems: "$totalItems"
        }
      },
      semesterTotal: { $sum: "$totalItems" }
    }
  },
  {
    $sort: { "_id": 1 }
  }
]
```

### 2. Simple Hierarchical View (Easier to read)
```javascript
[
  {
    $project: {
      semester: 1,
      subject: 1,
      category: 1,
      title: 1,
      type: 1,
      size: 1,
      priority: 1,
      tags: 1,
      createdAt: 1
    }
  },
  {
    $sort: {
      semester: 1,
      subject: 1,
      category: 1,
      createdAt: -1
    }
  }
]
```

### 3. Count by Category (Teacher Notes, Student Notes, etc.)
```javascript
[
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 },
      semesters: { $addToSet: "$semester" },
      subjects: { $addToSet: "$subject" }
    }
  },
  {
    $sort: { "count": -1 }
  }
]
```

### 4. Subject-wise Distribution
```javascript
[
  {
    $group: {
      _id: "$subject",
      totalItems: { $sum: 1 },
      semesters: { $addToSet: "$semester" },
      categories: {
        $push: {
          category: "$category",
          title: "$title",
          type: "$type"
        }
      }
    }
  },
  {
    $sort: { "totalItems": -1 }
  }
]
```

### 5. Semester Overview
```javascript
[
  {
    $group: {
      _id: "$semester",
      totalItems: { $sum: 1 },
      subjects: { $addToSet: "$subject" },
      categories: { $addToSet: "$category" },
      itemsByCategory: {
        $push: {
          subject: "$subject",
          category: "$category",
          title: "$title"
        }
      }
    }
  },
  {
    $addFields: {
      subjectCount: { $size: "$subjects" },
      categoryCount: { $size: "$categories" }
    }
  },
  {
    $sort: { "_id": 1 }
  }
]
```

## How to Use in MongoDB Compass:

1. **Open MongoDB Compass**
2. **Connect to**: `mongodb://localhost:27017`
3. **Select Database**: `eduhub`
4. **Select Collection**: `contents`
5. **Go to Aggregations tab**
6. **Copy and paste any of the above queries**
7. **Click "Run"**

## Expected Hierarchical Structure in MongoDB:

```
eduhub (Database)
└── contents (Collection)
    ├── Semester 1
    │   ├── Mathematics
    │   │   ├── teacher-notes: [documents]
    │   │   ├── student-notes: [documents]
    │   │   ├── assignments: [documents]
    │   │   └── pyqs: [documents]
    │   └── Physics
    │       ├── teacher-notes: [documents]
    │       ├── student-notes: [documents]
    │       └── resources: [documents]
    ├── Semester 2
    │   ├── Chemistry
    │   │   ├── teacher-notes: [documents]
    │   │   └── syllabus: [documents]
    │   └── Computer Science
    │       ├── teacher-notes: [documents]
    │       ├── assignments: [documents]
    │       └── resources: [documents]
    └── Semester 3
        ├── Advanced Mathematics
        │   └── teacher-notes: [documents]
        └── Database Systems
            ├── teacher-notes: [documents]
            └── assignments: [documents]
```

This structure allows for efficient querying and easy navigation through the educational content!
