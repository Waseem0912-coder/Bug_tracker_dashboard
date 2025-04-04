import random
from datetime import timedelta, datetime 
import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.db.models import F
from api.models import Bug, BugModificationLog

class Command(BaseCommand):
    help = 'Populates the database with sample bugs and modification logs over a specified period.'

    def add_arguments(self, parser):

        parser.add_argument('--bugs', type=int, default=25, help='Number of initial bugs to create.')
        parser.add_argument('--updates', type=int, default=50, help='Number of bug updates (modifications) to create.') 
        parser.add_argument('--days', type=int, default=30, help='Number of past days to distribute modifications over.')

    @transaction.atomic
    def handle(self, *args, **options):
        num_bugs = options['bugs']
        num_updates = options['updates']
        num_days = max(options['days'], 1) 

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

            created_days_ago = random.randint(0, num_days // 2)
            created_at_sim = now - timedelta(days=created_days_ago, hours=random.randint(0,23))

            created_at_sim = min(created_at_sim, now)

            description = f"Generated bug {bug_id}.\nPriority: {priority.capitalize()}\nStatus: {status.capitalize()}"

            bug = Bug(
                bug_id=bug_id,
                subject=subject,
                description=description,
                priority=priority,
                status=status,
                created_at=created_at_sim, 
                updated_at=created_at_sim, 
            )
            bug.save() 
            created_bugs.append(bug)

        self.stdout.write(self.style.SUCCESS(f"Successfully created {len(created_bugs)} bugs."))

        if not created_bugs: return

        self.stdout.write(f"Simulating {num_updates} bug updates over the last {num_days} days...")
        update_count = 0; log_count = 0

        for i in range(num_updates):
            bug_to_update = random.choice(created_bugs)

            days_ago = random.randint(0, num_days - 1) 
            simulated_datetime = now - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            min_mod_time = bug_to_update.created_at + timedelta(minutes=1)
            final_simulated_date = max(simulated_datetime, min_mod_time)

            final_simulated_date = min(final_simulated_date, now)

            new_description = f"Description updated on {final_simulated_date.strftime('%Y-%m-%d %H:%M')}.\n" \
                              f"Old description started: {bug_to_update.description[:50]}..."

            updated_rows = Bug.objects.filter(pk=bug_to_update.pk).update(
                description=new_description,
                modified_count=F('modified_count') + 1,

                updated_at=final_simulated_date
            )

            if updated_rows > 0:
                update_count += 1

                BugModificationLog.objects.create(
                    bug=bug_to_update, 
                    modified_at=final_simulated_date
                )
                log_count += 1
            else:
                self.stdout.write(self.style.WARNING(f"Failed to update bug {bug_to_update.pk}"))

            if (i + 1) % 10 == 0: self.stdout.write(f"  Simulated {i+1}/{num_updates} updates...")

        self.stdout.write(self.style.SUCCESS(f"Simulated {update_count} updates, created {log_count} logs."))
        self.stdout.write("Population complete.")