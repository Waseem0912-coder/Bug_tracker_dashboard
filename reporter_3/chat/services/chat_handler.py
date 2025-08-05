import json
from . import ollama_service

def parse_user_request(user_query: str, chat_model: str):
    """
    Uses an LLM to analyze the user's query and transform it into a structured
    JSON command for the application to execute.

    Args:
        user_query (str): The raw text input from the user.
        chat_model (str): The name of the Ollama model to use for parsing.

    Returns:
        dict: A dictionary containing the parsed command, or a default
              dictionary if parsing fails.
    """
    # This is a "meta-prompt" or a "system prompt".
    # We are instructing the LLM on how to behave and what format to use.
    system_prompt = f"""
    You are an expert request-parsing AI. Your job is to analyze the user's query and
    convert it into a structured JSON object.

    The user is interacting with a report generation application.
    Possible user intents are:
    - "generate_report": User wants to create a new report from the provided context.
    - "edit_report": User wants to modify an existing report.
    - "answer_question": User is asking a specific question about the context, not asking for a full report.
    - "clarify": The user's request is ambiguous and you need to ask a clarifying question.
    - "unknown": The user's intent cannot be determined.

    Analyze the following user query and extract the parameters into a JSON object.
    - "intent": One of the intents listed above.
    - "report_title": A concise, descriptive title for the report if the intent is 'generate_report'. Default to "Untitled Report".
    - "focus_areas": A list of key topics, sections, or instructions mentioned by the user.
    - "template_name": The name of a template if the user mentions one (e.g., "weekly summary", "financial analysis").
    - "edit_instructions": Specific instructions if the intent is 'edit_report'.

    USER QUERY: "{user_query}"

    You MUST respond with ONLY the JSON object. Do not include any other text,
    explanations, or markdown formatting like ```json.
    """

    try:
        # We use stream=False because we need the full JSON object at once.
        response_text = ollama_service.generate_response(
            model=chat_model,
            prompt=system_prompt,
            stream=False
        )
        
        # Clean up the response to ensure it's valid JSON
        # Some models might add markdown backticks ` ```json `
        clean_response = response_text.strip().removeprefix("```json").removesuffix("```").strip()

        # Parse the JSON string into a Python dictionary
        parsed_json = json.loads(clean_response)
        return parsed_json

    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from LLM response: {e}")
        print(f"Raw response was: {response_text}")
        # Fallback if the LLM fails to return valid JSON
        return {
            "intent": "answer_question",
            "report_title": "General Inquiry",
            "focus_areas": ["The user's original query."],
            "template_name": None,
            "edit_instructions": None,
            "original_query": user_query # Pass the original query for direct answering
        }
    except Exception as e:
        print(f"An unexpected error occurred in parse_user_request: {e}")
        return {
            "intent": "unknown",
            "original_query": user_query
        }