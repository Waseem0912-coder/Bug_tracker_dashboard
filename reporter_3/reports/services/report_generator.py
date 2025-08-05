from chat.services import ollama_service
from templates_manager import template_engine

def generate_report(parsed_instructions: dict, aggregated_content: str, chat_model: str):
    """
    Generates a report by sending a detailed, structured prompt to an LLM.
    This function is a generator, yielding the report content in chunks for streaming.

    Args:
        parsed_instructions (dict): The structured command from chat_handler.
        aggregated_content (str): The combined text from all uploaded files.
        chat_model (str): The Ollama model to use for generation.

    Yields:
        str: Chunks of the generated report.
    """
    
    # --- 1. Construct the Instruction Text ---
    instructions_text = ""
    template_name = parsed_instructions.get("template_name")

    if template_name:
        template = template_engine.load_template_by_name(template_name)
        if template:
            instructions_text = template_engine.format_template_for_prompt(template)
        else:
            # Fallback if the template name from the LLM is invalid
            instructions_text = f"The user requested a template named '{template_name}', but it was not found. " \
                                f"Please proceed by analyzing the user's focus areas instead."
    
    # Add focus areas, whether from a custom request or to supplement a template
    focus_areas = parsed_instructions.get("focus_areas")
    if focus_areas:
        focus_text = ", ".join(focus_areas)
        instructions_text += f"\nPay special attention to the following topics or requests: {focus_text}."

    # --- 2. Build the Final Prompt for the LLM ---
    system_prompt = f"""
You are a world-class professional report writing assistant. Your task is to generate a high-quality, 
well-structured report based on the provided context and specific instructions.

**RULES:**
- Use Markdown for all formatting (e.g., `# Title`, `## Section`, `* bullet point`, `**bold**`).
- The tone should be professional, clear, and objective.
- If the provided context is extensive, begin with a concise "Executive Summary" section.
- Structure the report logically based on the instructions.
- Base your report **exclusively** on the information given in the "CONTEXT" section. Do not invent facts.

---
**CONTEXT:**
The following text has been extracted from user-provided documents.
{aggregated_content}
---
**INSTRUCTIONS:**
Your report must follow these instructions:
{instructions_text}
---

Now, generate the complete report.
"""

    # --- 3. Call the Ollama Service and Stream the Response ---
    try:
        # Use 'yield from' to pass the chunks from the service directly to the caller (the view)
        yield from ollama_service.generate_response(
            model=chat_model,
            prompt=system_prompt,
            stream=True
        )
    except Exception as e:
        print(f"Error during report generation stream: {e}")
        yield f"\n\n--- ERROR: Could not generate the report. {e} ---"