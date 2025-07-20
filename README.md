# EduHub Server

Backend server for the B.Sc. Computer Science Educational Portal with MongoDB integration.

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Set Up MongoDB Database

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Create a database user
4. Get your connection string
5. Update the `.env` file with your connection string

#### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Update `.env` file: `MONGODB_URI=mongodb://localhost:27017/eduhub`

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env` (if exists)
2. Update the `MONGODB_URI` in `.env` with your actual connection string
3. Example:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/eduhub?retryWrites=true&w=majority
   PORT=5000
   ```

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Content Management
- `GET /api/content` - Get all content (supports query filters)
- `POST /api/content` - Add new content
- `PUT /api/content/:id` - Update content by ID
- `DELETE /api/content/:id` - Delete content by ID

### Statistics
- `GET /api/stats` - Get content statistics

### Health Check
- `GET /api/health` - Server health status

## Query Parameters for GET /api/content

- `semester` - Filter by semester (1-6)
- `subject` - Filter by subject name
- `tab` - Filter by tab type (teacher-notes, student-notes, resources, assignments, pyqs, syllabus)

Example: `/api/content?semester=3&subject=database-management&tab=teacher-notes`

## Frontend Integration

The frontend automatically uses the API when the server is running. All content is stored in MongoDB instead of localStorage.

## Data Structure

Each content item has the following structure:
```json
{
  "semester": 3,
  "subject": "database-management",
  "tab": "teacher-notes",
  "title": "Introduction to DBMS",
  "description": "Basic concepts of database management systems",
  "type": "PDF",
  "size": "2.5 MB",
  "createdAt": "2025-07-14T10:30:00.000Z",
  "updatedAt": "2025-07-14T10:30:00.000Z"
}
```

## Troubleshooting

1. **MongoDB Connection Issues**
   - Check your connection string in `.env`
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify database user credentials

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill existing processes using the port

3. **CORS Issues**
   - Server includes CORS middleware for cross-origin requests
   - Frontend should work on any port

## Development

For development, use `npm run dev` to enable auto-reload when files change.
