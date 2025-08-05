import requests

def generate_text(prompt, model='llama3.1'):
    """
    Call Ollama REST API v1 chat/completions for text generation.
    """
    url = "http://localhost:11434/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 512
    }
    response = requests.post(url, json=payload)
    data = response.json()
    # Extract the generated content
    try:
        return data['choices'][0]['message']['content']
    except (KeyError, IndexError):
        return data.get('error', str(data))

def generate_embedding(text, model='nomic-embed-text'):
    url = f"http://localhost:11434/embed/{model}"
    payload = {"text": text}
    response = requests.post(url, json=payload)
    return response.json().get('embedding', [])

def generate_edit(original, instruction, model='llama3.1'):
    """
    Perform iterative edit by prompting the model to apply an instruction.
    """
    prompt = (
        f"Here is the current report content:\n{original}\n\n"
        f"Please apply the following edit instruction:\n{instruction}\n"
        "Return the updated content."
    )
    return generate_text(prompt, model=model)
