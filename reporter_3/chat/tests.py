# chat/tests.py
import tempfile
import os
from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from docx import Document

from .services import file_processor, ollama_service
from reports.services import version_control
from reports.models import Report

User = get_user_model()

class FileProcessorTests(TestCase):
    def test_process_docx_extraction(self):
        """
        Tests that the process_docx function correctly extracts text from a docx file.
        """
        # 1. Create a temporary DOCX file in memory
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            doc = Document()
            expected_text = "This is a test paragraph for our unit test."
            doc.add_paragraph(expected_text)
            doc.save(tmp.name)
            tmp_path = tmp.name

        # 2. Run the function we want to test
        extracted_content = file_processor.process_docx(tmp_path)

        # 3. Assert that the expected text is in the result
        self.assertIn(expected_text, extracted_content)
        self.assertIn("--- Content from DOCX:", extracted_content)

        # 4. Clean up the temporary file
        os.remove(tmp_path)

class OllamaServiceTests(TestCase):
    @patch('chat.services.ollama_service.requests.post')
    def test_generate_response_mocked(self, mock_post):
        """
        Tests the Ollama service without making a real API call by mocking 'requests.post'.
        """
        # 1. Configure the mock to simulate a successful API response from Ollama
        mock_response_data = {'response': 'This is a mocked AI response.'}
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = mock_response_data

        # 2. Call the function
        response = ollama_service.generate_response(
            model="test-model",
            prompt="test prompt",
            stream=False # Test non-streaming mode for simplicity
        )

        # 3. Assert that the function returned the correct data from the mock
        self.assertEqual(response, 'This is a mocked AI response.')

        # 4. Assert that requests.post was called with the expected URL
        mock_post.assert_called_with(
            "http://localhost:11434/api/generate",
            json={
                'model': 'test-model',
                'prompt': 'test prompt',
                'stream': False
            },
            stream=False
        )

from django.urls import reverse

class ChatFlowIntegrationTest(TestCase):
    def setUp(self):
        """Set up a user for the integration tests."""
        self.user = User.objects.create_user(username='integrationuser', password='password')
        self.client.login(username='integrationuser', password='password')

    def test_chat_page_loads_for_authenticated_user(self):
        """
        Tests that an authenticated user can successfully load the main chat page.
        """
        # The 'reverse' function looks up the URL by its name from urls.py
        url = reverse('chat:chat_page')
        response = self.client.get(url)

        # Check that the page was found and loaded successfully (HTTP 200 OK)
        self.assertEqual(response.status_code, 200)

        # Check that the response contains key text from our template
        self.assertContains(response, "Report Preview")
        self.assertContains(response, f"Welcome, {self.user.username}")

    def test_chat_page_redirects_for_unauthenticated_user(self):
        """
        Tests that a user who is not logged in is redirected to the login page.
        """
        self.client.logout() # Log the user out first
        url = reverse('chat:chat_page')
        response = self.client.get(url)

        # Check that the user is redirected (HTTP 302 Found)
        self.assertEqual(response.status_code, 302)
        # Check that the redirection points to the login page
        self.assertRedirects(response, f"/accounts/login/?next={url}")