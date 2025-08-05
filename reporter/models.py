from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128))
    email = db.Column(db.String(128), unique=True)
    default_text_model = db.Column(db.String(64))
    default_embedding_model = db.Column(db.String(64))
    default_vision_model = db.Column(db.String(64))

class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'))
    message_text = db.Column(db.Text)
    message_type = db.Column(db.String(32))  # 'user' or 'system'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_request = db.Column(db.Text, nullable=True)

class Template(db.Model):
    __tablename__ = 'templates'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    name = db.Column(db.String(128))
    description = db.Column(db.Text)
    structure = db.Column(db.Text)
    prompt_template = db.Column(db.Text)

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'))
    title = db.Column(db.String(256))
    content_html = db.Column(db.Text)
    version = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    template_id = db.Column(db.Integer, db.ForeignKey('templates.id'), nullable=True)
    versions = db.relationship('ReportVersion', backref='report', lazy=True)

class ReportVersion(db.Model):
    __tablename__ = 'report_versions'
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'))
    content_html = db.Column(db.Text)
    edit_request = db.Column(db.Text)
    version_number = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class File(db.Model):
    __tablename__ = 'files'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'))
    filename = db.Column(db.String(256))
    file_type = db.Column(db.String(64))
    processed_data = db.Column(db.PickleType)
    content_summary = db.Column(db.Text)

class ModelSelection(db.Model):
    __tablename__ = 'model_selections'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'))
    text_model = db.Column(db.String(64))
    embedding_model = db.Column(db.String(64))
    vision_model = db.Column(db.String(64))

class Chart(db.Model):
    __tablename__ = 'charts'
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'))
    chart_html = db.Column(db.Text)
    chart_data = db.Column(db.PickleType)
    auto_generated = db.Column(db.Boolean, default=True)
