"""
Evaluator Agent
Responsible for scoring user answers and generating actionable feedback.
Scores on: correctness, relevance, and clarity.
Returns a JSON object with score and detailed feedback.
"""

import json
import re
from config import Config

# Choose the LLM client based on config
if Config.LLM_PROVIDER == 'groq':
    from groq import Groq
    llm_client = Groq(api_key=Config.GROQ_API_KEY)
else:
    from openai import OpenAI
    llm_client = OpenAI(api_key=Config.OPENAI_API_KEY)


class EvaluatorAgent:
    """
    Evaluator Agent — scores and provides feedback on user answers.
    """

    def evaluate_answer(
        self,
        question: str,
        answer: str,
        interview_type: str,
        company: str,
        difficulty: str
    ) -> dict:
        """
        Evaluate the user's answer.

        Returns:
            {
                "score": float (0-10),
                "feedback": str,
                "strengths": str,
                "weaknesses": str,
                "correctness_score": float,
                "relevance_score": float,
                "clarity_score": float
            }
        """

        if not answer or answer.strip() == "":
            return {
                "score": 0.0,
                "feedback": "No answer was provided.",
                "strengths": "N/A",
                "weaknesses": "No answer submitted.",
                "correctness_score": 0.0,
                "relevance_score": 0.0,
                "clarity_score": 0.0
            }

        system_prompt = """You are a strict but fair technical interviewer evaluating a candidate's answer.
Evaluate the answer on three criteria, each scored 0-10:
1. Correctness: Is the answer factually accurate and technically sound?
2. Relevance: Does it directly address the question asked?
3. Clarity: Is it well-structured and easy to understand?

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "correctness_score": <float 0-10>,
  "relevance_score": <float 0-10>,
  "clarity_score": <float 0-10>,
  "overall_score": <float 0-10, weighted average>,
  "strengths": "<one sentence about what they did well>",
  "weaknesses": "<one sentence about what needs improvement>",
  "feedback": "<2-3 sentence comprehensive feedback with specific suggestions>"
}"""

        user_prompt = f"""Interview Context:
- Company: {company}
- Interview Type: {interview_type}
- Difficulty: {difficulty}

Question asked: {question}

Candidate's answer: {answer}

Evaluate the answer now:"""

        raw_response = self._call_llm(system_prompt, user_prompt)
        return self._parse_evaluation(raw_response)

    def _parse_evaluation(self, raw: str) -> dict:
        """Parse the LLM JSON response, with a fallback if parsing fails."""
        try:
            # Try to extract JSON from the response (handles cases where LLM adds extra text)
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                # Ensure all required keys exist
                return {
                    "score": float(data.get("overall_score", 5.0)),
                    "feedback": data.get("feedback", "Evaluation completed."),
                    "strengths": data.get("strengths", "Good attempt."),
                    "weaknesses": data.get("weaknesses", "Keep practicing."),
                    "correctness_score": float(data.get("correctness_score", 5.0)),
                    "relevance_score": float(data.get("relevance_score", 5.0)),
                    "clarity_score": float(data.get("clarity_score", 5.0))
                }
        except (json.JSONDecodeError, ValueError, AttributeError):
            pass

        # Fallback if JSON parsing fails
        return {
            "score": 5.0,
            "feedback": raw[:300] if raw else "Unable to evaluate answer at this time.",
            "strengths": "Answer was received.",
            "weaknesses": "Could not fully parse evaluation.",
            "correctness_score": 5.0,
            "relevance_score": 5.0,
            "clarity_score": 5.0
        }

    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """Call the configured LLM and return the response text."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        if Config.LLM_PROVIDER == 'groq':
            response = llm_client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=messages,
                max_tokens=400,
                temperature=0.3  # Lower temperature for more consistent evaluation
            )
        else:
            response = llm_client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=messages,
                max_tokens=400,
                temperature=0.3
            )

        return response.choices[0].message.content


# Singleton instance
evaluator_agent = EvaluatorAgent()
