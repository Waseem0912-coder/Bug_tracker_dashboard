https://github.com/Waseem0912-coder/Bug_tracker_dashboard/tree/submission
# Bug Tracker from Email - Take-Home Test Submission

This Project features a Django backend that processes bug reports sent via email and a React frontend for viewing and analyzing bug data.

## Core Features Implemented

*   **Email Processing (IMAP):** Connects to a configured IMAP account, fetches unread emails, and processes them asynchronously using Celery and Redis.
*   **Bug Creation & Updates:**
    *   Parses email subjects matching `Bug ID: [ID] - ...` to extract a unique ID and subject line.
    *   Uses the email body as the bug description.
    *   Creates a new `Bug` record if the ID is new.
    *   Updates the existing `Bug` record (description, subject) if the ID exists.
*   **Priority Parsing:** Detects `Priority: [High|Medium|Low]` (case-insensitive, start of line) within the email body to set the bug's priority (defaults to Medium if not found).
*   **Modification Tracking:**
    *   Increments a `modified_count` on the `Bug` model each time it's updated via email.
    *   Logs each modification event (triggered by email updates) to a separate `BugModificationLog` table with a timestamp.
*   **Backend API (Django REST Framework):**
    *   **Authentication:** JWT-based login (`/api/token/`), refresh (`/api/token/refresh/`), and token blacklist on logout.
    *   **Registration:** Self-service user signup (`/api/register/`), automatically assigning new users to a 'Viewer' group.
    *   **Bugs:**
        *   List (`GET /api/bugs/`): Paginated, searchable (by ID, subject, description), requires authentication. Supports `page_size` query parameter.
        *   Detail (`GET /api/bugs/{bug_id}/`): Retrieves specific bug, requires authentication.
        *   Status Update (`PATCH /api/bugs/{bug_id}/status/`): Allows users in 'Developer' or 'Admin' groups to change bug status (expects internal status key like `in_progress`).
    *   **Dashboard Data:** (`GET /api/bug_modifications/`): Returns aggregated counts of modification events per date, filterable by priority (`?priority=[high|medium|low]`), requires authentication.
*   **Role-Based Access Control (Basic):**
    *   Utilizes Django Groups: `Admin`, `Developer`, `Viewer`.
    *   Status updates restricted to `Developer` and `Admin` groups via API permissions.
    *   Relies on admin creation of initial Admin/Developer users and group assignments via Django Admin interface.
*   **Frontend (React + Vite + Material UI):**
    *   User Login and Signup pages.
    *   Protected routing for authenticated users.
    *   Main application layout with navigation (`AppBar`).
    *   **Bug List Page:** Displays bugs in an MUI `Table`, supports pagination and search (debounced). Links to detail view. Status/Priority shown using `Chip` components.
    *   **Bug Detail Page:** Displays all relevant bug information. Includes a dropdown for authorized users (Developer/Admin) to update the bug status.
    *   **Dashboard Page:** Displays a Recharts `BarChart` visualizing bug modification counts over time. Includes toggle buttons to filter the chart data by priority ('all', 'high', 'medium', 'low'), dynamically changing bar colors.
    *   Uses a GitHub-inspired dark theme via MUI Theming.

## Technologies Used

*   **Backend:** Python 3, Django, DRF, Celery, Redis, `imaplib`, `python-dotenv`
*   **Frontend:** React (Vite), Material UI, React Router, Axios, Recharts
*   **Database:** SQLite (for development/submission), PostgreSQL compatible
*   **Testing:** Django `TestCase`, `unittest.mock`
*   **Version Control:** Git

## Running the Project (for Review)

Instructions for setting up and running the project would typically be provided separately or discussed during the review/demo, as they involve environment setup (.env files with credentials), database migrations, creating initial users/groups, and running multiple services (Django, Celery Worker, Celery Beat, Redis, Frontend).

**Key Setup Points:**

1.  Install backend (`requirements.txt`) and frontend (`package.json`) dependencies.
2.  Configure backend `.env` with database settings, a `DJANGO_SECRET_KEY`, and **valid IMAP credentials** for email processing.
3.  Run Django migrations (`python manage.py migrate`).
4.  Create necessary Django Groups (`Admin`, `Developer`, `Viewer`) via Django Admin.
5.  Create a superuser (`python manage.py createsuperuser`) and assign them to the `Admin` group via Django Admin.
6.  Ensure Redis server is running.
7.  Start the Django development server, Celery worker, Celery beat, and the Frontend dev server.

## Design Decisions & Notes

*   **Email Parsing:** Focused on the specified "Bug ID:" format in the subject and "Priority:" keyword in the body. More complex parsing (e.g., HTML emails, extracting assignees) was not implemented. Email processing occurs asynchronously via Celery. Duplicate processing is prevented by checking the email's `Message-ID` against the `ProcessedEmail` model.
*   **Modification Count:** The `modified_count` field on the `Bug` model is *only* incremented when a bug is updated via an incoming **email**, as per requirements. Manual status changes via the API do not currently increment this count but are logged separately in the server logs if needed. Modification events for the chart are sourced *only* from the `BugModificationLog` table, which is populated *only* on email updates.
*   **Authentication/Authorization:** Implemented JWT for API authentication. Basic RBAC using Django Groups controls the status update permission. User creation beyond the initial admin/test users is handled via the self-service Signup page (assigning 'Viewer' role).
*   **UI Theme:** A GitHub-inspired dark theme was implemented using MUI's theming capabilities.
*   **Testing:** Backend tests focus on mocking `imaplib` to verify the core email processing logic (creation, update, priority parsing, duplicate checks, invalid formats) without external dependencies.


