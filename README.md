# Sports Scheduler Full-Stack Application

A comprehensive web application for managing sports events and sessions, built with React, Express.js, and PostgreSQL.

## Features

### Authentication & Authorization
- JWT-based authentication with role-based access control
- Admin and Player user roles with different permissions
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### Sports Management
- Administrators can create and manage sports types
- Each sport has configurable maximum player limits
- Sports catalog with descriptions and participant limits

### Session Management
- Create sports sessions with teams, venues, dates, and times
- Join and leave sessions with real-time participant tracking
- Session cancellation with reason tracking
- Automatic participant count management

### Reporting & Analytics
- Dashboard with key statistics and metrics
- Sport popularity charts and session analytics
- Date-range filtering for reports
- Visual charts using Recharts library

### User Experience
- Responsive design with Tailwind CSS
- Modern, professional interface with smooth animations
- Role-based navigation and dashboards
- Real-time updates and notifications

## Tech Stack

### Frontend
- **React 18** - Modern component-based UI library
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Recharts** - Data visualization library
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and dev server

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sports-scheduler
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb sports_scheduler
   
   # Copy environment file and configure
   cp .env.example .env
   
   # Edit .env with your database credentials
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_NAME=sports_scheduler
   # DB_USER=postgres
   # DB_PASSWORD=your_password
   # JWT_SECRET=your-secret-key
   ```

4. **Initialize Database**
   ```bash
   npm run init-db
   ```

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start separately:
   # Frontend (http://localhost:5173)
   npm run dev
   
   # Backend (http://localhost:5000)
   npm run dev:server
   ```

### Default Admin Account
After running the database initialization, you can log in with:
- **Email**: admin@example.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Sports Management
- `GET /api/sports` - Get all sports
- `POST /api/sports` - Create sport (admin only)
- `PUT /api/sports/:id` - Update sport (admin only)

### Session Management
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create session
- `POST /api/sessions/:id/join` - Join session
- `DELETE /api/sessions/:id/leave` - Leave session
- `PUT /api/sessions/:id/cancel` - Cancel session
- `GET /api/sessions/my-created` - Get user's created sessions
- `GET /api/sessions/my-joined` - Get user's joined sessions

### Reports
- `GET /api/reports/stats` - Get dashboard statistics
- `GET /api/reports/sport-popularity` - Get sport popularity data
- `GET /api/reports/sessions-by-date` - Get sessions by date

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `name` - User's full name
- `role` - 'admin' or 'player'
- `created_at` - Account creation timestamp

### Sports Table
- `id` - Primary key
- `name` - Sport name (unique)
- `description` - Sport description
- `max_players` - Maximum players per session
- `created_by` - Reference to user who created it
- `created_at` - Creation timestamp

### Sessions Table
- `id` - Primary key
- `sport_id` - Reference to sport
- `title` - Session title
- `description` - Session description
- `venue` - Location
- `date` - Session date
- `time` - Session time
- `team_a` - First team name
- `team_b` - Second team name
- `max_participants` - Maximum participants
- `current_participants` - Current participant count
- `created_by` - Reference to creator
- `status` - 'active' or 'cancelled'
- `cancellation_reason` - Reason for cancellation
- `created_at` - Creation timestamp

### Session Participants Table
- `id` - Primary key
- `session_id` - Reference to session
- `user_id` - Reference to user
- `joined_at` - Join timestamp

## Deployment

### Environment Variables
Set the following environment variables for production:

```env
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=sports_scheduler
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Build for Production
```bash
# Build frontend
npm run build

# Start production server
cd server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.