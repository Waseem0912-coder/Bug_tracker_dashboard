import difflib
from django.db import transaction
from django.db.models import Max
from ..models import Report, ReportVersion

@transaction.atomic
def create_new_version(report: Report, new_content: str, edit_reason: str = "Initial version"):
    """
    Creates a new version of a report and updates the main report's content.
    This is the primary function for saving any change to a report.
    It runs in a transaction to ensure data integrity.

    Args:
        report (Report): The Report model instance to version.
        new_content (str): The full text content of the new version.
        edit_reason (str): A short description of what changed.

    Returns:
        ReportVersion: The newly created version object.
    """
    # Find the latest version number for this specific report
    latest_version_num = report.versions.aggregate(
        max_version=Max('version_number')
    )['max_version'] or 0

    # Create the new version snapshot
    new_version = ReportVersion.objects.create(
        report=report,
        version_number=latest_version_num + 1,
        content_snapshot=new_content,
        edit_reason=edit_reason
    )

    # Update the main report object to reflect the latest content
    report.content = new_content
    report.save(update_fields=['content', 'last_modified'])

    return new_version

def get_report_history(report: Report):
    """
    Retrieves the entire version history for a given report, ordered from newest to oldest.

    Args:
        report (Report): The Report instance.

    Returns:
        QuerySet: A QuerySet of ReportVersion objects.
    """
    return report.versions.order_by('-version_number')

def rollback_to_version(version: ReportVersion):
    """
    Rolls back a report to a previous version by creating a *new* version
    that contains the content of the old one. This preserves the full history.

    Args:
        version (ReportVersion): The version object to roll back to.

    Returns:
        ReportVersion: The newly created version object representing the rollback.
    """
    report = version.report
    edit_reason = f"Rolled back to Version {version.version_number}"
    
    # Create a new version using the old version's content
    return create_new_version(
        report=report,
        new_content=version.content_snapshot,
        edit_reason=edit_reason
    )

def get_version_diff_html(version1: ReportVersion, version2: ReportVersion):
    """
    Generates an HTML side-by-side diff between two report versions.

    Args:
        version1 (ReportVersion): The first version for comparison.
        version2 (ReportVersion): The second version for comparison.

    Returns:
        str: An HTML table string representing the diff.
    """
    differ = difflib.HtmlDiff(wrapcolumn=80)
    
    # splitlines() is necessary for the differ to work correctly
    content1_lines = version1.content_snapshot.splitlines()
    content2_lines = version2.content_snapshot.splitlines()

    v1_label = f"Version {version1.version_number}"
    v2_label = f"Version {version2.version_number}"

    html_diff = differ.make_table(
        fromlines=content1_lines,
        tolines=content2_lines,
        fromdesc=v1_label,
        todesc=v2_label,
    )
    return html_diff