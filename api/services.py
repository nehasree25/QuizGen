import os
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI


load_dotenv()
class QuizQuestion(BaseModel):
    """Model for a single quiz question (supports multiple correct answers)"""
    id: int = Field(description="Unique identifier for the question")
    question: str = Field(description="The quiz question text")
    options: List[str] = Field(description="List of exactly 4 answer options")
    correct_answers: List[str] = Field(description="List of correct options (1 or more)")
    explanation: str = Field(description="Explanation for the correct answer(s)")
    sub_topic: str = Field(description="Sub-topic or concept the question belongs to")
class QuizQuestionSet(BaseModel):
    """Model for a collection of quiz questions"""
    questions: List[QuizQuestion] = Field(description="List of generated quiz questions")
class AIService:
    """
    AI Service using Gemini 2.0 Flash model with LangChain structured output.
    """

    def __init__(self):
        self.api_key = os.getenv("API_KEY")
        if not self.api_key:
            raise ValueError("API_KEY not found in environment variables")

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=self.api_key,
            temperature=0.7,
            top_p=0.95,
            max_output_tokens=8192
        )
        self.structured_llm = self.llm.with_structured_output(QuizQuestionSet)

    def generate_quiz_questions(self, domain: str, sub_domain: str, number_of_questions: int, level: str) -> List[dict]:
        """
        Generate quiz questions using Gemini LLM with structured output.

        Args:
            domain (str): Main domain (e.g., "Python", "AI", "Networking")
            sub_domain (str): Specific sub-topic (e.g., "Lists", "OOP", "CNNs")
            number_of_questions (int): Number of questions to generate
            level (str): Difficulty level ("easy", "medium", "hard")

        Returns:
            List[dict]: List of structured quiz questions
        """

        prompt = f"""
        You are an expert educational content creator.

        TASK:
        Generate {number_of_questions} {level}-level multiple choice questions on the topic "{sub_domain}" 
        from the domain "{domain}".

        REQUIREMENTS:
        - Each question must have exactly 4 options.
        - Some questions should have multiple correct answers (2 or more).
        - Some may have only one correct answer.
        - Include a clear explanation for the correct answers.
        - Include a sub_topic field that identifies the specific concept or theme of the question.
        - Vary between conceptual and applied questions.
        - Ensure the questions strictly match the difficulty level: {level}.
        - Return data strictly matching the defined JSON schema.
        """

        try:
            result: QuizQuestionSet = self.structured_llm.invoke(prompt)
            return [q.model_dump() for q in result.questions]

        except Exception as e:
            return {
                "error": f"Error generating quiz: {str(e)}",
                "questions": []
            }
