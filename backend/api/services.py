

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

        number_of_questions = min(number_of_questions, 5)

        prompt = f"""
Generate {number_of_questions} {level} MCQs on "{sub_domain}" from "{domain}".

STRICT:
- Return ONLY valid JSON
- No markdown
- No extra text

FORMAT:
{{
  "questions": [
    {{
      "id": 1,
      "question": "text",
      "options": ["A","B","C","D"],
      "correct_answers": ["A"],
      "explanation": "text",
      "sub_topic": "text"
    }}
  ]
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # 🔥 Best Groq model
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )

            content = response.choices[0].message.content

            print("✅ RAW RESPONSE:\n", content)  # 🔥 DEBUG

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

            validated = QuizQuestionSet(**parsed)

            result = [q.model_dump() for q in validated.questions]

            print("🎯 PARSED QUESTIONS:\n", result)  # 🔥 CONFIRM OUTPUT

            return result

        except Exception as e:
            print("❌ ERROR:", str(e))
            return {
                "error": str(e),
                "questions": []
            }