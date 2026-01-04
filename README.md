# FB and Survey Application

A full-stack application built with Next.js frontend, Node.js + Express.js backend, and MongoDB Atlas database.

## Project Structure

```
fb_and_survey/
├── backend/          # Node.js + Express.js backend
│   ├── config/       # Configuration files
│   ├── middleware/   # Express middleware
│   ├── routes/       # API routes
│   ├── utils/        # Utility functions
│   ├── logs/         # Log files (generated)
│   └── server.js     # Entry point
├── frontend/         # Next.js frontend
│   ├── app/          # Next.js app directory
│   ├── lib/          # Utility libraries
│   └── public/       # Static assets
└── README.md
```

## Features

- **Frontend**: Next.js 14 with Ant Design UI components
- **Backend**: Node.js + Express.js with proper error handling
- **Database**: MongoDB Atlas connection
- **Logging**: Winston logger with file and console transports
- **Code Quality**: ESLint configuration for both frontend and backend

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

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
```

5. Start the development server:
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

3. Create a `.env.local` file (copy from `.env.example`):
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API information endpoint

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

## Notes

- CORS is not configured as per requirements
- All server-side requests are logged using express-winston
- Error handling middleware is set up for proper error responses
- MongoDB connection includes error handling and automatic reconnection

