# chat/views.py
import json
from django.shortcuts import render
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from .models import ChatSession, UploadedFile, User # Assuming user model is here
from .services import ollama_service, file_processor, chat_handler
from reports.services import report_generator, version_control
from reports.models import Report
from .models import ModelSelection # Add this import


def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create a default ModelSelection for the new user
            ModelSelection.objects.create(user=user)
            login(request, user)
            return redirect('chat:chat_page')
    else:
        form = CustomUserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

# --- Update API and Page Views to be Login-Required ---

@login_required # Protect the main page
def chat_page(request):
    # ... same as before
    return render(request, 'chat/chat_page.html')

@login_required # Protect this API endpoint
@require_GET
def get_models_api(request):
    # ... same as before
    models = ollama_service.list_available_models()
    return JsonResponse({'models': models})

@csrf_exempt
@login_required # Protect this API endpoint
@require_POST
def upload_file_api(request):
    # ... same logic as before, but now we get the user from the request
    session_id = request.POST.get('session_id')
    user = request.user # THIS IS THE KEY CHANGE

    if not session_id:
        session = ChatSession.objects.create(user=user, title=f"Session for {user.username}")
    # ... rest of the function is the same ...
    else:
        try:
            session = ChatSession.objects.get(id=int(session_id), user=user) # Also check user
        except (ChatSession.DoesNotExist, ValueError):
            return JsonResponse({'error': 'Invalid session ID or permission denied'}, status=403)
            
    if not request.FILES.get('file'):
        return JsonResponse({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    uploaded_file = UploadedFile.objects.create(
        session=session, file=file, filename=file.name
    )
    return JsonResponse({
        'message': 'File uploaded successfully', 'filename': uploaded_file.filename,
        'file_id': uploaded_file.id, 'session_id': session.id
    })


@csrf_exempt
@login_required # Protect this API endpoint
@require_POST
def chat_message_api(request):
    # ... same logic as before, but we get the user from the request
    data = json.loads(request.body)
    user_message = data.get('message', '')
    session_id = data.get('session_id')
    model = data.get('model', 'llama3.1')
    template_name = data.get('template')

    user = request.user # THIS IS THE KEY CHANGE

    try:
        session = ChatSession.objects.get(id=session_id, user=user) # Also check user
    except (ChatSession.DoesNotExist, ValueError, TypeError):
        return JsonResponse({'error': 'A valid session is required or permission denied.'}, status=403)
    

# This view was created in Step 10
def chat_page(request):
    return render(request, 'chat/chat_page.html')

# --- API VIEWS ---

@require_GET
def get_models_api(request):
    """
    API endpoint to list locally available Ollama models.
    """
    models = ollama_service.list_available_models()
    return JsonResponse({'models': models})

@csrf_exempt # Use this for simplicity in development. In production, use proper CSRF handling.
@require_POST
def upload_file_api(request):
    """
    API endpoint to handle file uploads.
    """
    session_id = request.POST.get('session_id')
    
    # Simple session/user handling for now. In a real app, this would be robust.
    # In Step 13 (Authentication), we will replace this with request.user.
    user = User.objects.first() # Placeholder: get the first user
    if not user: # Create a default user if none exist
        user = User.objects.create_user(username='defaultuser', password='password')

    if not session_id:
        session = ChatSession.objects.create(user=user, title="New Chat Session")
    else:
        try:
            session = ChatSession.objects.get(id=int(session_id))
        except (ChatSession.DoesNotExist, ValueError):
            return JsonResponse({'error': 'Invalid session ID'}, status=400)
            
    if not request.FILES.get('file'):
        return JsonResponse({'error': 'No file provided'}, status=400)

    file = request.FILES['file']
    uploaded_file = UploadedFile.objects.create(
        session=session,
        file=file,
        filename=file.name
    )

    return JsonResponse({
        'message': 'File uploaded successfully',
        'filename': uploaded_file.filename,
        'file_id': uploaded_file.id,
        'session_id': session.id
    })


@csrf_exempt
@require_POST
def chat_message_api(request):
    """
    The main API endpoint that processes user messages and generates reports.
    This view will handle streaming responses.
    """
    data = json.loads(request.body)
    user_message = data.get('message', '')
    session_id = data.get('session_id')
    model = data.get('model', 'llama3.1') # Fallback model
    template_name = data.get('template')

    user = User.objects.first() # Placeholder, replace with request.user later

    try:
        session = ChatSession.objects.get(id=session_id)
    except (ChatSession.DoesNotExist, ValueError, TypeError):
        return JsonResponse({'error': 'A valid session is required. Please upload a file or start a new chat.'}, status=400)

    # 1. Aggregate content from files and pasted text
    files = session.files.all()
    file_contents = [file_processor.process_uploaded_file(f) for f in files]
    pasted_text = file_processor.process_pasted_text(user_message)
    
    # We combine pasted text only if it seems substantial, not just a command
    context_to_send = file_contents
    if len(pasted_text.split()) > 15: # Heuristic for "pasted content" vs. "instruction"
        context_to_send.append(f"--- Pasted Content ---\n{pasted_text}")
    
    aggregated_content = file_processor.aggregate_content(context_to_send)

    # 2. Parse the user's intent from their instruction part of the message
    parsed_instructions = chat_handler.parse_user_request(user_message, model)
    if template_name: # Override with user's dropdown selection if present
        parsed_instructions['template_name'] = template_name

    # 3. Decide what to do based on intent
    intent = parsed_instructions.get('intent')

    if intent == 'generate_report':
        # This is a generator function
        def stream_response():
            full_report_content = ""
            # Stream the report content to the user
            for chunk in report_generator.generate_report(parsed_instructions, aggregated_content, model):
                full_report_content += chunk
                yield chunk
            
            # After streaming is complete, save the final report and version
            report_title = parsed_instructions.get('report_title', 'Untitled Report')
            report, created = Report.objects.get_or_create(
                user=user, title=report_title,
                defaults={'content': full_report_content}
            )
            if not created: # If report exists, we're updating it
                report.content = full_report_content
            report.save()

            version_control.create_new_version(
                report=report,
                new_content=full_report_content,
                edit_reason="Initial generation"
            )

        return StreamingHttpResponse(stream_response(), content_type='text/plain')
    
    else: # Default to "answer_question" or other intents
        def stream_response():
            prompt = f"Based on the context, answer the following question: {user_message}\n\nContext:\n{aggregated_content}"
            yield from ollama_service.generate_response(model, prompt, stream=True)

        return StreamingHttpResponse(stream_response(), content_type='text/plain')