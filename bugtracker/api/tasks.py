# api/tasks.py
import email
import imaplib
import logging
import re
from email.header import decode_header

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.db.models import F

# Make sure your models are imported correctly
from .models import Bug, BugModificationLog, ProcessedEmail

logger = logging.getLogger(__name__) # Use logger configured in settings.py

def decode_subject(subject_header):
    """Decodes email subject header, handling different encodings."""
    decoded_parts = decode_header(subject_header)
    subject = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try:
                subject += part.decode(encoding or 'utf-8', errors='replace')
            except LookupError: # Handle unknown encodings
                subject += part.decode('utf-8', errors='replace')
        else:
            # If it's already a string (or None)
            subject += part or ""
    return subject.strip()

def get_plain_text_body(msg):
    """Extracts the plain text body from an email message."""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))

            # Look for plain text parts, ignore attachments
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    charset = part.get_content_charset() or 'utf-8'
                    payload = part.get_payload(decode=True)
                    return payload.decode(charset, errors='replace')
                except Exception as e:
                     logger.warning(f"Could not decode plain text part: {e}")
                     continue # Try next part
    else:
        # Not multipart, assume plain text if content type matches
        if msg.get_content_type() == "text/plain":
             try:
                charset = msg.get_content_charset() or 'utf-8'
                payload = msg.get_payload(decode=True)
                return payload.decode(charset, errors='replace')
             except Exception as e:
                 logger.warning(f"Could not decode single part message: {e}")
    return None # No plain text body found

@shared_task(bind=True, max_retries=3, default_retry_delay=60) # Add retry logic
def process_incoming_emails(self):
    """
    Celery task to fetch unread emails via IMAP, parse them,
    and create/update Bug records.
    """
    logger.info("Starting email processing task...")
    try:
        # Connect to IMAP server (using credentials from settings.py/.env)
        mail = imaplib.IMAP4_SSL(settings.IMAP_SERVER, settings.IMAP_PORT)
        mail.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
        logger.info(f"Logged in as {settings.IMAP_USER}")

        mail.select('inbox') # Select the mailbox (e.g., 'inbox')

        # Search for unread (UNSEEN) emails
        status, messages = mail.search(None, '(UNSEEN)')
        if status != 'OK':
            logger.error("Failed to search for emails.")
            mail.logout()
            return

        email_ids = messages[0].split()
        logger.info(f"Found {len(email_ids)} unread emails.")

        processed_count = 0
        skipped_count = 0

        for email_id in email_ids:
            msg_data = None # Initialize msg_data
            try:
                # Fetch the email content (RFC822)
                res, msg_data = mail.fetch(email_id, '(RFC822)')
                if res != 'OK' or not msg_data or not msg_data[0]:
                     logger.warning(f"Failed to fetch email ID {email_id.decode()}. Skipping.")
                     skipped_count += 1
                     continue

                # Ensure msg_data[0] is a tuple before accessing index 1
                if isinstance(msg_data[0], tuple) and len(msg_data[0]) >= 2:
                     raw_email = msg_data[0][1]
                else:
                     logger.warning(f"Unexpected structure in msg_data for email ID {email_id.decode()}. Skipping.")
                     skipped_count += 1
                     continue

                # Parse the raw email content
                msg = email.message_from_bytes(raw_email)

                # ---- 1. Get Unique Message-ID ----
                message_id_header = msg.get('Message-ID')
                if not message_id_header:
                    logger.warning(f"Email ID {email_id.decode()} is missing Message-ID header. Skipping.")
                    skipped_count += 1
                    continue # Skip emails without a Message-ID
                message_id = message_id_header.strip()

                # ---- 2. Check if Already Processed ----
                if ProcessedEmail.objects.filter(message_id=message_id).exists():
                    logger.info(f"Email with Message-ID {message_id} already processed. Marking as Seen and skipping.")
                    # Mark as seen even if skipped to prevent reprocessing attempts
                    mail.store(email_id, '+FLAGS', '\\Seen')
                    skipped_count += 1
                    continue

                # ---- 3. Parse Subject for Bug ID ----
                subject_header = msg.get('Subject', '')
                subject = decode_subject(subject_header)
                # Regex to find "Bug ID: [alphanumeric/hyphen]" (case-insensitive)
                match = re.search(r'Bug ID:\s*([\w-]+)', subject, re.IGNORECASE)
                if not match:
                    logger.warning(f"Could not extract Bug ID from subject: '{subject}'. Skipping email {message_id}.")
                    skipped_count += 1
                    continue # Skip if Bug ID format not found
                extracted_bug_id = match.group(1).strip()

                # ---- 4. Parse Body for Description ----
                description = get_plain_text_body(msg)
                if description is None:
                    logger.warning(f"Could not extract plain text body from email {message_id}. Skipping.")
                    skipped_count += 1
                    continue # Skip if no usable body found

                # ---- 5. Database Interaction (Atomic Transaction) ----
                try:
                    with transaction.atomic():
                        bug, created = Bug.objects.get_or_create(
                            bug_id=extracted_bug_id,
                            defaults={
                                'subject': subject,
                                'description': description
                                # Status and Priority use model defaults
                            }
                        )

                        if created:
                            logger.info(f"Created new Bug: {bug.bug_id} from email {message_id}")
                        else:
                            # Update existing bug
                            bug.description = description
                            bug.subject = subject # Also update subject in case it changed
                            bug.modified_count = F('modified_count') + 1 # Use F object
                            bug.save(update_fields=['description', 'subject', 'modified_count', 'updated_at']) # Explicitly save updated fields
                            bug.refresh_from_db() # Reload to get updated modified_count

                            # Create modification log entry
                            BugModificationLog.objects.create(bug=bug, modified_at=timezone.now())
                            logger.info(f"Updated existing Bug: {bug.bug_id} (Modified count: {bug.modified_count}) from email {message_id}")

                        # ---- 6. Record Processed Email ----
                        ProcessedEmail.objects.create(message_id=message_id)

                        # ---- 7. Mark Email as Read (Seen) in Mailbox ----
                        mail.store(email_id, '+FLAGS', '\\Seen')
                        logger.debug(f"Marked email ID {email_id.decode()} as Seen.")
                        processed_count += 1

                except Exception as db_error:
                     # Log database errors specifically
                     logger.error(f"Database error processing email {message_id} for bug {extracted_bug_id}: {db_error}", exc_info=True)
                     # Do NOT mark as Seen if DB update failed, allow retry
                     skipped_count += 1
                     continue # Move to next email

            except Exception as processing_error:
                 # Catch other errors during fetching/parsing for a single email
                 logger.error(f"Error processing email ID {email_id.decode()}: {processing_error}", exc_info=True)
                 # Do not mark as seen, allow potential retry by Celery
                 skipped_count += 1
                 continue # Move to next email

        logger.info(f"Finished processing emails. Processed: {processed_count}, Skipped: {skipped_count}.")

    except imaplib.IMAP4.error as imap_error:
        logger.error(f"IMAP connection or login error: {imap_error}", exc_info=True)
        # Retry the task if connection failed
        try:
            self.retry(exc=imap_error)
        except self.MaxRetriesExceededError:
            logger.critical("Max retries exceeded for email processing task due to IMAP errors.")
    except Exception as e:
        # Catch broader errors (e.g., settings issues)
        logger.error(f"Unexpected error during email processing task: {e}", exc_info=True)
        # Optionally retry for other transient errors
        # self.retry(exc=e)
    finally:
        # Ensure logout happens even if errors occurred mid-processing
        if 'mail' in locals() and mail.state == 'SELECTED':
            try:
                mail.close()
                mail.logout()
                logger.info("IMAP connection closed and logged out.")
            except Exception as logout_err:
                logger.error(f"Error during IMAP close/logout: {logout_err}")