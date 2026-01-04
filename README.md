# Anonymous Course Feedback & Survey System

A full-stack anonymous course feedback and survey system for colleges, built with Next.js, Node.js + Express.js, and MongoDB Atlas.

## Project Structure

```
fb_and_survey/
├── backend/              # Node.js + Express.js backend
│   ├── config/          # Configuration files
│   ├── constants/       # Constants and enums
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   ├── utils/           # Utility functions
│   ├── logs/            # Log files (generated)
│   └── server.js        # Entry point
├── frontend/            # Next.js frontend
│   ├── app/             # Next.js app directory
│   │   ├── student/     # Student interface
│   │   ├── admin/       # Admin interface
│   │   └── page.js      # Home (redirects to student)
│   ├── lib/             # Utility libraries
│   └── public/          # Static assets
└── README.md
```

## Features

- **Anonymous Student System**: Browser-bound, time-limited student IDs (2-day expiry)
- **Mobile-First Student UI**: Ant Design with responsive design for mobile devices
- **Desktop Admin UI**: Full-featured admin dashboard with reports and statistics
- **Likert Scale Questions**: 5-point scale (Strongly Disagree to Strongly Agree)
- **Partial Submissions**: Students can submit survey and feedback separately
- **Duplicate Prevention**: One submission per course per student ID
- **Comprehensive Logging**: Winston logger with file and console transports
- **JWT Authentication**: Secure admin authentication

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- Ant Design (antd)
- Mobile-first responsive design

### Backend
- Node.js
- Express.js
- REST APIs only
- JWT authentication for admin

### Database
- MongoDB Atlas
- Mongoose ODM

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
LOG_LEVEL=info
JWT_SECRET=your-secret-key-change-in-production
```

5. Create an admin user:
```bash
npm run create-admin <username> <password>
```

6. Start the development server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Student APIs

- `GET /api/departments/active` - Get active departments
- `POST /api/student/generate-id` - Generate anonymous student ID
- `GET /api/student/courses` - Get active courses for dept/year/semester
- `GET /api/student/status` - Get submission status for courses
- `POST /api/student/submit` - Submit survey/feedback responses

### Admin APIs (Requires JWT)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/departments` - Get all departments
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/:id/toggle` - Toggle department active status
- `POST /api/admin/course` - Create course
- `PUT /api/admin/course/:id` - Update course
- `GET /api/admin/report` - Get reports for dept/year/semester

## Database Schemas

### Department
- `code`: String (unique, e.g., "CSE")
- `name`: String
- `active`: Boolean
- `createdAt`: Date

### Admin
- `username`: String (unique)
- `passwordHash`: String
- `createdAt`: Date

### Counter
- `deptCode`: String
- `semester`: Number (1 or 2)
- `year`: Number
- `current`: Number (incremented atomically)

### Course
- `courseCode`: String
- `courseName`: String
- `deptCode`: String
- `semester`: Number
- `year`: Number
- `surveyQuestions`: Array of {questionId, text}
- `feedbackQuestions`: Array of {questionId, text}
- `isActive`: Boolean
- `createdAt`: Date

### SurveyResponse
- `courseId`: ObjectId
- `studentId`: String
- `answers`: Array of {questionId, value (1-5)}
- `submittedAt`: Date

### FeedbackResponse
- `courseId`: ObjectId
- `studentId`: String
- `answers`: Array of {questionId, value (1-5)}
- `recommendation`: String (optional)
- `submittedAt`: Date

## Student ID Format

Student IDs are generated in the format: `<DEPT><YEAR><SEM><SEQ>`

Example: `CSE202607023`
- DEPT: CSE
- YEAR: 2026
- SEM: 0 (semester 1) or 1 (semester 2)
- SEQ: 023 (3-digit sequence number)

## Student Flow

1. App loads and checks for existing session in localStorage
2. If session expired or missing, student selects department, year, semester
3. Backend generates new student ID
4. Student ID stored in localStorage (2-day expiry)
5. Student views active courses for selected dept/year/semester
6. Student sees submission status (submitted/pending) for each course
7. Student selects a course and answers survey/feedback questions
8. Student submits responses (partial submissions allowed)

## Admin Flow

1. Admin logs in with username/password
2. Admin can create/edit departments
3. Admin can create/edit courses with survey and feedback questions
4. Admin can activate/deactivate departments and courses
5. Admin selects dept/year/semester to view reports
6. Admin views:
   - Average scores per question
   - Response counts
   - Likert distribution
   - Anonymous recommendations

## Constants & Enums

### Likert Scale
- `STRONGLY_DISAGREE = 1`
- `DISAGREE = 2`
- `NEUTRAL = 3`
- `AGREE = 4`
- `STRONGLY_AGREE = 5`

### Student ID Expiry
- `STUDENT_ID_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000` (2 days)

## Logging

The backend uses Winston for logging. Logs are written to:
- Console (development mode with colors, production mode as JSON)
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs

## Development

- Backend: `npm run dev` (uses node --watch)
- Frontend: `npm run dev` (Next.js dev server)

## Production

- Backend: `npm start`
- Frontend: `npm run build && npm start`

## Security Notes

- No CORS configured (as per requirements)
- Student system is completely anonymous
- No personal data collected from students
- JWT tokens for admin authentication
- Passwords hashed with bcrypt
- Compound unique indexes prevent duplicate submissions

## Important Notes

- Students are anonymous - no authentication required
- Student IDs are browser-bound and expire after 2 days
- One submission per course per student ID (enforced by unique index)
- Partial submissions allowed (survey and feedback can be submitted separately)
- System is statistical, not forensic - designed for aggregate analysis
