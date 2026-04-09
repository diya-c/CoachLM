# CoachLM – AI Interview Coach with Memory

**Generative AI Mini Project · UE23CS342BA4**  
Team: Chinmayi Shravani | Diya Chandrashekhar | Jayani Sanga

---

## Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Frontend   | React (Vite) + TailwindCSS + Axios     |
| Backend    | Python Flask REST API                  |
| AI/LLM     | Groq API (Llama 3) or OpenAI           |
| RAG        | ChromaDB + sentence-transformers       |
| Database   | MySQL + SQLAlchemy ORM                 |
| Auth       | JWT + bcrypt                           |

---

## Project Architecture

```
coachlm/
├── backend/
│   ├── app.py                 # Flask entry point
│   ├── config.py              # Environment config
│   ├── database.py            # SQLAlchemy db instance
│   ├── models.py              # User, InterviewSession, Question models
│   ├── auth_routes.py         # POST /register, POST /login
│   ├── interview_routes.py    # Interview endpoints
│   ├── interviewer_agent.py   # Interviewer Agent (RAG + LLM)
│   ├── evaluator_agent.py     # Evaluator Agent (scoring + feedback)
│   ├── rag_module.py          # ChromaDB vector store
│   ├── memory_module.py       # Past session memory retrieval
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── SetupInterview.jsx
    │   │   └── Interview.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ScoreCard.jsx
    │   ├── App.jsx
    │   ├── api.js
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Step-by-Step Local Setup Guide

### Step 1 — Install Required Tools

**Node.js** (v18+):
- Download from https://nodejs.org
- Verify: `node -v` and `npm -v`

**Python** (v3.10+):
- Download from https://python.org
- Verify: `python --version`

**MySQL** (v8+):
- Download from https://dev.mysql.com/downloads/mysql/
- Or use XAMPP / WAMP for easy local setup
- Verify: `mysql --version`

---

### Step 2 — Get a Free Groq API Key (Recommended)

1. Go to https://console.groq.com
2. Sign up for a free account
3. Navigate to API Keys → Create new key
4. Copy the key — you'll use it in Step 4

> Alternatively, use an OpenAI API key from https://platform.openai.com

---

### Step 3 — Create the MySQL Database

Open your MySQL shell or client and run:

```sql
CREATE DATABASE coachlm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'coachlm_user'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON coachlm_db.* TO 'coachlm_user'@'localhost';
FLUSH PRIVILEGES;
```

> Or simply use `root` and your MySQL root password if running locally.

---

### Step 4 — Configure Backend Environment Variables

```bash
cd coachlm/backend
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/coachlm_db
JWT_SECRET_KEY=my-very-long-random-secret-key-change-this
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_key_here
QUESTIONS_PER_SESSION=5
CORS_ORIGINS=http://localhost:5173
```

---

### Step 5 — Install Backend Dependencies

```bash
cd coachlm/backend
python -m venv venv

# Activate virtual environment:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

> Note: `sentence-transformers` will download a small model (~90MB) on first run.

---

### Step 6 — Run the Backend Server

```bash
cd coachlm/backend
source venv/bin/activate   # if not already active

python app.py
```

You should see:
```
[CoachLM] Database tables created/verified.
[CoachLM] Starting server on http://localhost:5000
 * Running on http://0.0.0.0:5000
```

Test it: open http://localhost:5000/health — you should see `{"status": "CoachLM API is running"}`

---

### Step 7 — Install Frontend Dependencies

Open a **new terminal**:

```bash
cd coachlm/frontend
npm install
```

---

### Step 8 — Run the Frontend Server

```bash
cd coachlm/frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

---

### Step 9 — Access the Application

Open your browser and go to: **http://localhost:5173**

---

## Example Test Flow

### 1. Register a new account
- Click **Get Started Free** on the landing page
- Enter: Name = `Test User`, Email = `test@example.com`, Password = `test123`
- You'll be redirected to the Dashboard

### 2. Start an Interview
- Click **New Interview** or **Start Interview**
- Select: Company = `Google`, Type = `Technical`, Difficulty = `Medium`
- Click **Start Interview**

### 3. Answer Questions
- The AI Interviewer will ask a question in the chat
- Type your answer and press **Enter** (or click the Send button)
- The Evaluator Agent will score your answer and show:
  - Score out of 10
  - Correctness, Relevance, Clarity sub-scores
  - Strengths and areas to improve
  - Detailed feedback
- The next adaptive question will appear

### 4. Complete the Session
- After 5 questions, the session ends and you see your overall grade
- Click **View Dashboard** to see your score history and performance graph

### 5. Track Improvement
- Start more sessions to see the performance trend chart
- The AI will use your past session history to adapt future questions

---

## API Endpoints

| Method | Endpoint                    | Auth | Description                    |
|--------|-----------------------------|------|--------------------------------|
| POST   | `/register`                 | No   | Create new user account        |
| POST   | `/login`                    | No   | Login, receive JWT token       |
| GET    | `/health`                   | No   | API health check               |
| POST   | `/start-interview`          | Yes  | Start session, get Q1          |
| POST   | `/submit-answer`            | Yes  | Submit answer, get evaluation  |
| GET    | `/sessions`                 | Yes  | List all user sessions         |
| GET    | `/session-history/<id>`     | Yes  | Full Q&A for one session       |

---

## GenAI Concepts Demonstrated

| Concept        | Implementation                                              |
|----------------|-------------------------------------------------------------|
| LLM            | Groq/OpenAI API used for question generation and evaluation |
| RAG            | ChromaDB vector store with sentence-transformer embeddings  |
| Agent System   | `InterviewerAgent` + `EvaluatorAgent` as separate modules   |
| Persistent Memory | `MemoryModule` reads past sessions from MySQL to adapt LLM prompts |
| Auth           | bcrypt password hashing + JWT tokens                        |

---

## Troubleshooting

**MySQL connection error**: Check your `DATABASE_URL` in `.env`. Ensure MySQL is running.

**Groq API error**: Verify `GROQ_API_KEY` in `.env`. Check https://console.groq.com for usage limits.

**ChromaDB / sentence-transformers slow on first run**: It downloads a ~90MB model. Wait for it to finish.

**CORS error in browser**: Make sure `CORS_ORIGINS=http://localhost:5173` is set in backend `.env`.

**Port conflict**: Backend uses port 5000, frontend uses 5173. Make sure both are free.
