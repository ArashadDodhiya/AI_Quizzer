# 🧠 AI Quizzer - Intelligent Quiz Management System

A microservice-based AI-powered quiz application with advanced features including adaptive difficulty, real-time hints, and comprehensive score tracking.

## 🌟 Features

### Core Functionalities ✅
- **🔐 Authentication System** - Mock JWT-based authentication
- **📝 Quiz Management** - Complete CRUD operations for quizzes
- **🤖 AI Integration** - Groq-powered quiz generation and evaluation
- **📊 Score Tracking** - Comprehensive quiz history and analytics
- **🔄 Quiz Retry System** - Retake quizzes with score comparison
- **🎯 Leaderboard** - Top performers by grade and subject

### AI-Powered Features 🚀
- **💡 Hint Generation** - AI provides contextual hints for questions
- **📈 Result Suggestions** - Personalized improvement recommendations
- **⚡ Adaptive Difficulty** - Dynamic question difficulty based on performance history
- **🎨 Smart Question Generation** - Grade-appropriate content creation

### Bonus Features 🌟
- **📧 Email Notifications** - Quiz results and achievements via email
- **⚡ Redis Caching** - Optimized performance with intelligent caching
- **🏆 Advanced Leaderboard** - Comprehensive ranking system
- **🐳 Docker Containerization** - Production-ready deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Service    │
│   (Optional)    │◄──►│   (Node.js)     │◄──►│   (Groq API)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Database      │    │   Cache Layer   │
                    │   (MongoDB)     │    │   (Redis)       │
                    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- Redis 7.0+ (optional, for caching)
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-quizzer
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-quizzer
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE_TIME=7d

# AI Service (Groq)
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=mixtral-8x7b-32768

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. **Database Setup**
```bash
# Start MongoDB (if not using Docker)
mongod

# Run database migrations
npm run migrate
```

5. **Start the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Using Docker 🐳

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📡 API Documentation

### Base URL
```
Production: https://your-app.herokuapp.com
Local: http://localhost:4000
```

### Authentication
All quiz endpoints require JWT authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### 🔐 Authentication
```http
POST /api/auth/login
```
**Request:**
```json
{
  "username": "student1"
}
```

#### 📝 Quiz Management
```http
POST /api/quizzes/generate
```
**Request:**
```json
{
  "grade": 5,
  "subject": "Mathematics",
  "totalQuestions": 10,
  "maxScore": 100,
  "difficulty": "adaptive"
}
```

```http
POST /api/quizzes/submit
```
**Request:**
```json
{
  "quizId": "quiz_id_here",
  "responses": [
    {
      "questionId": "q1",
      "userResponse": "A"
    }
  ]
}
```

#### 📊 Quiz History & Analytics
```http
GET /api/quizzes/history?grade=5&subject=Math&from=2024-01-01&to=2024-12-31
```

#### 🎯 Leaderboard
```http
GET /api/leaderboard?grade=5&subject=Math&limit=10
```

#### 💡 AI Features
```http
GET /api/quizzes/:quizId/hint?questionId=:questionId
```

### Interactive API Testing
Use the provided HTML documentation for live API testing: [API Documentation](./docs/api-documentation.html)

## 🤖 AI Integration Details

### Groq API Integration
- **Primary Model:** `mixtral-8x7b-32768`
- **Backup Model:** `llama2-70b-4096`
- **Usage:**
  - Quiz generation with grade-appropriate content
  - Answer evaluation and scoring
  - Hint generation for struggling students
  - Performance analysis and suggestions

### AI Features Implementation

#### 1. **Adaptive Difficulty System**
```javascript
// Algorithm considers:
- Previous quiz scores (last 5 attempts)
- Subject-specific performance
- Time taken per question
- Hint usage frequency

// Difficulty Distribution:
- Beginner: 60% Easy, 30% Medium, 10% Hard
- Intermediate: 30% Easy, 50% Medium, 20% Hard  
- Advanced: 20% Easy, 30% Medium, 50% Hard
```

#### 2. **Hint Generation**
```javascript
// Context-aware hints based on:
- Question difficulty level
- Student's previous attempts
- Common misconceptions
- Learning objectives
```

#### 3. **Result Analysis**
```javascript
// AI analyzes mistakes to provide:
- Specific concept gaps
- Study recommendations
- Practice question suggestions
- Learning resource links
```

## 💾 Database Design

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String (optional),
  createdAt: Date,
  lastLogin: Date,
  preferences: {
    subjects: [String],
    difficulty: String
  }
}
```

#### Quizzes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  grade: Number,
  subject: String,
  title: String,
  questions: [{
    questionId: ObjectId,
    question: String,
    options: [String],
    correctAnswer: String,
    difficulty: String,
    explanation: String,
    hints: [String]
  }],
  maxScore: Number,
  difficulty: String,
  createdAt: Date,
  status: String // 'active', 'completed', 'archived'
}
```

#### Submissions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  quizId: ObjectId,
  responses: [{
    questionId: ObjectId,
    userResponse: String,
    correctAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number,
    hintsUsed: Number
  }],
  score: Number,
  maxScore: Number,
  percentage: Number,
  submittedAt: Date,
  aiSuggestions: [String],
  attempt: Number
}
```

### Database Migrations

Run the following to set up your database:
```bash
npm run migrate:up    # Run all migrations
npm run migrate:down  # Rollback migrations
npm run seed         # Seed sample data
```

## 🗂️ Project Structure

```
ai-quizzer/
├── src/
│   ├── controllers/        # Route controllers
│   │   ├── authController.js
│   │   ├── quizController.js
│   │   └── leaderboardController.js
│   ├── models/            # Database models
│   │   ├── User.js
│   │   ├── Quiz.js
│   │   └── Submission.js
│   ├── services/          # Business logic
│   │   ├── aiService.js
│   │   ├── quizService.js
│   │   ├── emailService.js
│   │   └── cacheService.js
│   ├── middleware/        # Express middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── rateLimit.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── quizzes.js
│   │   └── leaderboard.js
│   ├── utils/             # Utility functions
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── helpers.js
│   └── app.js            # Express app setup
├── migrations/            # Database migrations
├── tests/                # Test suites
├── docs/                 # Documentation
├── docker-compose.yml    # Docker configuration
├── Dockerfile           # Container definition
└── README.md           # This file
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# Coverage report
npm run test:coverage
```

### Manual Testing
1. Import the Postman collection: `./docs/AI-Quizzer-Collection.json`
2. Set environment variables in Postman
3. Run the collection tests
4. Use the interactive HTML documentation for browser testing

## 🚀 Deployment

### Heroku Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-ai-quizzer-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set GROQ_API_KEY=your-key
heroku config:set JWT_SECRET=your-secret

# Add MongoDB Atlas
heroku addons:create mongolab:sandbox

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Deploy
git push heroku main
```

### Digital Ocean / AWS Deployment
See `deployment/` folder for platform-specific instructions.

## 🎯 Performance Features

### Redis Caching Strategy
```javascript
// Cached Data:
- Quiz templates (TTL: 1 hour)
- User quiz history (TTL: 30 minutes)  
- Leaderboard data (TTL: 15 minutes)
- AI-generated content (TTL: 24 hours)

// Cache Keys:
- quiz:template:{grade}:{subject}
- user:{userId}:history
- leaderboard:{grade}:{subject}
- ai:hint:{questionId}
```

### Rate Limiting
```javascript
// API Rate Limits:
- Authentication: 10 req/min per IP
- Quiz Generation: 5 req/min per user
- General APIs: 100 req/min per user
- AI Operations: 20 req/min per user
```

## 📧 Email Integration

Configure SMTP settings in `.env` for:
- Quiz completion notifications
- Performance reports
- Achievement badges
- Weekly progress summaries

## 🐛 Known Issues

1. **AI Service Latency**: Groq API responses can take 2-5 seconds during peak hours
   - **Mitigation**: Implemented caching and request queuing

2. **MongoDB Connection Pool**: High concurrent requests may exhaust connection pool
   - **Mitigation**: Increased pool size and added connection retry logic

3. **Quiz State Management**: Large quizzes (50+ questions) may cause memory issues
   - **Mitigation**: Implemented pagination and lazy loading

## 📊 Monitoring & Logging

### Application Logs
```bash
# View logs
npm run logs

# Error logs only
npm run logs:error

# Performance metrics
npm run metrics
```

### Health Checks
```http
GET /api/health
GET /api/health/database
GET /api/health/ai-service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For technical support or questions:
- **Email**: hiring.support@playpowerlabs.com
- **Documentation**: [Interactive API Docs](./docs/api-documentation.html)
- **Issues**: Create a GitHub issue for bug reports

## 🙏 Acknowledgments

- **Groq AI** for providing the AI inference API
- **MongoDB** for the flexible document database
- **Redis** for high-performance caching
- **Heroku** for seamless deployment platform

---

**Built with ❤️ for PlayPower Labs**

> **Note**: This application is built as part of a technical assessment. It demonstrates modern web development practices, AI integration, and scalable architecture design.
