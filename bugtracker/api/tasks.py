# api/tasks.py
import email
import imaplib
import logging
import re # Import regex module
from email.header import decode_header

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.db.models import F

from .models import Bug, BugModificationLog, ProcessedEmail # Import Bug model

logger = logging.getLogger(__name__)

# --- Email Decoding Helpers (keep as before) ---
def decode_subject(subject_header):
    # ... (same implementation) ...
    decoded_parts = decode_header(subject_header)
    subject = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try: subject += part.decode(encoding or 'utf-8', errors='replace')
            except LookupError: subject += part.decode('utf-8', errors='replace')
        else: subject += part or ""
    return subject.strip()

def get_plain_text_body(msg):
    # ... (same implementation) ...
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            if content_type == "text/plain" and "attachment" not in content_disposition:
                try:
                    charset = part.get_content_charset() or 'utf-8'
                    payload = part.get_payload(decode=True)
                    return payload.decode(charset, errors='replace')
                except Exception as e: logger.warning(f"Could not decode plain text part: {e}")
    else:
        if msg.get_content_type() == "text/plain":
             try:
                charset = msg.get_content_charset() or 'utf-8'
                payload = msg.get_payload(decode=True)
                return payload.decode(charset, errors='replace')
             except Exception as e: logger.warning(f"Could not decode single part message: {e}")
    return None
# --- END Email Decoding Helpers ---


# --- NEW: Priority Parsing Helper ---
def parse_priority_from_body(body_text):
    """
    Parses the body text to find a 'Priority: [level]' line.
    Returns 'high', 'medium', 'low', or None.
    """
    if not body_text:
        return None

    # Regex to find "Priority:" (case-insensitive) at the start of a line,
    # followed by optional space, then the priority level.
    # It captures 'high', 'medium', or 'low' case-insensitively.
    match = re.search(r'^\s*priority:\s*(high|medium|low)\s*$', body_text, re.IGNORECASE | re.MULTILINE)

    if match:
        parsed_level = match.group(1).lower()
        logger.debug(f"Parsed priority '{parsed_level}' from body.")
        # Return the matched level only if it's valid (it should be due to regex)
        if parsed_level in [p[0] for p in Bug.Priority.choices]:
            return parsed_level
        else:
            logger.warning(f"Parsed priority value '{parsed_level}' is not a valid choice.")
            return None # Should not happen with current regex, but defensive
    else:
        logger.debug("No priority found in body.")
        return None
# --- END Priority Parsing Helper ---


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_incoming_emails(self):
    """
    Celery task to fetch emails, parse them (including priority from body),
    and create/update Bug records.
    """
    logger.info("Starting email processing task...")
    try:
        mail = imaplib.IMAP4_SSL(settings.IMAP_SERVER, settings.IMAP_PORT)
        mail.login(settings.IMAP_USER, settings.IMAP_PASSWORD)
        logger.info(f"Logged in as {settings.IMAP_USER}")
        mail.select('inbox')
        status, messages = mail.search(None, '(UNSEEN)')
        if status != 'OK': # ... error handling ...
            logger.error("Failed to search emails."); mail.logout(); return

        email_ids = messages[0].split()
        logger.info(f"Found {len(email_ids)} unread emails.")
        processed_count = 0; skipped_count = 0

        for email_id in email_ids:
            msg_data = None
            try:
                res, msg_data = mail.fetch(email_id, '(RFC822)')
                if res != 'OK' or not msg_data or not msg_data[0]: # ... error handling ...
                     logger.warning(f"Failed to fetch email ID {email_id.decode()}. Skipping."); skipped_count += 1; continue
                if isinstance(msg_data[0], tuple) and len(msg_data[0]) >= 2: raw_email = msg_data[0][1]
                else: logger.warning(f"Unexpected structure in msg_data for email ID {email_id.decode()}. Skipping."); skipped_count += 1; continue

                msg = email.message_from_bytes(raw_email)

                # 1. Get Message-ID & Check if Processed
                message_id_header = msg.get('Message-ID')
                if not message_id_header: # ... skip if no Message-ID ...
                    logger.warning(f"Email ID {email_id.decode()} missing Message-ID. Skipping."); skipped_count += 1; continue
                message_id = message_id_header.strip()
                if ProcessedEmail.objects.filter(message_id=message_id).exists(): # ... skip if processed ...
                    logger.info(f"Email {message_id} already processed. Marking Seen."); mail.store(email_id, '+FLAGS', '\\Seen'); skipped_count += 1; continue

                # 2. Parse Subject for Bug ID
                subject_header = msg.get('Subject', ''); subject = decode_subject(subject_header)
                match = re.search(r'Bug ID:\s*([\w-]+)', subject, re.IGNORECASE)
                if not match: # ... skip if no Bug ID ...
                    logger.warning(f"No Bug ID in subject: '{subject}'. Skipping {message_id}."); skipped_count += 1; continue
                extracted_bug_id = match.group(1).strip()

                # 3. Parse Body for Description AND Priority
                description = get_plain_text_body(msg)
                if description is None: # ... skip if no body ...
                    logger.warning(f"No plain text body in {message_id}. Skipping."); skipped_count += 1; continue
                # --- Call the new parser ---
                parsed_priority = parse_priority_from_body(description)
                # ---------------------------

                # 4. Database Interaction
                try:
                    with transaction.atomic():
                        bug, created = Bug.objects.get_or_create(
                            bug_id=extracted_bug_id,
                            # Remove priority from defaults here, set it explicitly below
                            defaults={'subject': subject, 'description': description}
                        )

                        if created:
                            # --- Set priority for NEW bug ---
                            bug.priority = parsed_priority or Bug.Priority.MEDIUM # Use parsed or default
                            bug.save() # Save the priority along with other defaults
                            # --------------------------------
                            logger.info(f"Created new Bug: {bug.bug_id} (Priority: {bug.priority}) from email {message_id}")
                        else:
                            # Update existing bug
                            update_fields = ['description', 'subject', 'updated_at'] # Start list of fields to update
                            bug.description = description
                            bug.subject = subject # Update subject too
                            bug.modified_count = F('modified_count') + 1
                            update_fields.append('modified_count')

                            # --- Update priority for EXISTING bug IF parsed ---
                            if parsed_priority and parsed_priority != bug.priority:
                                bug.priority = parsed_priority
                                update_fields.append('priority') # Add priority to fields being updated
                                logger.info(f"Updating priority for Bug {bug.bug_id} to '{parsed_priority}'.")
                            # -----------------------------------------------

                            bug.save(update_fields=update_fields) # Save only changed fields
                            bug.refresh_from_db() # Reload to get updated modified_count

                            BugModificationLog.objects.create(bug=bug, modified_at=timezone.now())
                            logger.info(f"Updated existing Bug: {bug.bug_id} (Mod count: {bug.modified_count}, Priority: {bug.priority}) from email {message_id}")

                        # 5. Record Processed Email & Mark Seen
                        ProcessedEmail.objects.create(message_id=message_id)
                        mail.store(email_id, '+FLAGS', '\\Seen')
                        logger.debug(f"Marked email ID {email_id.decode()} as Seen.")
                        processed_count += 1

                except Exception as db_error: # ... DB error handling ...
                     logger.error(f"DB error processing {message_id} for bug {extracted_bug_id}: {db_error}", exc_info=True); skipped_count += 1; continue

            except Exception as processing_error: # ... Other error handling ...
                 logger.error(f"Error processing email ID {email_id.decode()}: {processing_error}", exc_info=True); skipped_count += 1; continue

        logger.info(f"Finished. Processed: {processed_count}, Skipped: {skipped_count}.")

    except imaplib.IMAP4.error as imap_error: # ... IMAP error handling ...
        logger.error(f"IMAP connection error: {imap_error}", exc_info=True);
        try: self.retry(exc=imap_error)
        except self.MaxRetriesExceededError: logger.critical("Max retries exceeded for email task.")
    except Exception as e: # ... General error handling ...
        logger.error(f"Unexpected error in email task: {e}", exc_info=True)
    finally: # ... IMAP logout ...
        if 'mail' in locals() and mail.state == 'SELECTED':
            try: mail.close(); mail.logout(); logger.info("IMAP logged out.")
            except Exception as logout_err: logger.error(f"IMAP logout error: {logout_err}")