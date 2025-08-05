# reports/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Report, ReportVersion
from .services import version_control

User = get_user_model()

class VersionControlTests(TestCase):
    def setUp(self):
        """
        This method runs before each test. We use it to set up
        common objects like a user and a report.
        """
        self.user = User.objects.create_user(username='testuser', password='password')
        self.report = Report.objects.create(
            user=self.user,
            title="Test Report",
            content="Initial content."
        )

    def test_create_new_version(self):
        """
        Tests that a new version is created correctly.
        """
        self.assertEqual(self.report.versions.count(), 0) # Initially no versions

        # Create the first version
        reason1 = "First draft generated."
        version_control.create_new_version(
            report=self.report,
            new_content="This is the first version.",
            edit_reason=reason1
        )

        self.assertEqual(self.report.versions.count(), 1)
        v1 = self.report.versions.first()
        self.assertEqual(v1.version_number, 1)
        self.assertEqual(v1.edit_reason, reason1)
        self.assertEqual(v1.content_snapshot, "This is the first version.")

        # Check if the main report content was updated
        self.report.refresh_from_db()
        self.assertEqual(self.report.content, "This is the first version.")

        # Create a second version
        reason2 = "Added more details."
        version_control.create_new_version(
            report=self.report,
            new_content="This is the second, updated version.",
            edit_reason=reason2
        )

        self.assertEqual(self.report.versions.count(), 2)
        latest_version = self.report.versions.order_by('-version_number').first()
        self.assertEqual(latest_version.version_number, 2)