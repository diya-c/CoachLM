"""
RAG Module — pure-Python vector store (no ChromaDB, works on Windows without C++ tools)
Uses sentence-transformers for embeddings and cosine similarity for retrieval.
"""

import numpy as np
from sentence_transformers import SentenceTransformer

INTERVIEW_QUESTION_DATASET = [
    # Google – Technical
    {"id": "g_t_1", "company": "Google", "type": "Technical", "difficulty": "Medium",
     "question": "Given an array of integers, find the two numbers that add up to a target sum."},
    {"id": "g_t_2", "company": "Google", "type": "Technical", "difficulty": "Hard",
     "question": "Design a system that can process and store large-scale web crawl data efficiently."},
    {"id": "g_t_3", "company": "Google", "type": "Technical", "difficulty": "Easy",
     "question": "Explain the difference between a stack and a queue with examples."},
    {"id": "g_t_4", "company": "Google", "type": "Technical", "difficulty": "Medium",
     "question": "How would you implement a LRU (Least Recently Used) cache?"},
    {"id": "g_t_5", "company": "Google", "type": "Technical", "difficulty": "Hard",
     "question": "Design Google Maps. What components and data structures would you use?"},

    # Google – HR
    {"id": "g_h_1", "company": "Google", "type": "HR", "difficulty": "Easy",
     "question": "Tell me about a time you had to work with a difficult team member. How did you handle it?"},
    {"id": "g_h_2", "company": "Google", "type": "HR", "difficulty": "Medium",
     "question": "Describe a situation where you had to make a decision with incomplete information."},
    {"id": "g_h_3", "company": "Google", "type": "HR", "difficulty": "Medium",
     "question": "Why do you want to work at Google and how do you align with our mission?"},

    # Amazon – Technical
    {"id": "a_t_1", "company": "Amazon", "type": "Technical", "difficulty": "Medium",
     "question": "Implement a function to serialize and deserialize a binary tree."},
    {"id": "a_t_2", "company": "Amazon", "type": "Technical", "difficulty": "Hard",
     "question": "Design Amazon's recommendation system. What algorithms would you use?"},
    {"id": "a_t_3", "company": "Amazon", "type": "Technical", "difficulty": "Easy",
     "question": "What is the difference between SQL and NoSQL databases? When would you use each?"},
    {"id": "a_t_4", "company": "Amazon", "type": "Technical", "difficulty": "Medium",
     "question": "Explain how Amazon S3 ensures high availability and durability of stored objects."},

    # Amazon – HR
    {"id": "a_h_1", "company": "Amazon", "type": "HR", "difficulty": "Easy",
     "question": "Describe a time when you had to deliver results under a tight deadline."},
    {"id": "a_h_2", "company": "Amazon", "type": "HR", "difficulty": "Medium",
     "question": "Give an example of when you used data to make a business decision."},
    {"id": "a_h_3", "company": "Amazon", "type": "HR", "difficulty": "Medium",
     "question": "Tell me about a time you demonstrated customer obsession."},

    # Microsoft – Technical
    {"id": "m_t_1", "company": "Microsoft", "type": "Technical", "difficulty": "Medium",
     "question": "How would you find the longest palindromic substring in a given string?"},
    {"id": "m_t_2", "company": "Microsoft", "type": "Technical", "difficulty": "Hard",
     "question": "Design a distributed message queue system similar to Azure Service Bus."},
    {"id": "m_t_3", "company": "Microsoft", "type": "Technical", "difficulty": "Easy",
     "question": "What is OOP? Explain encapsulation, inheritance, and polymorphism."},
    {"id": "m_t_4", "company": "Microsoft", "type": "Technical", "difficulty": "Medium",
     "question": "Explain microservices and how they compare to monolithic architecture."},

    # Microsoft – HR
    {"id": "m_h_1", "company": "Microsoft", "type": "HR", "difficulty": "Easy",
     "question": "Describe a project you are most proud of. What was your role and contribution?"},
    {"id": "m_h_2", "company": "Microsoft", "type": "HR", "difficulty": "Medium",
     "question": "How do you handle failure? Give an example of a time you failed and what you learned."},

    # Meta – Technical
    {"id": "fb_t_1", "company": "Meta", "type": "Technical", "difficulty": "Hard",
     "question": "Design Facebook's news feed ranking system."},
    {"id": "fb_t_2", "company": "Meta", "type": "Technical", "difficulty": "Medium",
     "question": "Implement a function to clone a graph with a deep copy."},
    {"id": "fb_t_3", "company": "Meta", "type": "Technical", "difficulty": "Easy",
     "question": "Explain how React's virtual DOM works and why it improves performance."},

    # Meta – HR
    {"id": "fb_h_1", "company": "Meta", "type": "HR", "difficulty": "Medium",
     "question": "Describe a time when you had to influence people without having direct authority."},

    # General – Technical
    {"id": "gen_t_1", "company": "General", "type": "Technical", "difficulty": "Easy",
     "question": "What is the time complexity of common sorting algorithms?"},
    {"id": "gen_t_2", "company": "General", "type": "Technical", "difficulty": "Medium",
     "question": "Explain REST API design principles. What makes a good API?"},
    {"id": "gen_t_3", "company": "General", "type": "Technical", "difficulty": "Hard",
     "question": "Design a URL shortening service like bit.ly from scratch."},
    {"id": "gen_t_4", "company": "General", "type": "Technical", "difficulty": "Easy",
     "question": "What is the difference between process and thread in operating systems?"},
    {"id": "gen_t_5", "company": "General", "type": "Technical", "difficulty": "Medium",
     "question": "Explain how HTTPS and SSL/TLS work to secure web communications."},

    # General – HR
    {"id": "gen_h_1", "company": "General", "type": "HR", "difficulty": "Easy",
     "question": "Tell me about yourself and your background in software engineering."},
    {"id": "gen_h_2", "company": "General", "type": "HR", "difficulty": "Easy",
     "question": "Where do you see yourself in five years?"},
    {"id": "gen_h_3", "company": "General", "type": "HR", "difficulty": "Medium",
     "question": "What are your greatest strengths and how have they helped you succeed?"},
    {"id": "gen_h_4", "company": "General", "type": "HR", "difficulty": "Medium",
     "question": "Describe a situation where you had to resolve a conflict within a team."},
]


class RAGModule:
    """
    Pure-Python RAG module using sentence-transformers + cosine similarity.
    No C++ compiler required — works on Windows out of the box.
    """

    def __init__(self):
        print("[RAG] Loading embedding model (first run may take a moment)...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

        # Pre-compute embeddings for all questions
        self.questions = INTERVIEW_QUESTION_DATASET
        texts = [q["question"] for q in self.questions]
        self.embeddings = self.model.encode(texts, convert_to_numpy=True)
        print(f"[RAG] Indexed {len(self.questions)} questions.")

    def retrieve_questions(self, company: str, interview_type: str, difficulty: str, n_results: int = 5) -> list:
        """
        Retrieve the most relevant questions using cosine similarity.
        Prioritises matching company, type, and difficulty via metadata filter + semantic score.
        """
        query = f"{interview_type} interview question for {company} at {difficulty} difficulty"
        query_embedding = self.model.encode([query], convert_to_numpy=True)[0]

        # Cosine similarity
        norms = np.linalg.norm(self.embeddings, axis=1) * np.linalg.norm(query_embedding)
        norms = np.where(norms == 0, 1e-10, norms)
        scores = self.embeddings @ query_embedding / norms

        # Filter by type and difficulty, boost company matches
        results = []
        for i, item in enumerate(self.questions):
            if item["type"] != interview_type:
                continue
            if item["difficulty"] != difficulty:
                continue
            boost = 0.3 if item["company"] == company else 0.0
            results.append((scores[i] + boost, item["question"]))

        # Sort by score descending
        results.sort(key=lambda x: x[0], reverse=True)

        # If not enough filtered results, add unfiltered ones
        if len(results) < n_results:
            for i, item in enumerate(self.questions):
                q = item["question"]
                if any(q == r[1] for r in results):
                    continue
                results.append((scores[i], q))
            results.sort(key=lambda x: x[0], reverse=True)

        return [q for _, q in results[:n_results]]


# Singleton — loaded once on import
rag_module = RAGModule()