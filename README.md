# Bug Tracker from Email

This project is a web application designed to receive bug reports via email, parse them, store them in a database, and provide a web interface (built with React) for viewing bug details and visualizing modification trends. It includes features like user authentication, asynchronous email processing, and a modern UI.

## Goal

To build a functional bug tracking system where new bugs can be created and existing bugs can be updated simply by sending formatted emails to a designated inbox. The system provides a web UI for authenticated users to browse bugs and view analytics.

## Features

*   **Email Integration:** Connects to an IMAP mailbox to fetch unread emails.
*   **Email Parsing:** Extracts bug ID, subject, and description from emails based on a defined format.
*   **Bug Management:** Creates new bug records or updates existing ones based on the parsed email content.
*   **Modification Tracking:** Logs each modification event triggered by an email update and increments a counter on the bug record.
*   **Database Storage:** Uses PostgreSQL (or SQLite for development) to persist bug data, modification logs, and processed email IDs.
*   **Asynchronous Processing:** Uses Celery and Redis for background email fetching and processing, preventing blocking of web requests.
*   **REST API:** Provides secure API endpoints (using Django REST Framework and JWT) for frontend communication. Includes endpoints for listing bugs, viewing bug details, and fetching modification statistics.
*   **Authentication:** Secure user login using JSON Web Tokens (JWT). API endpoints are protected.
*   **React Frontend:** A modern, responsive user interface built with React (using Vite) and Material UI (MUI).
*   **Data Visualization:** Displays a chart (using Recharts) showing the number of bug modification events over time.
*   **Pagination:** Bug list API endpoint supports pagination.
*   **Admin Interface:** Leverages Django Admin for easy data inspection and user management.

## Tech Stack

**Backend:**
*   Python 3.x
*   Django 4.x
*   Django REST Framework
*   Celery
*   Redis (as Celery broker and result backend)
*   PostgreSQL (Recommended) / SQLite3
*   `python-dotenv` (for environment variables)
*   `psycopg2-binary` (if using PostgreSQL)
*   `djangorestframework-simplejwt` (for JWT authentication)
*   `django-cors-headers` (for handling Cross-Origin Resource Sharing)
*   `django-celery-beat` (for scheduling periodic tasks)
*   `django-celery-results` (for storing task results/blacklisting)
*   Standard Python libs: `imaplib`, `email`

**Frontend:**
*   Node.js / npm or yarn
*   React 18.x
*   Vite (Build Tool)
*   Material UI (MUI) (Component Library)
*   Recharts (Charting Library)
*   Axios (HTTP Client)
*   React Router DOM (Routing)

**Development:**
*   Git
*   Virtualenv (`venv`)

## Setup & Installation

### Prerequisites

*   Python 3.8+ and Pip
*   Git
*   Node.js and npm (or yarn)
*   Redis server running (for Celery)
*   PostgreSQL server running (Recommended) OR ensure SQLite3 development libraries are installed.

### Backend Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd bugtracker-project
    ```

2.  **Create & Activate Virtual Environment:**
    ```bash
    python -m venv venv
    # Windows
    # .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Dependencies:**
    *(Create a `requirements.txt` file first if one doesn't exist)*
    ```bash
    pip freeze > requirements.txt # Run this after installing initial deps
    # Then, in the future, others can run:
    pip install -r requirements.txt
    ```
    *(Ensure `Django`, `djangorestframework`, `psycopg2-binary`, `python-dotenv`, `django-cors-headers`, `djangorestframework-simplejwt`, `celery`, `redis`, `django-celery-beat`, `django-celery-results` are installed)*

4.  **Configure Environment Variables:**
    *   Copy the example environment file: `cp .env.example .env` (You should create `.env.example` first).
    *   Edit the `.env` file in the project root and provide your actual secrets and settings (Database credentials, Django Secret Key, IMAP details, Redis URL, Allowed Hosts, CORS Origins). **Do not commit `.env` to Git!** See the `Environment Variables` section below.

5.  **Database Setup:**
    *   **PostgreSQL (Recommended):** Ensure your PostgreSQL server is running. Create the database and user specified in your `.env` file.
        ```sql
        -- Example PSQL commands
        CREATE DATABASE bugtracker_db;
        CREATE USER bugtracker_user WITH PASSWORD 'your_db_password';
        GRANT ALL PRIVILEGES ON DATABASE bugtracker_db TO bugtracker_user;
        ```
    *   **SQLite:** If using SQLite (as configured in `settings.py`), this step is not required as the file will be created automatically.

6.  **Run Database Migrations:**
    ```bash
    python manage.py makemigrations bugs
    python manage.py migrate
    ```

7.  **Create Superuser (for Admin access):**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts.

8.  **Run Backend Development Server:**
    ```bash
    python manage.py runserver
    ```
    The backend API will be available at `http://localhost:8000`. Access the admin panel at `http://localhost:8000/admin/`.

9.  **Run Celery Worker (in a separate terminal):**
    *Ensure Redis is running first!*
    ```bash
    # Activate virtual environment if needed: source venv/bin/activate
    celery -A bugtracker worker -l info
    ```

10. **Run Celery Beat Scheduler (in another separate terminal):**
    *This schedules the periodic email check.*
    ```bash
    # Activate virtual environment if needed: source venv/bin/activate
    celery -A bugtracker beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    ```
    *(Note: The first time Beat runs, it loads the schedule defined in `settings.py` if any, or you might need to configure the schedule via Django Admin -> Periodic Tasks)*

### Frontend Setup

*(Assuming the React code resides in a `frontend` subdirectory)*

1.  **Navigate to Frontend Directory:**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables (Frontend):**
    *   The frontend might need to know the base URL of the backend API. Create a `.env` file in the `frontend` directory:
        ```dotenv
        # frontend/.env
        VITE_API_BASE_URL=http://localhost:8000/api
        ```
    *   Update the `axios` configuration in the frontend code (`src/services/api.js` or similar) to use `import.meta.env.VITE_API_BASE_URL`.

4.  **Run Frontend Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The React application will typically be available at `http://localhost:5173` (check the terminal output).

## Environment Variables (`.env` file)

Create a `.env` file in the project root directory (`bugtracker-project/`) based on `.env.example`.

**Required Backend Variables:**

*   `DJANGO_SECRET_KEY`: A strong unique secret key for Django.
*   `DJANGO_DEBUG`: Set to `True` for development, `False` for production.
*   `DJANGO_ALLOWED_HOSTS`: Comma-separated list of hosts (e.g., `localhost,127.0.0.1`).
*   `DB_ENGINE`: (Optional, defaults to postgresql) `django.db.backends.postgresql` or `django.db.backends.sqlite3`.
*   `DB_NAME`: Database name (e.g., `bugtracker_db`).
*   `DB_USER`: Database user.
*   `DB_PASSWORD`: Database password.
*   `DB_HOST`: Database host (e.g., `localhost`).
*   `DB_PORT`: Database port (e.g., `5432`).
*   `CORS_ALLOWED_ORIGINS`: Comma-separated list of frontend origins (e.g., `http://localhost:5173`).
*   `IMAP_SERVER`: Hostname of your IMAP server (e.g., `imap.gmail.com`).
*   `IMAP_PORT`: Port for IMAP (usually `993` for SSL).
*   `IMAP_USER`: Your email address for fetching bugs.
*   `IMAP_PASSWORD`: Your email password **(Use an App Password for services like Gmail/Outlook)**.
*   `CELERY_BROKER_URL`: Connection URL for Redis (e.g., `redis://localhost:6379/0`).
*   `CELERY_RESULT_BACKEND`: Connection URL for Redis (can be the same as broker).

**Required Frontend Variables (`frontend/.env`):**

*   `VITE_API_BASE_URL`: The base URL for the backend API (e.g., `http://localhost:8000/api`).

## Email Setup

*   The application connects to the IMAP server configured in the `.env` file.
*   It processes emails matching the format: **Subject:** `Bug ID: [bug_id] - Subject Text`
*   **IMPORTANT:** For security, especially with services like Gmail, you **must** generate an "App Password" in your email account settings and use that app password in the `IMAP_PASSWORD` variable, not your regular account password.
*   Ensure the IMAP access is enabled in your email account settings.

## Running the Full Application Locally

To run the complete application, you need to have **4** terminals open concurrently:

1.  **Backend API Server:**
    ```bash
    # In bugtracker-project/
    source venv/bin/activate
    python manage.py runserver
    ```
2.  **Celery Worker:**
    ```bash
    # In bugtracker-project/
    source venv/bin/activate
    celery -A bugtracker worker -l info
    ```
3.  **Celery Beat Scheduler:**
    ```bash
    # In bugtracker-project/
    source venv/bin/activate
    celery -A bugtracker beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    ```
4.  **Frontend Development Server:**
    ```bash
    # In bugtracker-project/frontend/
    npm run dev
    # or
    yarn dev
    ```

## API Endpoints (Brief)

*   `POST /api/token/`: Obtain JWT access and refresh tokens (Login). Requires `username`, `password`.
*   `POST /api/token/refresh/`: Refresh JWT access token. Requires `refresh` token.
*   `GET /api/bugs/`: List all bugs (Paginated). Requires authentication.
*   `GET /api/bugs/{bug_id}/`: Retrieve details of a specific bug. Requires authentication.
*   `GET /api/bug_modifications/`: Get data for the modification chart (count of modification events per date). Requires authentication.

## Testing

To run the backend tests:

```bash
# In bugtracker-project/
source venv/bin/activate
python manage.py test bugs # Or run tests for a specific app/module
content_copy
download
Use code with caution.
Markdown
Future Enhancements
Implement Role-Based Access Control (RBAC) using Django Groups and Permissions.
User self-registration feature.
Frontend UI adjustments based on user roles.
More sophisticated error handling and notification system.
Deployment configuration (Docker, Cloud Platform).
License
(Specify your license here, e.g., MIT License, or leave blank)

**Next Steps:**

1.  Create a file named `.env.example` in the project root and copy the structure of the `.env` file into it, but with placeholder values (e.g., `DB_PASSWORD=your_password_here`). Add this `.env.example` to Git.
2.  Ensure your `.gitignore` file includes `.env`, `venv/`, `__pycache__/`, `db.sqlite3` (if using), `*.pyc`, etc.
3.  Run `pip freeze > requirements.txt` in your activated virtual environment to capture the dependencies. Add `requirements.txt` to Git.

This README provides a solid foundation for understanding and running the project. We can update it as development progresses. Ready to move back to coding the serializers and views?
content_copy
download
Use code with caution.
