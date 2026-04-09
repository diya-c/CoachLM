"""
Memory Module
Retrieves and summarizes a user's past interview history from the database
to provide context for the Interviewer and Evaluator agents.
"""

from models import InterviewSession, Question


class MemoryModule:
    """
    Reads the user's past sessions from MySQL (via SQLAlchemy)
    and constructs a structured memory summary used by the agents.
    """

    def get_user_memory(self, user_id: int, current_session_id: int = None) -> dict:
        """
        Build a memory context dictionary for a user.
        Includes: total sessions, average scores, weak topics, recent feedback.
        """
        # Get all completed sessions for this user (excluding current one)
        query = InterviewSession.query.filter_by(user_id=user_id, is_completed=True)
        if current_session_id:
            query = query.filter(InterviewSession.id != current_session_id)
        past_sessions = query.order_by(InterviewSession.created_at.desc()).all()

        if not past_sessions:
            return {
                "has_history": False,
                "total_sessions": 0,
                "average_score": None,
                "recent_feedback": [],
                "weak_areas": [],
                "improvement_trend": "No past sessions"
            }

        # Aggregate scores
        all_scores = []
        all_feedback = []
        for session in past_sessions:
            for q in session.questions:
                if q.score is not None:
                    all_scores.append(q.score)
                if q.feedback:
                    all_feedback.append(q.feedback)

        avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else None

        # Identify improvement trend: compare last 2 sessions
        trend = "stable"
        if len(past_sessions) >= 2:
            recent_avg = self._session_avg(past_sessions[0])
            older_avg = self._session_avg(past_sessions[1])
            if recent_avg and older_avg:
                if recent_avg > older_avg + 0.5:
                    trend = "improving"
                elif recent_avg < older_avg - 0.5:
                    trend = "declining"

        # Get the 3 most recent feedback strings as context
        recent_feedback = all_feedback[-3:] if all_feedback else []

        return {
            "has_history": True,
            "total_sessions": len(past_sessions),
            "average_score": avg_score,
            "recent_feedback": recent_feedback,
            "weak_areas": self._extract_weak_areas(past_sessions),
            "improvement_trend": trend,
            "last_company": past_sessions[0].company if past_sessions else None,
            "last_interview_type": past_sessions[0].interview_type if past_sessions else None
        }

    def _session_avg(self, session: InterviewSession):
        """Helper: compute average score for one session."""
        scores = [q.score for q in session.questions if q.score is not None]
        return round(sum(scores) / len(scores), 1) if scores else None

    def _extract_weak_areas(self, sessions: list) -> list:
        """
        Extract topics where the user scored below 6/10.
        Returns a short list of weak area descriptions.
        """
        weak = []
        for session in sessions[:3]:  # look at last 3 sessions
            for q in session.questions:
                if q.score is not None and q.score < 6.0 and q.feedback:
                    # Take the first sentence of feedback as a weak area hint
                    hint = q.feedback.split('.')[0]
                    if hint not in weak:
                        weak.append(hint)
        return weak[:3]  # return at most 3 weak areas

    def format_memory_for_prompt(self, memory: dict) -> str:
        """
        Convert the memory dict into a readable string for inclusion in LLM prompts.
        """
        if not memory.get("has_history"):
            return "This is the user's first interview session. No prior history available."

        lines = [
            f"User has completed {memory['total_sessions']} previous interview session(s).",
            f"Overall average score: {memory['average_score']}/10.",
            f"Performance trend: {memory['improvement_trend']}."
        ]

        if memory.get("weak_areas"):
            lines.append("Areas needing improvement: " + "; ".join(memory["weak_areas"]) + ".")

        if memory.get("recent_feedback"):
            lines.append("Recent evaluator feedback: " + " | ".join(memory["recent_feedback"]))

        return " ".join(lines)


# Singleton instance
memory_module = MemoryModule()
