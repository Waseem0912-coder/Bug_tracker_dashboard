import requests
import json
import base64

# This should be configurable in a real app, e.g., using settings.py
OLLAMA_BASE_URL = "http://localhost:11434"

def list_available_models():
    """
    Fetches the list of all locally available models from the Ollama API.
    Returns a list of model names.
    """
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        response.raise_for_status()
        models_data = response.json()
        return [model['name'] for model in models_data.get('models', [])]
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Ollama: {e}")
        return []

# chat/services/ollama_service.py
# (keep all other functions like list_available_models, create_embeddings, etc.)

def generate_response(model, prompt, stream=False, images_base64=None):
    """
    Sends a request to a specific model to generate a response.
    Can handle both standard and vision models (with images).
    Can stream the response for real-time updates or return it at once.
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
    }
    if images_base64:
        payload["images"] = images_base64

    try:
        response = requests.post(url, json=payload, stream=stream)
        response.raise_for_status()

        # This helper function is the actual generator for streaming
        def stream_generator():
            full_response = ""
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        content_part = chunk.get('response', '')
                        full_response += content_part
                        yield content_part
                        if chunk.get('done'):
                            break
                    except json.JSONDecodeError:
                        print(f"Warning: Could not decode JSON line: {line}")
                        continue
        
        if stream:
            # If streaming is requested, return the generator object
            return stream_generator()
        else:
            # If a single response is requested, consume the generator and return the string
            full_response = "".join(list(stream_generator()))
            return full_response

    except requests.exceptions.RequestException as e:
        error_message = f"Error communicating with Ollama: {e}"
        print(error_message)
        # Handle the error for both streaming and non-streaming cases
        if stream:
            def error_generator():
                yield error_message
            return error_generator()
        else:
            return error_message
        
def create_embeddings(text, model="nomic-embed-text"):
    """
    Creates embeddings for a given text using the specified embedding model.
    """
    url = f"{OLLAMA_BASE_URL}/api/embeddings"
    payload = {
        "model": model,
        "prompt": text,
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json().get('embedding')
    except requests.exceptions.RequestException as e:
        print(f"Error creating embeddings with Ollama: {e}")
        return None

def encode_image_to_base64(image_path):
    """
    Helper function to read an image file and encode it to base64.
    We will use this in the file processor later.
    """
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except IOError as e:
        print(f"Error reading image file {image_path}: {e}")
        return None