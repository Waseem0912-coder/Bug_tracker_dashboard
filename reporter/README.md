# Flask Report Maker

AI-powered report generation web app using Flask and Ollama.

## Environment Setup (UV)

```bash
# Initialize UV environment
uv init flask-report-maker

# Add project dependencies
uv add flask sqlalchemy flask_sqlalchemy pandas plotly PyPDF2 python-pptx pillow openpyxl python-docx requests beautifulsoup4 weasyprint ollama pytesseract

# Activate the environment (if needed)
uv activate
```

## Running the App

```bash
# Set Flask app environment variable
export FLASK_APP=app.py
export FLASK_ENV=development

# Run the Flask development server
flask run
```

Access the app at http://localhost:5000

## Project Structure

- `app.py`: Main Flask application with routes for chat and downloads.
- `models.py`: SQLAlchemy models for users, sessions, messages, templates, reports, versions, files, and model selections.
- `file_processor.py`: Handles uploaded files (Excel, PPT, PDF, images) and extracts content.
- `ollama_service.py`: Integrates with local Ollama API for text generation and edits.
- `template_engine.py`: Manages report templates from the database.
- `chat_handler.py`: Core chat workflow: processing messages, files, generating reports, edits, version control.
- `chart_generator.py`: Auto-generates Plotly charts from Excel data.
- `templates/index.html`: Frontend chat interface with model/template dropdowns and live report preview.

## Features

- **Chat Interface**: Paste text, upload files, select models/templates, and send natural language report requests.
- **Multi-Model Selection**: Choose text, embedding, and vision models powered by Ollama.
- **Iterative Editing**: Edit existing reports with version history.
- **Template Support**: Use predefined templates or create custom reports.
- **File Processing**: Extract text from PDFs, images, PPT slides, and Excel.
- **Auto Charts**: Generate interactive Plotly charts from numeric Excel data.
- **Download**: Export final reports as PDF (via WeasyPrint).

## Extending the App

- Implement DOCX export in `download` route.
- Add more file type processors in `file_processor.py`.
- Expand template management UI and CRUD operations.
- Integrate embedding/vision tasks for advanced use cases.
