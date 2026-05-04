const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Your User model schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  enrollmentNo: String
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/examplatform');
    
    const adminExists = await User.findOne({ email: 'admin@exam.com' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const admin = new User({
        name: 'Admin User',
        email: 'admin@exam.com',
        password: hashedPassword,
        role: 'admin',
        enrollmentNo: 'ADMIN001'
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@exam.com');
      console.log('Password: Admin123!');
    } else {
      console.log('Admin user already exists');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();