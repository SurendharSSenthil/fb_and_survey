import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import Admin from '../models/Admin.js'

dotenv.config()

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('Connected to MongoDB')

    const username = process.argv[2]
    const password = process.argv[3]

    if (!username || !password) {
      console.error('Usage: node scripts/createAdmin.js <username> <password>')
      process.exit(1)
    }

    // Check if admin already exists
    const existing = await Admin.findOne({ username: username.toLowerCase() })
    if (existing) {
      console.error('Admin with this username already exists')
      process.exit(1)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin
    const admin = await Admin.create({
      username: username.toLowerCase(),
      passwordHash
    })

    console.log(`Admin created successfully: ${admin.username}`)
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error creating admin:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

createAdmin()

