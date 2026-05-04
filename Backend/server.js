const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Define allowed origins (add both Vercel URLs)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://exam-platform-ecru.vercel.app',      // Old URL
  'https://atulgethub-exam-platform.vercel.app', // Current URL
  process.env.CLIENT_URL
].filter(Boolean);

// Socket.IO with CORS
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS middleware - Dynamic origin checking
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin}`);
      // For development, still allow but log warning
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from ${origin}`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.sendStatus(200);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// MongoDB Atlas Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 MongoDB disconnected, attempting to reconnect...');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

// Import Models
const User = require('./models/User');
const Exam = require('./models/Exam');
const CheatingLog = require('./models/CheatingLog');
const Contact = require('./models/Contact');

// Import Routes
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');
const adminRoutes = require('./routes/admin');
const resultsRoutes = require('./routes/results');
const contactRoutes = require('./routes/contact');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/contact', contactRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date(),
    allowedOrigins: allowedOrigins
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Exam Platform API',
    version: '1.0.0',
    status: 'running'
  });
});

// WebSocket for real-time proctoring
const examRooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-exam', ({ examId, userId }) => {
    socket.join(`exam-${examId}`);
    socket.examId = examId;
    socket.userId = userId;
    
    if (!examRooms.has(examId)) {
      examRooms.set(examId, new Map());
    }
    examRooms.get(examId).set(userId, socket.id);
    
    console.log(`User ${userId} joined exam ${examId}`);
  });

  socket.on('cheating-attempt', async (data) => {
    const { examId, userId, violationType, details } = data;
    
    try {
      const cheatingLog = new CheatingLog({
        exam: examId,
        student: userId,
        violationType,
        details,
        timestamp: new Date()
      });
      await cheatingLog.save();
      
      const violationCount = await CheatingLog.countDocuments({
        exam: examId,
        student: userId
      });
      
      io.to(`exam-${examId}`).emit('cheating-alert', {
        userId,
        violationType,
        violationCount,
        timestamp: new Date(),
        details
      });
      
      if (violationCount >= 3) {
        io.to(socket.id).emit('auto-submit', {
          message: 'Multiple violations detected. Exam auto-submitted.'
        });
      }
    } catch (error) {
      console.error('Error handling cheating attempt:', error);
    }
  });

  socket.on('disconnect', () => {
    if (socket.examId && examRooms.get(socket.examId)) {
      const room = examRooms.get(socket.examId);
      room.delete(socket.userId);
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`🌐 Test API: http://localhost:${PORT}/api/test`);
  console.log(`🔗 CORS enabled for origins:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
});