"""
Interviewer Agent
Responsible for generating interview questions using:
  - RAG: retrieves company-specific seed questions
  - Memory: adapts difficulty based on past performance
  - LLM: generates a fresh, context-aware question
"""
from config import Config
from rag_module import rag_module
from memory_module import memory_module

if Config.LLM_PROVIDER == 'groq':
    from groq import Groq
    llm_client = Groq(api_key=Config.GROQ_API_KEY)
else:
    from openai import OpenAI
    llm_client = OpenAI(api_key=Config.OPENAI_API_KEY)


class InterviewerAgent:

    def generate_question(
        self,
        user_id: int,
        session_id: int,
        company: str,
        interview_type: str,
        difficulty: str,
        question_number: int,
        previous_qa: list,        # list of {"question": ..., "answer": ..., "score": ...}
        current_difficulty: str   # dynamically tracked difficulty
    ) -> dict:
        """
        Generate the next interview question.
        Returns {"question": str, "new_difficulty": str}
        """

        # 1. Compute adaptive difficulty based on recent scores
        new_difficulty = self._adapt_difficulty(current_difficulty, previous_qa)

        # 2. Get user memory context
        memory = memory_module.get_user_memory(user_id, session_id)
        memory_context = memory_module.format_memory_for_prompt(memory)

        # 3. RAG retrieval
        rag_questions = rag_module.retrieve_questions(
            company=company,
            interview_type=interview_type,
            difficulty=new_difficulty,
            n_results=4
        )
        rag_context = "\n".join([f"- {q}" for q in rag_questions])

        # 4. Build conversation history for context
        conversation_context = ""
        if previous_qa:
            last_3 = previous_qa[-3:]
            conversation_context = "\n".join([
                f"Q: {item['question']}\nA: {item['answer']}\nScore: {item.get('score', 'N/A')}/10"
                for item in last_3
            ])

        # 5. Decide: follow-up on last answer OR new topic
        is_followup = len(previous_qa) > 0 and previous_qa[-1].get('score', 10) is not None

        system_prompt = f"""You are an expert {interview_type} interviewer at {company}.
Your job is to conduct a natural, flowing interview conversation.
Current difficulty level: {new_difficulty}
Ask only ONE question. No preamble, no numbering. Just the question itself."""

        if is_followup and previous_qa:
            last = previous_qa[-1]
            last_score = last.get('score', 5)
            user_prompt = f"""Candidate background context:
{memory_context}

Recent conversation:
{conversation_context}

The candidate just answered: "{last['answer']}"
Their score was {last_score}/10.

{"Since they answered well, dig deeper or explore a related concept." if last_score >= 7 else "Since they struggled, ask a clearer or simpler follow-up on the same topic to help them demonstrate understanding."}

Sample {company} {interview_type} questions for inspiration (do NOT copy directly):
{rag_context}

Generate the next natural follow-up question at {new_difficulty} difficulty:"""
        else:
            prev_questions = [item['question'] for item in previous_qa]
            prev_list = "\n".join([f"- {q}" for q in prev_questions]) if prev_questions else "None yet"
            user_prompt = f"""Candidate background:
{memory_context}

Questions already asked (do NOT repeat):
{prev_list}

Sample {company} {interview_type} questions for inspiration:
{rag_context}

Ask a fresh {new_difficulty} difficulty {interview_type} question for {company}:"""

        response = self._call_llm(system_prompt, user_prompt)
        return {
            "question": response.strip(),
            "new_difficulty": new_difficulty
        }

    def _adapt_difficulty(self, current: str, previous_qa: list) -> str:
        """
        Dynamically adjust difficulty based on last 3 answer scores.
        - Average >= 7.5 → increase difficulty
        - Average <= 4.0 → decrease difficulty
        - In between → stay the same
        """
        order = ["Easy", "Medium", "Hard"]
        idx = order.index(current)

        if len(previous_qa) < 2:
            return current

        recent_scores = [
            item['score'] for item in previous_qa[-3:]
            if item.get('score') is not None
        ]
        if not recent_scores:
            return current

        avg = sum(recent_scores) / len(recent_scores)

        if avg >= 7.5 and idx < 2:
            print(f"[Interviewer] Increasing difficulty: {current} → {order[idx+1]} (avg score: {avg:.1f})")
            return order[idx + 1]
        elif avg <= 4.0 and idx > 0:
            print(f"[Interviewer] Decreasing difficulty: {current} → {order[idx-1]} (avg score: {avg:.1f})")
            return order[idx - 1]
        return current

    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        if Config.LLM_PROVIDER == 'groq':
            response = llm_client.chat.completions.create(
                model=Config.GROQ_MODEL,
                messages=messages,
                max_tokens=200,
                temperature=0.7
            )
        else:
            response = llm_client.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=messages,
                max_tokens=200,
                temperature=0.7
            )
        return response.choices[0].message.content


interviewer_agent = InterviewerAgent()