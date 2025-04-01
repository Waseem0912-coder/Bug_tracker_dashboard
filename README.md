
## Setup and Installation

**Prerequisites:**

*   Python 3.8+
*   Node.js 14+ and npm (or yarn)
*   Git
*   An IMAP-enabled email account to monitor. 

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Backend Setup (Django):**
    ```bash
    cd backend

    # Create and activate a virtual environment (recommended)
    python -m venv venv
    # On Linux/macOS:
    source venv/bin/activate
    # On Windows:
    # venv\Scripts\activate

    # Install Python dependencies
    pip install -r requirements.txt

    # Create the .env file for configuration
    cp .env.example .env # If you have an example file, otherwise create manually

    # Edit the .env file with your email credentials and settings:
    # Example .env content:
    # EMAIL_HOST=imap.example.com
    # EMAIL_PORT=993
    # EMAIL_USER=your_monitored_email@example.com
    # EMAIL_PASSWORD=your_email_app_password_here
    # SUBJECT_ID_REGEX="\[([A-Z0-9-]+)\]" # Example: Matches [BUG-123]

    # Apply database migrations
    python manage.py makemigrations api
    python manage.py migrate

    # (Optional) Create a superuser for Django Admin access
    # python manage.py createsuperuser
    ```
    *Note:* Make sure the `.env` file is in the `backend/` directory and **add `.env` to your `.gitignore` file** to prevent committing secrets.

3.  **Frontend Setup (React):**
    ```bash
    cd ../frontend

    # Install Node.js dependencies
    npm install
    # or if using yarn:
    # yarn install
    ```

## Running the Application

You'll need three terminals/processes running concurrently:

1.  **Run the Backend (Django API Server):**
    ```bash
    cd backend
    source venv/bin/activate # If not already active
    python manage.py runserver
    ```
    *   The API will typically be available at `http://127.0.0.1:8000/`.

2.  **Run the Frontend (React Development Server):**
    ```bash
    cd frontend
    npm start
    # or
    # yarn start
    ```
    *   This will usually open the application automatically in your browser at `http://localhost:3000`.

3.  **Run the Email Checker:**
    *   **Manually (for testing):** Open a *third* terminal.
        ```bash
        cd backend
        source venv/bin/activate
        python manage.py check_emails
        ```
        *   This command will run once, check for emails, process them, and then exit. You can re-run it whenever you want to check manually.
    *   **Automatically (Recommended):** Schedule the `check_emails` command to run periodically using your operating system's task scheduler.
        *   **Cron (Linux/macOS):** Edit your crontab (`crontab -e`) and add a line similar to this (adjust paths and frequency):
            ```cron
            # Run every 5 minutes
            */5 * * * * /path/to/your/project/backend/venv/bin/python /path/to/your/project/backend/manage.py check_emails >> /path/to/your/logfile.log 2>&1
            ```
        *   **Task Scheduler (Windows):** Create a scheduled task to execute the `python manage.py check_emails` command within the correct directory and activated virtual environment.

## Usage

1.  **Send Emails:** Send emails to the monitored address (`EMAIL_USER` in `.env`).
    *   **Subject:** Must contain the unique ID matching the `SUBJECT_ID_REGEX` (e.g., `[BUG-101] Login button issue`).
    *   **Body:** Can contain lines like:
        ```
        Priority: High
        Status: Open
        Assigned To: developer@example.com
        Description:
        The login button on the main page doesn't work after submitting credentials.
        Steps to reproduce: ...
        ```
        *   If the `Description:` keyword is omitted, the script will attempt to capture all non-keyword lines as the description.
        *   Subsequent emails with the same unique ID in the subject will update the bug record and be added to its history.

2.  **Access the Dashboard:** Open `http://localhost:3000` (or the address provided by `npm start`) in your browser.

3.  **View Bugs:** The dashboard displays bug cards, showing the latest information for each unique ID. Cards are styled based on priority and status.

4.  **Filter/Search:** Use the filter controls at the top to narrow down the list by status, priority, assignee, or text search (ID/subject).

5.  **View Email History:** Click the "Show Email History (X)" button on a bug card to expand a section showing details parsed from each individual email received for that bug, ordered newest first.

6.  **Update Status:** Use the "Resolve", "Close", or "Re-Open" buttons on a bug card to update its status directly via the API.

7.  **Manual Refresh:** Click the "Check for New Emails" button in the dashboard header to trigger the backend `check_emails` script immediately. The list should refresh shortly after to show any newly processed bugs/updates.

## Key Concepts & Design Decisions

*   **`Bug` vs. `EmailLog` Models:** The `Bug` model stores the *current, aggregated state* of an issue, identified by its `unique_id`. The `EmailLog` model stores the details parsed from *each specific email*, providing a historical record and allowing multiple emails per `unique_id`.
*   **Email Parsing:** Relies on keyword identification (e.g., `Priority:`) and a fallback mechanism for the description. This is simple but sensitive to changes in email format.
*   **Asynchronous Trigger:** The "Check for New Emails" button uses an API endpoint that runs the email check in a background thread on the server for better UI responsiveness. The frontend uses a simple delay before refreshing the list (a more robust solution like WebSockets or polling could be implemented).
*   **API Interaction:** React components fetch data (`GET`) and send updates (`PATCH`) via centralized functions in `bugService.js` interacting with the DRF API.
*   **Client-Side Filtering:** Filtering logic is currently implemented in the React frontend for simplicity and immediate feedback.

## Future Improvements & Limitations

*   **Security:** The API endpoints (`AllowAny`) and the email trigger endpoint need proper authentication and permissions in a production environment.
*   **Error Handling:** More robust error handling and user feedback (e.g., toast notifications) can be added in both the backend (email parsing, API) and frontend (API calls, rendering).
*   **Email Parsing Robustness:** The current parsing is basic. Consider using more advanced regex, stricter email templates, or even NLP libraries for more complex/variable email formats.
*   **Testing:** Add unit and integration tests for both the Django backend (especially email parsing and API logic) and React components.
*   **Refresh Mechanism:** Implement WebSockets or API polling for a more reliable way to update the UI after the background email check completes.
*   **Deployment:** Add instructions and configurations for deploying the Django and React applications to a production server (e.g., using Gunicorn/Nginx for Django, serving static React files).
*   **Configuration:** Make parsing keywords and other settings more configurable (e.g., via `settings.py` or a database model) instead of hardcoding them.
*   **UI Enhancements:** Add features like sorting, pagination (for large numbers of bugs), inline editing of more fields (if desired), user assignments via UI, etc.

## License

[MIT](LICENSE)