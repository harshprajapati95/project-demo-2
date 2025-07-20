import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Check if environment variables are loaded
console.log('🔍 Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Loaded ✅' : 'Missing ❌');
console.log('PORT:', process.env.PORT || 'Using default');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000', 'file://', 'null'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`, req.body);
  next();
});

// Add connection monitoring middleware
app.use((req, res, next) => {
  // Set timeout for all requests
  req.setTimeout(30000, () => {
    console.log('⏰ Request timeout for:', req.method, req.path);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout'
      });
    }
  });
  
  // Add CORS headers explicitly for all requests
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.static('../public')); // Serve static files from public directory

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|txt|mp4|mp3|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // More flexible MIME type checking
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/txt',
    'video/mp4',
    'audio/mpeg', 'audio/mp3',
    'application/zip', 'application/x-rar-compressed', 'application/x-zip-compressed'
  ];
  
  const mimetype = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    console.log(`🚫 File rejected: ${file.originalname}, MIME: ${file.mimetype}, Extension: ${path.extname(file.originalname)}`);
    cb(new Error('Only specific file types are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: fileFilter
});

// MongoDB Connection with fallback
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduhub';
console.log('🔗 Attempting to connect to MongoDB...');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Content Schema - Hierarchical structure: Semester > Subject > Category
const contentSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8, // Extended to support more semesters
    index: true // Index for faster queries
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true // Index for faster queries
  },
  category: {
    type: String,
    required: true,
    enum: ['teacher-notes', 'student-notes', 'resources', 'assignments', 'pyqs', 'syllabus'],
    index: true // Index for faster queries
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
  filePath: {
    type: String,
    default: null
  },
  originalFileName: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }], // Additional tags for better organization
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

// Create compound indexes for efficient hierarchical queries
contentSchema.index({ semester: 1, subject: 1, category: 1 });
contentSchema.index({ semester: 1, subject: 1 });
contentSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
contentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Content = mongoose.model('Content', contentSchema);

// Admin Schema for authentication
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Admin = mongoose.model('Admin', adminSchema);

// JWT Secret (in production, store this in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'eduhub-super-secret-key-2025';

// Authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    console.log('🔐 Authenticating admin for:', req.method, req.path);
    const authHeader = req.header('Authorization');
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }
    
    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      console.log('❌ Admin not found for token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found.'
      });
    }
    
    console.log('✅ Admin authenticated:', admin.username);
    req.admin = admin;
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.'
    });
  }
};

// JSON file fallback system for when MongoDB is not available
const dataFilePath = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
}

// Helper functions for JSON storage
function readDataFromFile() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return [];
  }
}

function writeDataToFile(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
}

// Check if MongoDB is connected
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// API Routes

// Admin Authentication Routes

// Create default admin account (run this once)
app.post('/api/admin/setup', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: 'Admin account already exists',
        admin: {
          id: existingAdmin._id,
          username: existingAdmin.username,
          email: existingAdmin.email
        }
      });
    }
    
    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create admin
    const admin = new Admin({
      username,
      password: hashedPassword,
      email
    });
    
    await admin.save();
    
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });
    
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin account',
      error: error.message
    });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { username: req.body.username, passwordProvided: !!req.body.password });
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Find admin
    console.log('🔍 Looking for admin:', username);
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log('❌ Admin not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    console.log('✅ Admin found:', admin.username);
    
    // Check password
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
    
    console.log('✅ Password valid for:', username);
    
    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', username);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });
    
  } catch (error) {
    console.error('💥 Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Verify admin token
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email
    }
  });
});

// Clear all admin accounts (temporary endpoint for development)
app.post('/api/admin/clear-all', async (req, res) => {
  try {
    const result = await Admin.deleteMany({});
    console.log(`🗑️ Cleared ${result.deletedCount} admin accounts`);
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} admin accounts. You can now create a new admin account.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing admin accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing admin accounts',
      error: error.message
    });
  }
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get all content or filter by query parameters - Hierarchical structure
app.get('/api/content', async (req, res) => {
  try {
    const { semester, subject, category } = req.query;
    let content = [];
    
    // Try MongoDB first
    if (isMongoConnected()) {
      try {
        const filter = {};
        if (semester) filter.semester = parseInt(semester);
        if (subject) filter.subject = subject;
        if (category) filter.category = category;
        
        content = await Content.find(filter).sort({ semester: 1, subject: 1, category: 1, createdAt: -1 });
        console.log(`📊 Loaded ${content.length} items from MongoDB`);
      } catch (mongoError) {
        console.error('MongoDB fetch failed, using JSON fallback:', mongoError.message);
      }
    }
    
    // Fallback to JSON if MongoDB failed or no results
    if (content.length === 0) {
      console.log('💾 Loading from JSON file storage');
      const allData = readDataFromFile();
      content = allData.filter(item => {
        if (semester && item.semester !== parseInt(semester)) return false;
        if (subject && item.subject !== subject) return false;
        if (category && (item.category !== category && item.tab !== category)) return false; // Support both old 'tab' and new 'category'
        return true;
      });
      console.log(`📊 Loaded ${content.length} items from JSON file`);
    }
    
    res.json({
      success: true,
      count: content.length,
      data: content,
      source: isMongoConnected() ? 'mongodb' : 'json'
    });
    
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Add new content with file upload - Updated for hierarchical structure (ADMIN ONLY)
app.post('/api/content/upload', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('📋 Request body:', req.body);
    console.log('📁 File info:', req.file ? { 
      filename: req.file.filename, 
      originalname: req.file.originalname,
      size: req.file.size 
    } : 'No file');
    
    const { semester, subject, category, title, description, type, tags, priority } = req.body;
    
    // Validation
    if (!semester || !subject || !category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Semester, subject, category, title, and description are required'
      });
    }

    let fileData = {};
    let fileType = type; // Use provided type or auto-determine
    
    if (req.file) {
      // Auto-determine file type if not provided
      if (!fileType) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (['.pdf'].includes(ext)) fileType = 'PDF';
        else if (['.doc', '.docx'].includes(ext)) fileType = 'Word Document';
        else if (['.ppt', '.pptx'].includes(ext)) fileType = 'PowerPoint';
        else if (['.txt'].includes(ext)) fileType = 'Text File';
        else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) fileType = 'Image';
        else if (['.mp4'].includes(ext)) fileType = 'Video';
        else if (['.mp3'].includes(ext)) fileType = 'Audio';
        else if (['.zip', '.rar'].includes(ext)) fileType = 'Archive';
        else fileType = 'File';
      }
      
      // Calculate file size in readable format
      const fileSizeInBytes = req.file.size;
      const fileSizeFormatted = formatFileSize(fileSizeInBytes);
      
      fileData = {
        filePath: req.file.path,
        originalFileName: req.file.originalname,
        fileUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
        size: fileSizeFormatted
      };
    } else {
      fileData.size = req.body.size || 'Unknown size';
    }
    
    const contentData = {
      semester: parseInt(semester),
      subject,
      category,
      title,
      description,
      type: fileType, // Use the determined file type
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...fileData
    };

    // Try MongoDB first, fallback to JSON
    if (isMongoConnected()) {
      try {
        const newContent = new Content(contentData);
        const savedContent = await newContent.save();
        
        res.status(201).json({
          success: true,
          message: 'Content uploaded successfully to MongoDB',
          data: savedContent
        });
        return;
      } catch (mongoError) {
        console.error('MongoDB save failed, using JSON fallback:', mongoError.message);
      }
    }
    
    // Fallback to JSON file storage
    console.log('💾 Using JSON file storage (MongoDB not available)');
    contentData.id = Date.now().toString(); // Simple ID for JSON storage
    const allData = readDataFromFile();
    allData.push(contentData);
    
    if (writeDataToFile(allData)) {
      res.status(201).json({
        success: true,
        message: 'Content uploaded successfully (offline mode)',
        data: contentData
      });
    } else {
      throw new Error('Failed to save content');
    }
    
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading content',
      error: error.message
    });
  }
});

// Add new content (without file) - Updated for hierarchical structure (ADMIN ONLY)
app.post('/api/content', authenticateAdmin, async (req, res) => {
  try {
    const { semester, subject, category, title, description, type, size, tags, priority } = req.body;
    
    // Validation
    if (!semester || !subject || !category || !title || !description || !type || !size) {
      return res.status(400).json({
        success: false,
        message: 'Semester, subject, category, title, description, type, and size are required'
      });
    }
    
    const newContent = new Content({
      semester: parseInt(semester),
      subject,
      category,
      title,
      description,
      type,
      size,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      priority: priority || 'medium'
    });
    
    const savedContent = await newContent.save();
    
    res.status(201).json({
      success: true,
      message: 'Content added successfully',
      data: savedContent
    });
  } catch (error) {
    console.error('Error adding content:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding content',
      error: error.message
    });
  }
});

// Update content by ID (ADMIN ONLY)
app.put('/api/content/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedContent = await Content.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Content updated successfully',
      data: updatedContent
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
      error: error.message
    });
  }
});

// Delete content by ID (ADMIN ONLY)
app.delete('/api/content/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Attempting to delete content with ID: ${id}`);
    
    // Check if ID looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Try MongoDB first if connected and ID looks like ObjectId
    if (isMongoConnected() && isObjectId) {
      try {
        const deletedContent = await Content.findByIdAndDelete(id);
        
        if (!deletedContent) {
          console.log(`⚠️ Content not found in MongoDB: ${id}`);
          // Don't return here, try JSON fallback
        } else {
          // Also delete the physical file if it exists
          if (deletedContent.filePath && fs.existsSync(deletedContent.filePath)) {
            fs.unlinkSync(deletedContent.filePath);
            console.log(`🗑️ Deleted file: ${deletedContent.filePath}`);
          }
          
          console.log(`✅ Content deleted from MongoDB: ${id}`);
          res.json({
            success: true,
            message: 'Content deleted successfully',
            data: deletedContent
          });
          return;
        }
      } catch (mongoError) {
        console.error('MongoDB delete failed, using JSON fallback:', mongoError.message);
      }
    }
    
    // Fallback to JSON file storage
    console.log(`💾 Using JSON file storage for delete operation (ID: ${id})`);
    const allData = readDataFromFile();
    const itemIndex = allData.findIndex(item => item.id === id || item._id === id);
    
    if (itemIndex === -1) {
      console.log(`⚠️ Content not found in JSON storage: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Content not found in storage'
      });
    }
    
    const deletedItem = allData[itemIndex];
    console.log(`📋 Found item to delete: ${deletedItem.title}`);
    
    // Delete the physical file if it exists
    if (deletedItem.filePath && fs.existsSync(deletedItem.filePath)) {
      try {
        fs.unlinkSync(deletedItem.filePath);
        console.log(`🗑️ Deleted file: ${deletedItem.filePath}`);
      } catch (fileError) {
        console.warn(`⚠️ Could not delete file: ${fileError.message}`);
      }
    }
    
    // Remove from array
    allData.splice(itemIndex, 1);
    
    if (writeDataToFile(allData)) {
      console.log(`✅ Content deleted from JSON storage: ${id}`);
      res.json({
        success: true,
        message: 'Content deleted successfully (offline mode)',
        data: deletedItem
      });
    } else {
      throw new Error('Failed to save updated data');
    }
    
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
});

// Get statistics - Updated for hierarchical structure
app.get('/api/stats', async (req, res) => {
  try {
    let stats = {};
    
    if (isMongoConnected()) {
      const totalContent = await Content.countDocuments();
      const contentByCategory = await Content.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
      const contentBySemester = await Content.aggregate([
        { $group: { _id: '$semester', count: { $sum: 1 } } }
      ]);
      const contentBySubject = await Content.aggregate([
        { $group: { _id: { semester: '$semester', subject: '$subject' }, count: { $sum: 1 } } }
      ]);
      
      stats = {
        totalContent,
        contentByCategory,
        contentBySemester,
        contentBySubject
      };
    } else {
      // Fallback to JSON file storage
      const allData = readDataFromFile();
      stats = {
        totalContent: allData.length,
        contentByCategory: [],
        contentBySemester: [],
        contentBySubject: []
      };
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get hierarchical structure - New endpoint
app.get('/api/structure', async (req, res) => {
  try {
    let structure = {};
    
    if (isMongoConnected()) {
      // Get all unique semesters
      const semesters = await Content.distinct('semester');
      
      for (const semester of semesters) {
        structure[semester] = {};
        
        // Get all subjects for this semester
        const subjects = await Content.distinct('subject', { semester });
        
        for (const subject of subjects) {
          structure[semester][subject] = {};
          
          // Get all categories for this semester and subject
          const categories = await Content.distinct('category', { semester, subject });
          
          for (const category of categories) {
            const count = await Content.countDocuments({ semester, subject, category });
            structure[semester][subject][category] = count;
          }
        }
      }
    } else {
      // Fallback to JSON file storage
      const allData = readDataFromFile();
      allData.forEach(item => {
        const semester = item.semester;
        const subject = item.subject;
        const category = item.category || item.tab; // Support both old and new field names
        
        if (!structure[semester]) structure[semester] = {};
        if (!structure[semester][subject]) structure[semester][subject] = {};
        if (!structure[semester][subject][category]) structure[semester][subject][category] = 0;
        
        structure[semester][subject][category]++;
      });
    }
    
    res.json({
      success: true,
      data: structure,
      source: isMongoConnected() ? 'mongodb' : 'json'
    });
    
  } catch (error) {
    console.error('Error fetching structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hierarchical structure',
      error: error.message
    });
  }
});

// Get subjects for a specific semester
app.get('/api/semesters/:semester/subjects', async (req, res) => {
  try {
    const { semester } = req.params;
    let subjects = [];
    
    if (isMongoConnected()) {
      subjects = await Content.distinct('subject', { semester: parseInt(semester) });
    } else {
      const allData = readDataFromFile();
      const subjectSet = new Set();
      allData.forEach(item => {
        if (item.semester === parseInt(semester)) {
          subjectSet.add(item.subject);
        }
      });
      subjects = Array.from(subjectSet);
    }
    
    res.json({
      success: true,
      data: subjects,
      source: isMongoConnected() ? 'mongodb' : 'json'
    });
    
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message
    });
  }
});

// Get categories for a specific semester and subject
app.get('/api/semesters/:semester/subjects/:subject/categories', async (req, res) => {
  try {
    const { semester, subject } = req.params;
    let categories = [];
    
    if (isMongoConnected()) {
      categories = await Content.distinct('category', { 
        semester: parseInt(semester), 
        subject: decodeURIComponent(subject) 
      });
    } else {
      const allData = readDataFromFile();
      const categorySet = new Set();
      allData.forEach(item => {
        if (item.semester === parseInt(semester) && item.subject === decodeURIComponent(subject)) {
          categorySet.add(item.category || item.tab);
        }
      });
      categories = Array.from(categorySet);
    }
    
    res.json({
      success: true,
      data: categories,
      source: isMongoConnected() ? 'mongodb' : 'json'
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Enhanced server startup with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log(`💡 To fix this, run: taskkill /f /im node.exe`);
    console.log(`💡 Then restart the server`);
    process.exit(1);
  } else {
    console.error(`❌ Server error:`, err);
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      // Close MongoDB connection (modern Mongoose version)
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
      process.exit(1);
    }
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

export default app;
