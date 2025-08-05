// static/js/chat.js
document.addEventListener('DOMContentLoaded', function() {
    // --- Element References ---
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatHistory = document.getElementById('chat-history');
    const reportPreview = document.getElementById('report-preview');
    const sendButton = document.getElementById('send-button');
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileListDiv = document.getElementById('file-list');
    const modelSelect = document.getElementById('model-select');
    const templateSelect = document.getElementById('template-select');
    
    // --- State Management ---
    let currentSessionId = null;
    let uploadedFiles = []; // This will just be for display

    // --- Utility Functions ---
    function getCsrfToken() {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    }

    async function readStream(reader, elementToUpdate) {
        let { done, value } = await reader.read();
        const decoder = new TextDecoder();
        while (!done) {
            elementToUpdate.innerHTML += decoder.decode(value, { stream: true });
            ({ done, value } = await reader.read());
        }
    }

    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
        messageDiv.textContent = text;
        chatHistory.appendChild(messageDiv);
        chatHistory.parentElement.scrollTop = chatHistory.parentElement.scrollHeight;
    }

    // --- API Calls ---
    async function loadInitialData() {
        // Fetch and populate models
        try {
            const response = await fetch('/api/chat/models/');
            const data = await response.json();
            modelSelect.innerHTML = '';
            data.models.forEach(model => {
                const option = new Option(model, model);
                modelSelect.add(option);
            });
        } catch (error) {
            console.error('Failed to load models:', error);
            modelSelect.innerHTML = '<option>Error loading models</option>';
        }

        // Fetch and populate templates
        try {
            const response = await fetch('/api/templates/');
            const data = await response.json();
            data.forEach(template => {
                const option = new Option(template.name, template.name);
                templateSelect.add(option);
            });
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        messageInput.value = '';
        sendButton.disabled = true;

        reportPreview.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

        try {
            const response = await fetch('/api/chat/message/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({
                    message: message,
                    session_id: currentSessionId,
                    model: modelSelect.value,
                    template: templateSelect.value,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'An unknown error occurred.');
            }
            
            reportPreview.innerHTML = ''; // Clear spinner
            const reader = response.body.getReader();
            await readStream(reader, reportPreview);

        } catch (error) {
            reportPreview.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        } finally {
            sendButton.disabled = false;
        }
    });

    // --- File Handling ---
    fileDropZone.addEventListener('click', () => fileInput.click());
    ['dragover', 'dragenter'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, e => {
            e.preventDefault();
            fileDropZone.classList.add('dragover');
        });
    });
    fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('dragover'));
    fileDropZone.addEventListener('drop', e => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');
        handleFileUpload(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => handleFileUpload(fileInput.files));

    async function handleFileUpload(files) {
        const formData = new FormData();
        if (currentSessionId) {
            formData.append('session_id', currentSessionId);
        }
        
        // We handle one file at a time for simplicity, but could extend to multiple
        if (files.length > 0) {
            formData.append('file', files[0]);
        }

        try {
            const response = await fetch('/api/chat/upload/', {
                method: 'POST',
                headers: { 'X-CSRFToken': getCsrfToken() },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            currentSessionId = data.session_id; // IMPORTANT: Update session ID
            addFileToList(data.filename);

        } catch (error) {
            console.error('File upload error:', error);
            alert(`Upload failed: ${error.message}`);
        }
    }

    function addFileToList(filename) {
        const fileEntry = document.createElement('div');
        fileEntry.className = 'd-flex justify-content-between align-items-center bg-light p-1 rounded mb-1';
        fileEntry.innerHTML = `<small>${filename}</small><button type="button" class="btn-close btn-sm" data-filename="${filename}"></button>`;
        fileListDiv.appendChild(fileEntry);
    }
    
    // --- Initialization ---
    loadInitialData();
});