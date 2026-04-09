# CoachLM – AI Interview Coach with Memory

---

## What is CoachLM?

CoachLM is a full-stack AI-powered interview preparation platform that simulates
realistic Technical and HR interviews. Unlike static interview tools, CoachLM:

- **Remembers** your past sessions and adapts to your performance
- **Dynamically adjusts** question difficulty based on your answers
- **Asks follow-up questions** based on what you just said
- **Evaluates** your answers with detailed scoring and feedback
- Uses **RAG** to retrieve company-specific interview questions

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React (Vite) + TailwindCSS + Axios + Recharts   |
| Backend    | Python Flask REST API                           |
| LLM        | Groq API (llama-3.3-70b-versatile)              |
| RAG        | Sentence Transformers + Cosine Similarity       |
| Database   | MySQL + SQLAlchemy ORM                          |
| Auth       | JWT + bcrypt                                    |

---

## GenAI Concepts Used

### 1. Large Language Model (LLM)
Uses Groq's `llama-3.3-70b-versatile` for:
- Generating interview questions
- Evaluating user answers
- Providing detailed feedback

### 2. Retrieval-Augmented Generation (RAG)
- A dataset of company-specific interview questions is embedded using
  `sentence-transformers/all-MiniLM-L6-v2`
- When an interview starts, semantically similar questions are retrieved
  via cosine similarity and fed to the LLM as context
- This ensures questions are relevant to the target company and role

### 3. Agent Architecture
Two specialized agents:
- **Interviewer Agent** — generates adaptive, contextual follow-up questions
- **Evaluator Agent** — scores answers on correctness (50%), relevance (30%), clarity (20%)

### 4. Persistent Memory
- Past interview sessions are stored in MySQL
- Before generating each question, the system reads the user's history
- Weak areas, average scores, and improvement trends are injected into the LLM prompt
- Questions adapt based on long-term performance across multiple sessions

---

## System Architecture

```
User → React Frontend → Flask API → Interviewer Agent → Groq LLM
                                  → Evaluator Agent  → Groq LLM
                                           ↕
                                       MySQL DB
                                           ↕
                           RAG Module (Sentence Transformers)
                                           ↕
                                Memory Module (past sessions)
```

---

## Project Structure

```
coachlm/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── auth_routes.py
│   ├── interview_routes.py
│   ├── interviewer_agent.py
│   ├── evaluator_agent.py
│   ├── rag_module.py
│   ├── memory_module.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── api.js
        ├── index.css
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── SetupInterview.jsx
        │   └── Interview.jsx
        └── components/
            ├── Navbar.jsx
            └── ScoreCard.jsx
```

---

## API Endpoints

| Method | Endpoint                    | Auth | Description                        |
|--------|-----------------------------|------|------------------------------------|
| POST   | `/register`                 | No   | Create new user account            |
| POST   | `/login`                    | No   | Login, receive JWT token           |
| GET    | `/health`                   | No   | API health check                   |
| POST   | `/start-interview`          | Yes  | Start session, get first question  |
| POST   | `/submit-answer`            | Yes  | Submit answer, get evaluation      |
| POST   | `/end-interview`            | Yes  | End session, get final summary     |
| GET    | `/sessions`                 | Yes  | List all user sessions             |
| GET    | `/session-history/<id>`     | Yes  | Full Q&A for one session           |

---

## How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8+
- Groq API key (free at https://console.groq.com)

### Step 1 — Create MySQL Database
```sql
CREATE DATABASE coachlm_db;
```

### Step 2 — Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:
```
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost/coachlm_db
JWT_SECRET_KEY=any-long-random-string
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here
CORS_ORIGINS=http://localhost:5173
```

Run the backend:
```bash
python app.py
```

### Step 3 — Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Step 4 — Access
Open **http://localhost:5173** in your browser.

---

## Evaluation Metrics

| Metric       | Weight | Description                              |
|--------------|--------|------------------------------------------|
| Correctness  | 50%    | Technical accuracy of the answer         |
| Relevance    | 30%    | How directly it addresses the question   |
| Clarity      | 20%    | Structure and communication quality      |

---

## How the Interview Works

1. User selects company, interview type (Technical/HR), and starting difficulty
2. The **RAG module** retrieves relevant company-specific questions as context
3. The **Interviewer Agent** generates the first question using RAG + user memory
4. User types their answer and submits
5. The **Evaluator Agent** scores the answer and provides detailed feedback
6. The **Memory Module** updates the user's performance profile
7. The **Interviewer Agent** generates the next question — either a follow-up
   based on the previous answer or a new topic
8. Difficulty automatically increases if average score ≥ 7.5, decreases if ≤ 4.0
9. User clicks **End Interview** whenever they want to stop
10. A final summary with overall score and grade is shown

---

## Key Features

- ✅ Continuous interview — no fixed question limit, user decides when to stop
- ✅ Adaptive difficulty — automatically adjusts based on recent scores
- ✅ Conversational follow-ups — next question references your previous answer
- ✅ Persistent memory — remembers performance across multiple sessions
- ✅ RAG-powered — company-specific question retrieval using vector similarity
- ✅ LLM-as-judge evaluation — structured rubric-based answer scoring
- ✅ JWT authentication — secure, user-specific data isolation
- ✅ Performance dashboard — score history and improvement trend graph


