from typing import List
from pydantic import BaseModel
from django.conf import settings
from openai import OpenAI
import json
import re


# =========================
# ✅ Pydantic Models
# =========================

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_answers: List[str]
    explanation: str
    sub_topic: str


class QuizQuestionSet(BaseModel):
    questions: List[QuizQuestion]


# =========================
# ✅ AI Service (Groq)
# =========================

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY

        if not self.api_key:
            raise ValueError("GROQ_API_KEY missing")

        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.groq.com/openai/v1"
        )

    def generate_quiz_questions(self, domain, sub_domain, number_of_questions, level):

        # number_of_questions = min(number_of_questions, 5)

        prompt = f"""
Generate {number_of_questions} {level} MCQs on "{sub_domain}" from "{domain}".

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No extra text
- "options" MUST be a LIST of 4 strings
- DO NOT use "choices"
- DO NOT return dictionary for options

FORMAT:
{{
  "questions": [
    {{
      "id": 1,
      "question": "text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answers": ["Option A"],
      "explanation": "text",
      "sub_topic": "text"
    }}
  ]
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )

            content = response.choices[0].message.content
            print("✅ RAW RESPONSE:\n", content)

            # =========================
            # 🔥 CLEAN JSON
            # =========================

            content = content.strip()
            content = content.replace("```json", "").replace("```", "")

            start = content.find("{")
            end = content.rfind("}") + 1
            json_str = content[start:end]

            # remove trailing commas
            json_str = re.sub(r",\s*}", "}", json_str)
            json_str = re.sub(r",\s*]", "]", json_str)

            parsed = json.loads(json_str)

            # =========================
            # 🔥 NORMALIZE DATA
            # =========================

            for q in parsed.get("questions", []):

                # Fix "choices" → "options"
                if "choices" in q:
                    q["options"] = q.pop("choices")

                # Convert dict options → list
                if isinstance(q.get("options"), dict):
                    q["options"] = list(q["options"].values())

                # Ensure options exists
                if "options" not in q or not isinstance(q["options"], list):
                    q["options"] = []

                # Ensure correct_answers is list
                if isinstance(q.get("correct_answers"), str):
                    q["correct_answers"] = [q["correct_answers"]]

            # =========================
            # ✅ VALIDATE
            # =========================

            validated = QuizQuestionSet(**parsed)

            result = [q.model_dump() for q in validated.questions]

            print("🎯 FINAL PARSED QUESTIONS:\n", result)

            return result

        except Exception as e:
            print("❌ ERROR:", str(e))
            print("❌ FAILED JSON:\n", json_str if 'json_str' in locals() else "No JSON")

            return {
                "error": str(e),
                "questions": []
            }