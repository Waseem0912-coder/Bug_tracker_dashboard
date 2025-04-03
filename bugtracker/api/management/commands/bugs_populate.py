# api/management/commands/populate_bugs.py
import random
from datetime import timedelta, datetime # Import datetime
import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.db.models import F
from api.models import Bug, BugModificationLog

class Command(BaseCommand):
    help = 'Populates the database with sample bugs and modification logs over a specified period.'

    def add_arguments(self, parser):
        # ... (arguments --bugs, --updates, --days remain the same) ...
        parser.add_argument('--bugs', type=int, default=25, help='Number of initial bugs to create.')
        parser.add_argument('--updates', type=int, default=50, help='Number of bug updates (modifications) to create.') # Increased default
        parser.add_argument('--days', type=int, default=30, help='Number of past days to distribute modifications over.')


    @transaction.atomic
    def handle(self, *args, **options):
        num_bugs = options['bugs']
        num_updates = options['updates']
        num_days = max(options['days'], 1) # Ensure at least 1 day range

        self.stdout.write("Deleting existing Bug and BugModificationLog data...")
        Bug.objects.all().delete()

        self.stdout.write(f"Creating {num_bugs} new bugs...")
        created_bugs = []
        priorities = [p[0] for p in Bug.Priority.choices]
        statuses = [s[0] for s in Bug.Status.choices]
        now = timezone.now()

        for i in range(num_bugs):
            bug_id = f"POP-{uuid.uuid4().hex[:6].upper()}"
            priority = random.choice(priorities)
            status = random.choice([Bug.Status.OPEN, Bug.Status.IN_PROGRESS])
            subject = f"Bug ID: {bug_id} - Sample Issue {i+1}"
            # --- Simulate slightly older creation dates too ---
            # Spread creation over roughly the last half of the modification period
            created_days_ago = random.randint(0, num_days // 2)
            created_at_sim = now - timedelta(days=created_days_ago, hours=random.randint(0,23))
            # Ensure created_at isn't in the future (edge case if days=0)
            created_at_sim = min(created_at_sim, now)
            # -------------------------------------------------

            description = f"Generated bug {bug_id}.\nPriority: {priority.capitalize()}\nStatus: {status.capitalize()}"

            # We need to manually set created_at and updated_at if simulating past creation
            bug = Bug(
                bug_id=bug_id,
                subject=subject,
                description=description,
                priority=priority,
                status=status,
                created_at=created_at_sim, # Set simulated creation time
                updated_at=created_at_sim, # Initial update time matches creation
            )
            bug.save() # Save the bug first
            created_bugs.append(bug)
            # Note: auto_now_add/auto_now are bypassed when explicitly setting dates

        self.stdout.write(self.style.SUCCESS(f"Successfully created {len(created_bugs)} bugs."))

        if not created_bugs: return

        self.stdout.write(f"Simulating {num_updates} bug updates over the last {num_days} days...")
        update_count = 0; log_count = 0

        for i in range(num_updates):
            bug_to_update = random.choice(created_bugs)

            # --- Calculate simulated modification date *independently* ---
            # Ensure modification happens within the specified day range *relative to now*
            days_ago = random.randint(0, num_days - 1) # Range from 0 (today) up to days-1 ago
            simulated_datetime = now - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            # --- Ensure modification date is AFTER creation date ---
            # Add a small delta (e.g., 1 minute) to avoid exact same timestamp issues
            min_mod_time = bug_to_update.created_at + timedelta(minutes=1)
            final_simulated_date = max(simulated_datetime, min_mod_time)
            # Ensure modification isn't in the future (edge case)
            final_simulated_date = min(final_simulated_date, now)
            # --------------------------------------------------------

            # Update fields (only description for simplicity now)
            new_description = f"Description updated on {final_simulated_date.strftime('%Y-%m-%d %H:%M')}.\n" \
                              f"Old description started: {bug_to_update.description[:50]}..."

            # Update using .update() for efficiency & correct F() usage
            updated_rows = Bug.objects.filter(pk=bug_to_update.pk).update(
                description=new_description,
                modified_count=F('modified_count') + 1,
                # Manually set updated_at to match simulated date
                updated_at=final_simulated_date
            )

            if updated_rows > 0:
                update_count += 1
                # Create modification log with the SIMULATED date
                BugModificationLog.objects.create(
                    bug=bug_to_update, # Pass the instance
                    modified_at=final_simulated_date
                )
                log_count += 1
            else:
                self.stdout.write(self.style.WARNING(f"Failed to update bug {bug_to_update.pk}"))


            if (i + 1) % 10 == 0: self.stdout.write(f"  Simulated {i+1}/{num_updates} updates...")

        self.stdout.write(self.style.SUCCESS(f"Simulated {update_count} updates, created {log_count} logs."))
        self.stdout.write("Population complete.")