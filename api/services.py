import requests
import json
import re
from backend.settings import API_KEY

class AIService:
    """
    AI Service using Gemini 2.0 Flash model
    """

    def __init__(self):
        self.api_key = "gen-lang-client-0678434476"
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"

    def generate_quiz_questions(self, domain, sub_domain, number_of_questions, level):
        """
        Generate quiz questions using Gemini 2.0 Flash
        """
        prompt = self._build_prompt(domain, sub_domain, number_of_questions, level)

        try:
            headers = {
                "Content-Type": "application/json"
            }

            data = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 8192,
                }
            }

            response = requests.post(self.url, headers=headers, json=data)
            response_data = response.json()

            # Extract text from response
            if 'candidates' in response_data and response_data['candidates']:
                response_text = response_data['candidates'][0]['content']['parts'][0]['text']
                questions = self._parse_ai_response(response_text)
                return questions
            else:
                return {
                    "error": "No response from AI API",
                    "details": response_data
                }

        except Exception as e:
            return {
                "error": f"API request failed: {str(e)}",
                "questions": []
            }

    def _build_prompt(self, domain, sub_domain, number_of_questions, level):
        """
        Build optimized prompt for Gemini 2.0 Flash (forces multiple correct answers)
        """
        return f"""
        TASK:
        Generate {number_of_questions} {level} level multiple choice questions on the topic "{sub_domain}" from the domain "{domain}".
        
        CONTEXT:
        - Domain: {domain}
        - Sub-domain: {sub_domain}
        - Each question must have **exactly 4 options**.
        - Some questions should have **multiple correct answers** (2 or more correct options).
        - Some may have only one correct answer.
        - Include a brief explanation for the correct options.

        FORMAT RULES (strictly follow this JSON schema):
        [
            {{
                "id": 1,
                "question": "Which of the following statements about Python lists are correct?",
                "options": [
                    "Lists are mutable",
                    "Lists can contain different data types",
                    "Lists are immutable",
                    "Lists use curly braces"
                ],
                "correct_answers": [
                    "Lists are mutable",
                    "Lists can contain different data types"
                ],
                "explanation": "Lists are mutable and can hold multiple data types. They are enclosed in square brackets."
            }},
            {{
                "id": 2,
                "question": "Example question with one correct answer?",
                "options": [
                    "Option A",
                    "Option B",
                    "Option C",
                    "Option D"
                ],
                "correct_answers": ["Option B"],
                "explanation": "Explain why Option B is correct."
            }}
        ]

        RULES:
        - Return ONLY a valid JSON array (no markdown, no text outside brackets).
        - Use the field name "correct_answers" as a list (even if only one correct option).
        - Vary between questions with one and multiple correct answers.
        - The difficulty level must match: {level}.
        """

    def _parse_ai_response(self, response_text):
        """
        Parse and clean the AI response
        """
        try:
            # Remove markdown artifacts if any
            cleaned_text = re.sub(r'```json|```', '', response_text).strip()

            # Parse JSON
            questions = json.loads(cleaned_text)

            # Validate and add IDs if missing
            if isinstance(questions, list):
                for index, question in enumerate(questions, 1):
                    if 'id' not in question:
                        question['id'] = index
                return questions
            else:
                return {
                    "error": "AI response is not a list",
                    "raw_response": cleaned_text[:500]
                }

        except json.JSONDecodeError as e:
            # Try to extract JSON from inside text
            try:
                json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group())
                    if isinstance(questions, list):
                        for index, question in enumerate(questions, 1):
                            if 'id' not in question:
                                question['id'] = index
                        return questions
            except:
                pass

            return {
                "error": f"Failed to parse AI response as JSON: {str(e)}",
                "raw_response": response_text[:500]
            }
