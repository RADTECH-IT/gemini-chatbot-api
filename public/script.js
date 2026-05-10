const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// This array stores the conversation history to send to the backend
let conversation = [];

// --- Dark Mode Logic ---
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// --- Double Enter to Send & Auto-resize Logic ---
let lastEnterTime = 0;

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        const now = Date.now();
        // If pressed twice within 500ms
        if (now - lastEnterTime < 500) {
            e.preventDefault();
            // Trigger form submission
            chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            lastEnterTime = 0;
        } else {
            lastEnterTime = now;
            // Allow default (newline)
        }
    }
});

userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight) + 'px';
});

// --- Chat Logic ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageText = userInput.value.trim();
    if (!messageText) return;

    // 1. Add the user's message to the chat box UI
    appendMessage('user', messageText);
    
    // Clear input and disable UI while waiting for the AI
    userInput.value = '';
    userInput.style.height = 'auto'; // Reset textarea height
    userInput.disabled = true;
    const submitBtn = chatForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    // 2. Add the user's message to the conversation history array
    conversation.push({ role: 'user', text: messageText });

    // 3. Show a temporary "Thinking..." bot message
    const botMessageElement = appendMessage('model', 'Thinking...');

    try {
        // 4. Send the conversation history as a POST request to /api/chat
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conversation }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // 5. When the response arrives, replace "Thinking..." with the AI's reply
        if (data && data.result) {
            // Update the message element with formatted markdown
            updateBotMessage(botMessageElement, data.result);
            // Add the AI's response to the history for future context
            conversation.push({ role: 'model', text: data.result });
        } else {
            botMessageElement.textContent = 'Sorry, no response received.';
        }
    } catch (error) {
        // 6. Handle errors or connection issues
        console.error('Chat Error:', error);
        botMessageElement.textContent = 'Failed to get response from server.';
    } finally {
        // Re-enable input and button
        userInput.disabled = false;
        submitBtn.disabled = false;
        userInput.focus();
        // Ensure the chat box is scrolled to the bottom
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

/**
 * Helper function to update a bot message element with markdown parsing
 * @param {HTMLElement} element - The message div to update
 * @param {string} text - The raw markdown text
 */
function updateBotMessage(element, text) {
    if (typeof marked !== 'undefined') {
        // Use marked.parse for markdown rendering
        element.innerHTML = marked.parse(text);
    } else {
        element.textContent = text;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Helper function to create and append message elements
 * @param {string} role - 'user' or 'model'
 * @param {string} text - The message content
 * @returns {HTMLElement} - The message text element
 */
function appendMessage(role, text) {
    const wrapper = document.createElement('div');
    const typeClass = role === 'user' ? 'user' : 'bot';
    wrapper.classList.add('message-wrapper', typeClass);

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', typeClass);
    
    if (role === 'model' && text !== 'Thinking...') {
        updateBotMessage(messageDiv, text);
    } else {
        messageDiv.textContent = text;
    }

    wrapper.appendChild(messageDiv);
    chatBox.appendChild(wrapper);

    // Auto-scroll to the latest message
    chatBox.scrollTop = chatBox.scrollHeight;

    return messageDiv;
}
