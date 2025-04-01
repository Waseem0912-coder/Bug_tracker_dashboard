
import os
import re
import email
from email.header import decode_header
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone 
from django.core.management import call_command 
from dotenv import load_dotenv
from imap_tools import MailBox, MailMessageFlags, AND
from api.models import Bug, EmailLog 

load_dotenv() 

# --- Configuration ---
IMAP_HOST = os.getenv('EMAIL_HOST')
IMAP_PORT = int(os.getenv('EMAIL_PORT', 993))
IMAP_USER = os.getenv('EMAIL_USER')
IMAP_PASSWORD = os.getenv('EMAIL_PASSWORD')
# Example: Subject: [BUG-XYZ-123] Login Error alpha numeric type
SUBJECT_ID_REGEX = r"\[([A-Z0-9-]+)\]" 

def decode_email_header(header):
    decoded_parts = decode_header(header)
    header_str = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            header_str += part.decode(encoding or 'utf-8', errors='replace')
        else:
            header_str += part
    return header_str



def parse_email_body(body_text):

    details = {
        'priority': None,
        'status': None,
        'description': None,
        'assignee': None,
    }
    description_lines = []
    found_description_keyword = False

    keyword_lines = []
    known_keywords = ["priority:", "status:", "assigned to:", "assignee:", "description:"]

    lines = body_text.splitlines()

    for i, line in enumerate(lines):
        line_strip = line.strip()
        low_line = line_strip.lower()

        matched_keyword = False
        for keyword in known_keywords:
            if low_line.startswith(keyword):
                keyword_lines.append(i) 
                value = line_strip.split(":", 1)[1].strip()
                matched_keyword = True

                if keyword == "priority:":
                    details['priority'] = value.upper()
                elif keyword == "status:":
                    details['status'] = value.upper()
                elif keyword in ["assigned to:", "assignee:"]:
                    details['assignee'] = value
                elif keyword == "description:":
                    found_description_keyword = True
                    description_lines.append(value)
                    for j in range(i + 1, len(lines)):
                        keyword_lines.append(j)
                        description_lines.append(lines[j].strip())
                    break 
        if found_description_keyword:
             break 

    if not found_description_keyword:
        for i, line in enumerate(lines):
            if i not in keyword_lines:
                description_lines.append(line.strip())

    details['description'] = "\n".join(description_lines).strip()

    valid_priorities = [p[0] for p in Bug.PRIORITY_CHOICES]
    valid_statuses = [s[0] for s in Bug.STATUS_CHOICES]

    if details['priority'] and details['priority'] not in valid_priorities:
        print(f"Warning: Invalid priority '{details['priority']}' parsed. Ignoring.")
        details['priority'] = None 
    if details['status'] and details['status'] not in valid_statuses:
        print(f"Warning: Invalid status '{details['status']}' parsed. Ignoring.")
        details['status'] = None 

    return details 

# --- Main Command Logic ---
class Command(BaseCommand):
    help = 'Checks email, creates/updates Bugs, and logs email details.'

    def handle(self, *args, **options):
        self.stdout.write("Connecting to mailbox...")
        try:
            with MailBox(IMAP_HOST, port=IMAP_PORT).login(IMAP_USER, IMAP_PASSWORD, initial_folder='INBOX') as mailbox:
                self.stdout.write(f"Connected. Fetching unseen emails...")
                messages = mailbox.fetch(AND(seen=False), mark_seen=False, bulk=True)
                processed_count = 0
                for msg in messages:
                    current_time = timezone.now()  
                    try:
                        subject = decode_email_header(msg.subject)
                        match = re.search(SUBJECT_ID_REGEX, subject)
                        if not match:
                            self.stdout.write(f"  Skipping email (UID {msg.uid}): No unique ID found.")
                            continue

                        unique_id = match.group(1)
                        body_text = msg.text or msg.html
                        if not body_text:
                            self.stdout.write(f"  Skipping email (UID {msg.uid}, ID {unique_id}): No text body.")
                            continue

                        self.stdout.write(f"  Processing email for Bug ID: {unique_id} (UID {msg.uid})")
                        parsed_details = parse_email_body(body_text)

                         
                        bug, created = Bug.objects.get_or_create(
                            unique_id=unique_id,
                            defaults={
                                'latest_subject': subject,
                                'priority': parsed_details.get('priority') or Bug._meta.get_field('priority').get_default(),
                                'status': parsed_details.get('status') or Bug._meta.get_field('status').get_default(),
                                'description': parsed_details.get('description') or '',
                                'assignee': parsed_details.get('assignee'),
                                'last_email_received_at': current_time,
                            }
                        )

                        EmailLog.objects.create(
                            bug=bug,
                            received_at=current_time,
                            email_subject=subject,
                            parsed_priority=parsed_details.get('priority'),
                            parsed_status=parsed_details.get('status'),
                            parsed_description=parsed_details.get('description'),
                            parsed_assignee=parsed_details.get('assignee'),
                        )


                        update_data = {
                            'last_email_received_at': current_time,
                            'latest_subject': subject
                        }
                        if parsed_details.get('priority') is not None:
                            update_data['priority'] = parsed_details['priority']
                        if parsed_details.get('status') is not None:
                            update_data['status'] = parsed_details['status']
                        if parsed_details.get('description') is not None:
                            update_data['description'] = parsed_details['description']
                        if 'assignee' in parsed_details: 
                            update_data['assignee'] = parsed_details['assignee']

                        for key, value in update_data.items():
                            setattr(bug, key, value)
                        bug.save() 


                        if created:
                            self.stdout.write(self.style.SUCCESS(f"    -> CREATED new bug: {unique_id} and logged first email."))
                        else:
                            self.stdout.write(self.style.SUCCESS(f"    -> UPDATED bug: {unique_id} with info from new email and logged it."))

                        mailbox.flag(msg.uid, MailMessageFlags.SEEN, True)
                        processed_count += 1

                    except Exception as e:
                         self.stderr.write(self.style.ERROR(f"    -> FAILED processing email UID {msg.uid} for bug {unique_id if 'unique_id' in locals() else 'N/A'}: {e}"))
                         import traceback
                         traceback.print_exc() 

                self.stdout.write(f"Finished. Processed {processed_count} emails.")
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to connect or process emails: {e}"))
            import traceback
            traceback.print_exc()