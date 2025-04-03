# api/tests.py

import email
import imaplib # Import the real library so we can mock it
from email.message import Message
from unittest.mock import patch, MagicMock, call # Import mocking tools

from django.test import TestCase
from django.utils import timezone
from django.conf import settings # To access potentially needed settings

# Import the task function and models
from .tasks import process_incoming_emails, parse_priority_from_body # Import helper if testing separately
from .models import Bug, BugModificationLog, ProcessedEmail

# --- Helper Function to Create Mock Emails ---
def create_mock_email(subject="Test Subject", body="Test body content.", from_addr="test@example.com", to_addr="bugs@example.com", message_id="<test12345@example.com>"):
    """Creates an email.message.Message object."""
    msg = Message()
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_addr
    msg['Date'] = timezone.now().strftime('%a, %d %b %Y %H:%M:%S %z') # Format like real Date header
    if message_id: # Allow None for testing missing header
      msg['Message-ID'] = message_id
    msg.set_payload(body, charset='utf-8') # Assume utf-8 for tests
    return msg

def create_mock_email_bytes(subject="Test Subject", body="Test body content.", from_addr="test@example.com", to_addr="bugs@example.com", message_id="<test12345@example.com>"):
    """Creates email bytes suitable for imaplib.fetch mock response."""
    msg = create_mock_email(subject, body, from_addr, to_addr, message_id)
    # The fetch mock needs to return data in a specific tuple format
    # Typically: (b'UID X (RFC822 {byte_count}', email_bytes)
    email_bytes = msg.as_bytes()
    # Construct the header part realistically (can simplify if needed)
    fetch_header = f"1 (RFC822 {{{len(email_bytes)}}})".encode()
    return (fetch_header, email_bytes)

# --- Test Class ---

# Patch 'imaplib.IMAP4_SSL' globally for all tests in this class
@patch('api.tasks.imaplib.IMAP4_SSL') # Target where IMAP4_SSL is *used*
class EmailProcessingTests(TestCase):

    def test_create_new_bug_from_email(self, MockIMAP4_SSL):
        """ Test that a valid email creates a new Bug record correctly. """
        # --- Arrange ---
        # 1. Configure the mock IMAP server/connection behaviour
        mock_instance = MockIMAP4_SSL.return_value # The object returned when IMAP4_SSL() is called
        mock_instance.login.return_value = ('OK', [b'Login successful.'])
        mock_instance.select.return_value = ('OK', [b'INBOX selected.'])
        # Simulate search finding one unseen email with UID '1'
        mock_instance.search.return_value = ('OK', [b'1'])
        # Simulate fetch returning our mock email for UID '1'
        mock_email_subject = "Bug ID: NEW-001 - Creation Test"
        mock_email_body = "This is the description.\nPriority: High\nShould be high priority."
        mock_email_msg_id = "<new-bug-test@example.com>"
        mock_email_bytes_tuple = create_mock_email_bytes(
            subject=mock_email_subject,
            body=mock_email_body,
            message_id=mock_email_msg_id
        )
        # fetch returns list containing tuples like (header_bytes, email_bytes)
        mock_instance.fetch.return_value = ('OK', [mock_email_bytes_tuple, b')']) # Added closing parenthesis typical of FETCH response
        mock_instance.store.return_value = ('OK', [b'Store successful.'])
        mock_instance.close.return_value = ('OK', [b'Closed.'])
        mock_instance.logout.return_value = ('OK', [b'Logout successful.'])

        # 2. Initial state checks (optional but good)
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        # --- Act ---
        # Run the task directly (synchronously)
        process_incoming_emails()

        # --- Assert ---
        # 1. Check database state
        self.assertEqual(Bug.objects.count(), 1)
        self.assertEqual(ProcessedEmail.objects.count(), 1)
        self.assertEqual(BugModificationLog.objects.count(), 0) # No modification log on creation

        # 2. Check Bug details
        created_bug = Bug.objects.first()
        self.assertIsNotNone(created_bug)
        self.assertEqual(created_bug.bug_id, "NEW-001")
        self.assertEqual(created_bug.subject, mock_email_subject)
        self.assertEqual(created_bug.description, mock_email_body)
        self.assertEqual(created_bug.priority, Bug.Priority.HIGH) # Check parsed priority
        self.assertEqual(created_bug.status, Bug.Status.OPEN) # Check default status
        self.assertEqual(created_bug.modified_count, 0)

        # 3. Check ProcessedEmail record
        processed_email = ProcessedEmail.objects.first()
        self.assertIsNotNone(processed_email)
        self.assertEqual(processed_email.message_id, mock_email_msg_id)

        # 4. Check mock calls (verify IMAP interactions happened as expected)
        MockIMAP4_SSL.assert_called_once_with(settings.IMAP_SERVER, settings.IMAP_PORT)
        mock_instance.login.assert_called_once_with(settings.IMAP_USER, settings.IMAP_PASSWORD)
        mock_instance.select.assert_called_once_with('inbox')
        mock_instance.search.assert_called_once_with(None, '(UNSEEN)')
        mock_instance.fetch.assert_called_once_with(b'1', '(RFC822)')
        # Check that the email was marked as Seen
        mock_instance.store.assert_called_once_with(b'1', '+FLAGS', '\\Seen')
        mock_instance.close.assert_called_once()
        mock_instance.logout.assert_called_once()


    def test_update_existing_bug_from_email(self, MockIMAP4_SSL):
        """ Test that an email with an existing Bug ID updates the record. """
        # --- Arrange ---
        # 1. Create initial bug
        initial_bug_id = "EXIST-002"
        initial_subject = f"Bug ID: {initial_bug_id} - Initial State"
        initial_description = "This needs to be updated."
        initial_priority = Bug.Priority.LOW
        initial_bug = Bug.objects.create(
            bug_id=initial_bug_id,
            subject=initial_subject,
            description=initial_description,
            priority=initial_priority,
            status=Bug.Status.OPEN
        )
        initial_mod_count = initial_bug.modified_count # Should be 0

        # 2. Configure mock IMAP for the *update* email
        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', [])
        mock_instance.select.return_value = ('OK', [])
        mock_instance.search.return_value = ('OK', [b'2']) # Different UID

        update_subject = f"Bug ID: {initial_bug_id} - Updated Details" # Same Bug ID
        update_body = "The description is now updated.\nPriority: Medium\nThis is important now."
        update_msg_id = "<update-bug-test@example.com>"
        mock_email_bytes_tuple = create_mock_email_bytes(
            subject=update_subject, body=update_body, message_id=update_msg_id
        )
        mock_instance.fetch.return_value = ('OK', [mock_email_bytes_tuple, b')'])
        mock_instance.store.return_value = ('OK', [])
        mock_instance.close.return_value = ('OK', [])
        mock_instance.logout.return_value = ('OK', [])

        # 3. Initial state check
        self.assertEqual(Bug.objects.count(), 1)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        # 1. Check database counts
        self.assertEqual(Bug.objects.count(), 1) # Still only one bug
        self.assertEqual(ProcessedEmail.objects.count(), 1) # One email processed
        self.assertEqual(BugModificationLog.objects.count(), 1) # One modification logged

        # 2. Check Bug details were updated
        updated_bug = Bug.objects.get(pk=initial_bug.pk) # Fetch same bug by PK
        self.assertEqual(updated_bug.bug_id, initial_bug_id)
        self.assertEqual(updated_bug.subject, update_subject) # Subject updated
        self.assertEqual(updated_bug.description, update_body) # Description updated
        self.assertEqual(updated_bug.priority, Bug.Priority.MEDIUM) # Priority updated
        self.assertEqual(updated_bug.status, Bug.Status.OPEN) # Status unchanged
        self.assertEqual(updated_bug.modified_count, initial_mod_count + 1) # Modified count incremented

        # 3. Check ProcessedEmail
        processed_email = ProcessedEmail.objects.first()
        self.assertEqual(processed_email.message_id, update_msg_id)

        # 4. Check Modification Log
        mod_log = BugModificationLog.objects.first()
        self.assertEqual(mod_log.bug, updated_bug)
        # Check timestamp is recent (allow some tolerance)
        self.assertTrue(timezone.now() - mod_log.modified_at < timezone.timedelta(seconds=10))

        # 5. Check mock calls
        mock_instance.fetch.assert_called_once_with(b'2', '(RFC822)')
        mock_instance.store.assert_called_once_with(b'2', '+FLAGS', '\\Seen')


    def test_skip_duplicate_email(self, MockIMAP4_SSL):
        """ Test that an email with an already processed Message-ID is skipped. """
        # --- Arrange ---
        # 1. Create a processed email record
        existing_msg_id = "<duplicate-test@example.com>"
        ProcessedEmail.objects.create(message_id=existing_msg_id)

        # 2. Configure mock IMAP for an email with the SAME Message-ID
        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', [])
        mock_instance.select.return_value = ('OK', [])
        mock_instance.search.return_value = ('OK', [b'3']) # UID 3

        mock_email_bytes_tuple = create_mock_email_bytes(
            subject="Bug ID: DUP-TEST - Subject", body="Body", message_id=existing_msg_id
        )
        mock_instance.fetch.return_value = ('OK', [mock_email_bytes_tuple, b')'])
        mock_instance.store.return_value = ('OK', [])
        mock_instance.close.return_value = ('OK', [])
        mock_instance.logout.return_value = ('OK', [])

        # 3. Initial state
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 1)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        # 1. Check database state - NO changes expected to Bug or Log
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 1) # Still only the original record
        self.assertEqual(BugModificationLog.objects.count(), 0)

        # 2. Check mock calls
        mock_instance.fetch.assert_called_once_with(b'3', '(RFC822)')
        # Email *was* marked Seen even though skipped due to duplication check
        mock_instance.store.assert_called_once_with(b'3', '+FLAGS', '\\Seen')


    def test_skip_invalid_subject_format(self, MockIMAP4_SSL):
        """ Test that an email without 'Bug ID:' in subject is skipped. """
        # --- Arrange ---
        # 1. Configure mock IMAP
        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', []); mock_instance.select.return_value = ('OK', [])
        mock_instance.search.return_value = ('OK', [b'4']) # UID 4

        mock_email_bytes_tuple = create_mock_email_bytes(
            subject="Invalid Subject - Missing ID", body="Body", message_id="<invalid-subj@example.com>"
        )
        mock_instance.fetch.return_value = ('OK', [mock_email_bytes_tuple, b')'])
        mock_instance.store.return_value = ('OK', []) # Should not be called
        mock_instance.close.return_value = ('OK', []); mock_instance.logout.return_value = ('OK', [])

        # 2. Initial state
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        # 1. No changes to database
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        # 2. Check mock calls
        mock_instance.fetch.assert_called_once_with(b'4', '(RFC822)')
        # Store should NOT have been called as processing failed early
        mock_instance.store.assert_not_called()


    def test_skip_missing_message_id(self, MockIMAP4_SSL):
        """ Test that an email missing the Message-ID header is skipped. """
        # --- Arrange ---
        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', []); mock_instance.select.return_value = ('OK', [])
        mock_instance.search.return_value = ('OK', [b'5']) # UID 5

        mock_email_bytes_tuple = create_mock_email_bytes(
            subject="Bug ID: TEST-ID - Subject", body="Body", message_id=None # Simulate missing header
        )
        mock_instance.fetch.return_value = ('OK', [mock_email_bytes_tuple, b')'])
        mock_instance.store.return_value = ('OK', [])
        mock_instance.close.return_value = ('OK', []); mock_instance.logout.return_value = ('OK', [])

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        mock_instance.store.assert_not_called()


    # Add similar tests for missing body, emails that cause DB errors during processing, etc.

    def test_parse_priority_helper(self, MockIMAP4_SSL): # MockIMAP is unused but part of class patch
         """ Test the priority parsing helper function directly. """
         self.assertEqual(parse_priority_from_body("Hello\nPriority: High\nWorld"), "high")
         self.assertEqual(parse_priority_from_body("Priority: medium"), "medium")
         self.assertEqual(parse_priority_from_body("priority: LOW "), "low") # Check whitespace/case
         self.assertEqual(parse_priority_from_body("This email has high priority."), None) # Keyword must be at start of line
         self.assertEqual(parse_priority_from_body("No priority mentioned."), None)
         self.assertEqual(parse_priority_from_body("Priority: Critical"), None) # Invalid level
         self.assertEqual(parse_priority_from_body(""), None)
         self.assertIsNone(parse_priority_from_body(None))