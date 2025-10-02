# quizzes/services.py
import requests
import json
import re

class AIService:
    """
    AI Service using gemini-2.0-flash model
    """
    def __init__(self):
        self.api_key = "gen-lang-client-0678434476"
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBqkEUrfJ629UDtdQKj4TTU9Dael2z8GRU"
    
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
        Build optimized prompt for Gemini 2.0 Flash
        """
        return f"""
        TASK: Generate {number_of_questions} {level} level multiple choice questions about {sub_domain} in {domain}.
        
        CONTEXT:
        - Domain: {domain}
        - Sub-domain: {sub_domain}
        - Number of questions: {number_of_questions}
        - Difficulty: {level}
        
        REQUIREMENTS:
        - Questions must be specific to {sub_domain} in {domain}
        - Each question must have exactly 4 options
        - Options should be clear and distinct
        - Include a brief explanation for the correct answer
        - Make questions appropriate for {level} difficulty level
        
        OUTPUT FORMAT: Return ONLY a valid JSON array with this exact structure:
        [
            {{
                "id": 1,
                "question": "Clear and concise question text?",
                "options": [
                    "Option A text",
                    "Option B text", 
                    "Option C text",
                    "Option D text"
                ],
                "correct_answer": "Option A text",
                "explanation": "Brief explanation of why this is correct"
            }}
        ]
        
        IMPORTANT: Return ONLY the JSON array. No additional text, no code blocks, no explanations.
        """
    
    def _parse_ai_response(self, response_text):
        """
        Parse and clean the AI response
        """
        try:
            # Remove any markdown code blocks and extra whitespace
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
            # Try to extract JSON from text if parsing fails
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