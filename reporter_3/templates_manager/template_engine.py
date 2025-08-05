from .models import ReportTemplate

def get_available_templates():
    """
    Fetches a list of all globally available report template names.
    """
    return list(ReportTemplate.objects.filter(is_global=True).values_list('name', flat=True))

def load_template_by_name(template_name: str):
    """
    Loads a ReportTemplate object from the database by its name.
    Returns the object or None if not found.
    """
    try:
        return ReportTemplate.objects.get(name__iexact=template_name, is_global=True)
    except ReportTemplate.DoesNotExist:
        return None

def format_template_for_prompt(template: ReportTemplate):
    """
    Converts the template's JSON structure into a markdown string
    that can be easily understood by the LLM.
    """
    if not isinstance(template.content_structure, dict):
        return "Invalid template structure."

    markdown_structure = f"Please generate the report using the '{template.name}' template.\n"
    markdown_structure += "The required sections are:\n"
    for section, description in template.content_structure.items():
        # The description helps the LLM know what to put in each section
        placeholder = description or f"Content for the {section} section."
        markdown_structure += f"- **{section}:** ({placeholder})\n"
    
    return markdown_structure