
from django.test import TestCase, Client
from django.urls import reverse
import json

class GenerateQuizAPITest(TestCase):
	def setUp(self):
		self.client = Client()
		self.url = reverse('generate-quiz')  # Make sure your urls.py uses this name
		self.payload = {
			"domain": "python",
			"sub_domain": "classes",
			"number_of_questions": 2,
			"level": "easy"
		}

	def test_generate_quiz_success(self):
		response = self.client.post(self.url, data=json.dumps(self.payload), content_type='application/json')
		self.assertEqual(response.status_code, 200)
		data = response.json()
		self.assertIn('questions', data)
		self.assertIsInstance(data['questions'], list)
		self.assertGreaterEqual(len(data['questions']), 1)

	def test_generate_quiz_missing_fields(self):
		bad_payload = {"domain": "python"}  # missing required fields
		response = self.client.post(self.url, data=json.dumps(bad_payload), content_type='application/json')
		self.assertNotEqual(response.status_code, 200)
