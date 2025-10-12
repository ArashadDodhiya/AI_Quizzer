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
- Deploy link
```bash
  https://ai-quizzer-3.onrender.com
```

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- Render with Docker environment

### Installation

1. **Clone the repository**
```bash
git clone [<repository-url>](https://github.com/ArashadDodhiya/AI_Quizzer/edit/master)
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

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE_TIME=7d

# AI Service (Groq)
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant

# Email Service (Optional)(not implemented)
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

### Database Migrations

Run the following to set up your database:
```bash
npm run migrate:up    # Run all migrations
npm run migrate:down  # Rollback migrations
npm run seed         # Seed sample data

```

### Manual Testing
1. Import the Postman collection: `AI-Quizzer-Collection.json`
2. Set environment variables in Postman
3. Run the collection tests
   
```
```
## 🐛 Known Issues

1. **AI Service Latency**: Groq API responses can take 2-5 seconds during peak hours
   - **Mitigation**: Implemented caching and request queuing

2. **MongoDB Connection Pool**: High concurrent requests may exhaust connection pool
   - **Mitigation**: Increased pool size and added connection retry logic

3. **Quiz State Management**: Large quizzes (50+ questions) may cause memory issues
   - **Mitigation**: Implemented pagination and lazy loading


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- **Groq AI** for providing the AI inference API
- **MongoDB** for the flexible document database
- **Render** for seamless deployment platform with Docker env

---


> **Note**: This application is built as part of a technical assessment. It demonstrates modern web development practices, AI integration, and scalable architecture design.
