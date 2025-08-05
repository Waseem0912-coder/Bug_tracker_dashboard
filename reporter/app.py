from flask import Flask, render_template, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from models import db, User, ChatSession, ChatMessage, Template, Report, ReportVersion, ModelSelection
from file_processor import process_files, process_text
from ollama_service import generate_text, generate_edit
from template_engine import get_templates, select_template, render_template_report
from chat_handler import handle_chat
from chart_generator import generate_charts
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reporter.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
# Create database tables on startup
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    templates = get_templates()
    models = {
        'text_models': ['llama3.1', 'qwen2.5', 'mistral'],
        'embed_models': ['nomic-embed-text'],
        'vision_models': ['llava']
    }
    return render_template('index.html', templates=templates, models=models)

@app.route('/chat', methods=['POST'])
def chat():
    # Accept form data and files for chat handling
    data = request.form.to_dict()
    # Extract model selections
    models = {
        'text_model': data.get('text_model'),
        'embedding_model': data.get('embedding_model'),
        'vision_model': data.get('vision_model')
    }
    template_id = data.get('template_id')
    edit_request = data.get('edit_request')
    report_id = data.get('report_id')
    # Get uploaded files
    files = request.files.getlist('files')
    payload = {
        'message': data.get('message'),
        'files': files,
        'models': models,
        'template_id': template_id,
        'edit_request': edit_request,
        'report_id': report_id
    }
    response = handle_chat(payload)
    return jsonify(response)

@app.route('/download/<int:report_id>/<format>')
def download(report_id, format):
    report = Report.query.get_or_404(report_id)
    if format == 'pdf':
        # generate PDF via WeasyPrint
        html_path = f"temp_{report_id}.html"
        with open(html_path, 'w') as f:
            f.write(report.content_html)
        pdf_path = f"report_{report_id}.pdf"
        os.system(f"weasyprint {html_path} {pdf_path}")
        return send_file(pdf_path)
    elif format == 'docx':
        # TODO: implement docx export
        pass
    else:
        return jsonify({'error':'Format not supported'})

if __name__ == '__main__':
    app.run(debug=True)
