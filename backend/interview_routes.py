"""
Interview Routes
All routes require a valid JWT token in the Authorization header.
POST /start-interview   — create a new session and generate first question
POST /submit-answer     — evaluate an answer and generate the next question
GET  /sessions          — list all sessions for the current user
GET  /session-history/<id> — get all Q&A for a specific session
"""
from flask import Blueprint, request, jsonify, Response
from functools import wraps
import jwt
from config import Config
from database import db
from models import User, InterviewSession, Question
from interviewer_agent import interviewer_agent
from evaluator_agent import evaluator_agent

interview_bp = Blueprint('interview', __name__)

@interview_bp.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(payload['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


@interview_bp.route('/start-interview', methods=['POST'])
@token_required
def start_interview(current_user):
    data = request.get_json()
    if not data or not all(k in data for k in ('interview_type', 'company', 'difficulty')):
        return jsonify({'error': 'interview_type, company, and difficulty are required'}), 400

    session = InterviewSession(
        user_id=current_user.id,
        interview_type=data['interview_type'],
        company=data['company'],
        difficulty=data['difficulty'],
        current_difficulty=data['difficulty']
    )
    db.session.add(session)
    db.session.commit()

    result = interviewer_agent.generate_question(
        user_id=current_user.id,
        session_id=session.id,
        company=data['company'],
        interview_type=data['interview_type'],
        difficulty=data['difficulty'],
        question_number=1,
        previous_qa=[],
        current_difficulty=data['difficulty']
    )

    question = Question(
        session_id=session.id,
        question_text=result['question'],
        question_number=1
    )
    db.session.add(question)
    session.current_difficulty = result['new_difficulty']
    db.session.commit()

    return jsonify({
        'session_id': session.id,
        'question_id': question.id,
        'question': result['question'],
        'question_number': 1,
        'current_difficulty': result['new_difficulty']
    }), 201


@interview_bp.route('/submit-answer', methods=['POST'])
@token_required
def submit_answer(current_user):
    data = request.get_json()
    if not data or not all(k in data for k in ('session_id', 'question_id', 'answer')):
        return jsonify({'error': 'session_id, question_id, and answer are required'}), 400

    session = InterviewSession.query.filter_by(id=data['session_id'], user_id=current_user.id).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    question = Question.query.filter_by(id=data['question_id'], session_id=data['session_id']).first()
    if not question:
        return jsonify({'error': 'Question not found'}), 404

    evaluation = evaluator_agent.evaluate_answer(
        question=question.question_text,
        answer=data['answer'].strip(),
        interview_type=session.interview_type,
        company=session.company,
        difficulty=session.current_difficulty
    )

    question.answer_text = data['answer'].strip()
    question.score = evaluation['score']
    question.feedback = evaluation['feedback']
    db.session.commit()

    all_questions = Question.query.filter_by(session_id=session.id)\
        .order_by(Question.question_number).all()
    previous_qa = [
        {'question': q.question_text, 'answer': q.answer_text or '', 'score': q.score}
        for q in all_questions if q.answer_text is not None
    ]

    next_q_number = len(all_questions) + 1
    result = interviewer_agent.generate_question(
        user_id=current_user.id,
        session_id=session.id,
        company=session.company,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        question_number=next_q_number,
        previous_qa=previous_qa,
        current_difficulty=session.current_difficulty
    )

    next_question = Question(
        session_id=session.id,
        question_text=result['question'],
        question_number=next_q_number
    )
    db.session.add(next_question)
    session.current_difficulty = result['new_difficulty']
    db.session.commit()

    return jsonify({
        'evaluation': evaluation,
        'next_question': {
            'id': next_question.id,
            'text': result['question'],
            'question_number': next_q_number
        },
        'current_difficulty': result['new_difficulty']
    }), 200


@interview_bp.route('/end-interview', methods=['POST'])
@token_required
def end_interview(current_user):
    data = request.get_json()
    session = InterviewSession.query.filter_by(id=data['session_id'], user_id=current_user.id).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    session.is_completed = True
    db.session.commit()

    questions = Question.query.filter_by(session_id=session.id).all()
    scores = [q.score for q in questions if q.score is not None]
    avg = round(sum(scores) / len(scores), 1) if scores else 0

    return jsonify({
        'summary': {
            'session_id': session.id,
            'company': session.company,
            'interview_type': session.interview_type,
            'total_questions': len([q for q in questions if q.answer_text]),
            'average_score': avg,
            'grade': _score_to_grade(avg)
        }
    }), 200


@interview_bp.route('/sessions', methods=['GET'])
@token_required
def get_sessions(current_user):
    sessions = InterviewSession.query.filter_by(user_id=current_user.id)\
        .order_by(InterviewSession.created_at.desc()).all()
    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200


@interview_bp.route('/session-history/<int:session_id>', methods=['GET'])
@token_required
def get_session_history(current_user, session_id):
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    questions = Question.query.filter_by(session_id=session_id)\
        .order_by(Question.question_number).all()
    return jsonify({
        'session': session.to_dict(),
        'questions': [q.to_dict() for q in questions]
    }), 200


def _score_to_grade(score):
    if score >= 8.5: return 'Excellent'
    elif score >= 7.0: return 'Good'
    elif score >= 5.5: return 'Average'
    elif score >= 4.0: return 'Below Average'
    return 'Needs Improvement'