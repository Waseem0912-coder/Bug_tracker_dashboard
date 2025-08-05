from models import Template
from ollama_service import generate_text

def get_templates():
    return Template.query.all()

def select_template(template_id):
    return Template.query.get(template_id)

def render_template_report(template, context):
    # Render the prompt with context keys
    prompt = template.prompt_template.format(**context)
    return generate_text(prompt)
