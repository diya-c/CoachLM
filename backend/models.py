from database import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sessions = db.relationship('InterviewSession', backref='user', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'email': self.email, 'created_at': self.created_at.isoformat()}


class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    interview_type = db.Column(db.String(50), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    current_difficulty = db.Column(db.String(20), nullable=False, default='Medium')  # live adaptive difficulty
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_completed = db.Column(db.Boolean, default=False)
    questions = db.relationship('Question', backref='session', lazy=True)

    def average_score(self):
        scored = [q.score for q in self.questions if q.score is not None]
        return round(sum(scored) / len(scored), 1) if scored else None

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'interview_type': self.interview_type,
            'company': self.company,
            'difficulty': self.difficulty,
            'current_difficulty': self.current_difficulty,
            'created_at': self.created_at.isoformat(),
            'is_completed': self.is_completed,
            'average_score': self.average_score(),
            'question_count': len(self.questions)
        }


class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    answer_text = db.Column(db.Text, nullable=True)
    score = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    question_number = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_text': self.question_text,
            'answer_text': self.answer_text,
            'score': self.score,
            'feedback': self.feedback,
            'question_number': self.question_number,
            'created_at': self.created_at.isoformat()
        }