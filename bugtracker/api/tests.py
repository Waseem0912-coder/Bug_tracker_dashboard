# api/tests.py

import email
import imaplib # Import the real library so we can mock it
from email.message import Message
from unittest.mock import patch, MagicMock, call # Import mocking tools

from django.test import TestCase
from django.utils import timezone
from django.conf import settings # To access potentially needed settings
from django.db.models import F # In case needed for manual checks

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
    # Set payload with correct type for email lib
    msg.set_payload(body, charset='utf-8')
    return msg

def create_mock_email_bytes(subject="Test Subject", body="Test body content.", from_addr="test@example.com", to_addr="bugs@example.com", message_id="<test12345@example.com>", uid=b'1'):
    """Creates email bytes suitable for imaplib.fetch mock response, including header."""
    msg = create_mock_email(subject, body, from_addr, to_addr, message_id)
    email_bytes = msg.as_bytes()
    # Construct the header part realistically (adjust UID if needed)
    # Example: b'1 (RFC822 {512}'
    fetch_header = f"{uid.decode()} (RFC822 {{{len(email_bytes)}}})".encode()
    # The actual fetch response item is often a tuple containing the header and bytes
    return (fetch_header, email_bytes)

# --- Test Class ---

# Patch 'imaplib.IMAP4_SSL' globally for all tests in this class
# Target where IMAP4_SSL is *used* (within the tasks module)
@patch('api.tasks.imaplib.IMAP4_SSL')
class EmailProcessingTests(TestCase):

    def test_create_new_bug_from_email(self, MockIMAP4_SSL):
        """ Test that a valid email creates a new Bug record correctly. """
        # --- Arrange ---
        # 1. Configure the mock IMAP server/connection behaviour
        mock_instance = MockIMAP4_SSL.return_value # The object returned when IMAP4_SSL() is called
        mock_instance.login.return_value = ('OK', [b'Login successful.'])
        mock_instance.select.return_value = ('OK', [b'INBOX selected.'])
        mock_instance.state = 'SELECTED' # Simulate successful select state
        # Simulate search finding one unseen email with UID '1'
        mock_instance.search.return_value = ('OK', [b'1'])
        # Simulate fetch returning our mock email for UID '1'
        mock_email_subject = "Bug ID: NEW-001 - Creation Test"
        mock_email_body = "This is the description.\nPriority: High\nShould be high priority."
        mock_email_msg_id = "<new-bug-test@example.com>"
        mock_fetch_response_item = create_mock_email_bytes(
            subject=mock_email_subject, body=mock_email_body, message_id=mock_email_msg_id, uid=b'1'
        )
        # fetch returns list containing tuples like (header_bytes, email_bytes) and a closing paren
        mock_instance.fetch.return_value = ('OK', [mock_fetch_response_item, b')'])
        mock_instance.store.return_value = ('OK', [b'Store successful.'])
        mock_instance.close.return_value = ('OK', [b'Closed.'])
        mock_instance.logout.return_value = ('OK', [b'Logout successful.'])

        # 2. Initial state checks
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        # --- Act ---
        # Run the task directly (synchronously)
        process_incoming_emails()

        # --- Assert ---
        # 1. Check database state
        self.assertEqual(Bug.objects.count(), 1, "Should create exactly one bug.")
        self.assertEqual(ProcessedEmail.objects.count(), 1, "Should create one processed email record.")
        self.assertEqual(BugModificationLog.objects.count(), 0, "Should not create modification log on creation.")

        # 2. Check Bug details
        created_bug = Bug.objects.first()
        self.assertIsNotNone(created_bug)
        self.assertEqual(created_bug.bug_id, "NEW-001")
        self.assertEqual(created_bug.subject, mock_email_subject)
        self.assertEqual(created_bug.description, mock_email_body)
        self.assertEqual(created_bug.priority, Bug.Priority.HIGH, "Priority should be parsed from body.")
        self.assertEqual(created_bug.status, Bug.Status.OPEN, "Status should default to open.")
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
        mock_instance.store.assert_called_once_with(b'1', '+FLAGS', '\\Seen') # Check marked as Seen
        mock_instance.close.assert_called_once() # Check close was called
        mock_instance.logout.assert_called_once() # Check logout was called


    def test_update_existing_bug_from_email(self, MockIMAP4_SSL):
        """ Test that an email with an existing Bug ID updates the record and logs modification. """
        # --- Arrange ---
        # 1. Create initial bug
        initial_bug_id = "EXIST-002"
        initial_priority = Bug.Priority.LOW
        initial_bug = Bug.objects.create(
            bug_id=initial_bug_id, subject=f"Bug ID: {initial_bug_id} - Initial",
            description="Original description.", priority=initial_priority, status=Bug.Status.OPEN
        )
        initial_mod_count = initial_bug.modified_count

        # 2. Configure mock IMAP for the update email
        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', []); mock_instance.select.return_value = ('OK', [])
        mock_instance.state = 'SELECTED' # Set state
        mock_instance.search.return_value = ('OK', [b'2']) # Use UID '2'

        update_subject = f"Bug ID: {initial_bug_id} - Updated Details"
        update_body = "Description updated.\nPriority: Medium" # New priority in body
        update_msg_id = "<update-bug-test@example.com>"
        mock_fetch_response_item = create_mock_email_bytes(
            subject=update_subject, body=update_body, message_id=update_msg_id, uid=b'2'
        )
        mock_instance.fetch.return_value = ('OK', [mock_fetch_response_item, b')'])
        mock_instance.store.return_value = ('OK', []); mock_instance.close.return_value = ('OK', []); mock_instance.logout.return_value = ('OK', [])

        # 3. Initial state check
        self.assertEqual(Bug.objects.count(), 1)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        # 1. Check counts
        self.assertEqual(Bug.objects.count(), 1, "Should still be one bug.")
        self.assertEqual(ProcessedEmail.objects.count(), 1, "One email should be processed.")
        self.assertEqual(BugModificationLog.objects.count(), 1, "One modification should be logged.")

        # 2. Check Bug updates
        # It's safer to fetch fresh from DB than rely on instance potentially being stale
        updated_bug = Bug.objects.get(pk=initial_bug.pk)
        self.assertEqual(updated_bug.bug_id, initial_bug_id)
        self.assertEqual(updated_bug.subject, update_subject)
        self.assertEqual(updated_bug.description, update_body)
        self.assertEqual(updated_bug.priority, Bug.Priority.MEDIUM, "Priority should update based on body.")
        self.assertEqual(updated_bug.status, Bug.Status.OPEN) # Status didn't change
        self.assertEqual(updated_bug.modified_count, initial_mod_count + 1, "Modified count should increment.")

        # 3. Check ProcessedEmail
        processed_email = ProcessedEmail.objects.first(); self.assertEqual(processed_email.message_id, update_msg_id)

        # 4. Check Modification Log
        mod_log = BugModificationLog.objects.first(); self.assertEqual(mod_log.bug, updated_bug)
        self.assertTrue(timezone.now() - mod_log.modified_at < timezone.timedelta(seconds=10))

        # 5. Check mock calls
        mock_instance.fetch.assert_called_once_with(b'2', '(RFC822)')
        mock_instance.store.assert_called_once_with(b'2', '+FLAGS', '\\Seen')
        mock_instance.close.assert_called_once()
        mock_instance.logout.assert_called_once()


    def test_skip_duplicate_email(self, MockIMAP4_SSL):
        """ Test that an email with an already processed Message-ID is skipped but marked Seen. """
        # --- Arrange ---
        existing_msg_id = "<duplicate-test@example.com>"
        ProcessedEmail.objects.create(message_id=existing_msg_id) # Pre-populate processed record

        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', []); mock_instance.select.return_value = ('OK', [])
        mock_instance.state = 'SELECTED' # Set state
        mock_instance.search.return_value = ('OK', [b'3']) # UID 3

        mock_fetch_response_item = create_mock_email_bytes(
            subject="Bug ID: DUP-TEST", body="Body", message_id=existing_msg_id, uid=b'3'
        )
        mock_instance.fetch.return_value = ('OK', [mock_fetch_response_item, b')'])
        mock_instance.store.return_value = ('OK', []); mock_instance.close.return_value = ('OK', []); mock_instance.logout.return_value = ('OK', [])

        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 1) # Starts with 1 processed

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        self.assertEqual(Bug.objects.count(), 0, "No bug should be created.")
        self.assertEqual(ProcessedEmail.objects.count(), 1, "Processed count shouldn't increase.")
        self.assertEqual(BugModificationLog.objects.count(), 0)

        mock_instance.fetch.assert_called_once_with(b'3', '(RFC822)')
        # Should still be marked Seen to avoid retrying the duplicate check constantly
        mock_instance.store.assert_called_once_with(b'3', '+FLAGS', '\\Seen')
        mock_instance.close.assert_called_once()
        mock_instance.logout.assert_called_once()


    def test_skip_invalid_subject_format(self, MockIMAP4_SSL):
        """ Test that an email without 'Bug ID:' in subject is skipped and not marked Seen. """
        # --- Arrange ---
        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', []); mock_instance.select.return_value = ('OK', [])
        mock_instance.state = 'SELECTED' # Set state
        mock_instance.search.return_value = ('OK', [b'4']) # UID 4

        mock_fetch_response_item = create_mock_email_bytes(
            subject="Invalid Subject", body="Body", message_id="<invalid-subj@example.com>", uid=b'4'
        )
        mock_instance.fetch.return_value = ('OK', [mock_fetch_response_item, b')'])
        mock_instance.store.return_value = ('OK', []) # Should NOT be called
        mock_instance.close.return_value = ('OK', []); mock_instance.logout.return_value = ('OK', [])

        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        mock_instance.fetch.assert_called_once_with(b'4', '(RFC822)')
        mock_instance.store.assert_not_called() # IMPORTANT: Not marked Seen
        mock_instance.close.assert_called_once() # Finally block still runs
        mock_instance.logout.assert_called_once()


    def test_skip_missing_message_id(self, MockIMAP4_SSL):
        """ Test that an email missing the Message-ID header is skipped and not marked Seen. """
        # --- Arrange ---
        mock_instance = MockIMAP4_SSL.return_value
        mock_instance.login.return_value = ('OK', []); mock_instance.select.return_value = ('OK', [])
        mock_instance.state = 'SELECTED' # Set state
        mock_instance.search.return_value = ('OK', [b'5']) # UID 5

        # Use helper to create email bytes *without* Message-ID header
        mock_fetch_response_item = create_mock_email_bytes(
            subject="Bug ID: NO-MSGID", body="Body", message_id=None, uid=b'5'
        )
        mock_instance.fetch.return_value = ('OK', [mock_fetch_response_item, b')'])
        mock_instance.store.return_value = ('OK', []) # Should NOT be called
        mock_instance.close.return_value = ('OK', []); mock_instance.logout.return_value = ('OK', [])

        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)

        # --- Act ---
        process_incoming_emails()

        # --- Assert ---
        self.assertEqual(Bug.objects.count(), 0)
        self.assertEqual(ProcessedEmail.objects.count(), 0)
        self.assertEqual(BugModificationLog.objects.count(), 0)

        mock_instance.fetch.assert_called_once_with(b'5', '(RFC822)')
        mock_instance.store.assert_not_called() # IMPORTANT: Not marked Seen
        mock_instance.close.assert_called_once()
        mock_instance.logout.assert_called_once()


    def test_parse_priority_helper(self, MockIMAP4_SSL): # MockIMAP is unused but part of class patch
         """ Test the priority parsing helper function directly. """
         self.assertEqual(parse_priority_from_body("Hello\nPriority: High\nWorld"), "high")
         self.assertEqual(parse_priority_from_body("Priority: medium"), "medium")
         self.assertEqual(parse_priority_from_body("priority: LOW "), "low") # Check whitespace/case
         self.assertEqual(parse_priority_from_body("This email has high priority."), None)
         self.assertEqual(parse_priority_from_body("No priority mentioned."), None)
         self.assertEqual(parse_priority_from_body("Priority: Critical"), None) # Invalid level
         self.assertEqual(parse_priority_from_body(""), None)
         self.assertIsNone(parse_priority_from_body(None))