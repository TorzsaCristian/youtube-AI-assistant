// Entry point for the chat plugin
window.insertChatPlugin = () => {
    const recommendationsTab = document.querySelector('#related');
    const existingChatPlugin = document.querySelector('#unique-chat-window-id');

    if (recommendationsTab && !existingChatPlugin) {
        const socket = initializeSocket();
        const { chatWindow, conversationArea, sendButton, chatInput } = createChatUI(recommendationsTab,);

        configureSocketMessageHandler(socket, conversationArea);
        configureSendMessageButton(sendButton, chatInput, conversationArea, socket);
        configureEnterKeyForChatInput(chatInput, sendButton);
    }
};

// Returns the recommendations tab DOM element on YouTube
function getRecommendationsTab() {
    return document.querySelector('#related');
}

// Initializes the Socket.IO connection to the Flask server
function initializeSocket() {
    const socket = io('http://localhost:9000');
    socket.on('connect', () => console.log('Connected to the Flask-SocketIO server.'));
    return socket;
}

// Creates the chat UI, including the chat window, conversation area, and input/buttons
function createChatUI(recommendationsTab) {
    const chatWindow = createChatWindow(recommendationsTab);
    const conversationArea = createConversationArea(chatWindow);
    const { sendButton, chatInput } = createChatInputAndButton(chatWindow);
    return { chatWindow, conversationArea, sendButton, chatInput };
}

// Configures the socket message handler to process responses from the server
function configureSocketMessageHandler(socket, conversationArea) {
    socket.on('message_response', (data) => {
        handleSocketResponse(data, conversationArea);
    });
}

// Configures the send button to send user messages to the server when clicked
function configureSendMessageButton(sendButton, chatInput, conversationArea, socket) {
    sendButton.addEventListener('click', () => {
        handleUserMessageInput(chatInput, conversationArea, socket);
    });
}

// Configures the chat input to send user messages to the server when pressing Enter
function configureEnterKeyForChatInput(chatInput, sendButton) {
    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendButton.click();
        }
    });
}

// Creates and inserts the chat window into the DOM
function createChatWindow(recommendationsTab) {
    const chatWindow = document.createElement('div');
    chatWindow.id = 'unique-chat-window-id';
    chatWindow.className = 'chat-window';
    recommendationsTab.parentNode.insertBefore(chatWindow, recommendationsTab);
    return chatWindow;
}

// Creates and inserts the conversation area into the chat window
function createConversationArea(chatWindow) {
    const conversationArea = document.createElement('div');
    conversationArea.className = 'conversation-area';
    chatWindow.appendChild(conversationArea);
    return conversationArea;
}

// Creates and inserts the chat input and send button into the chat window
function createChatInputAndButton(chatWindow) {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';
    chatWindow.appendChild(inputContainer);

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.className = 'chat-input';
    inputContainer.appendChild(chatInput);

    const sendButton = document.createElement('button');
    sendButton.innerText = 'Send';
    sendButton.className = 'chat-button';
    inputContainer.appendChild(sendButton);

    return { sendButton, chatInput };
}

let isAppending = false;
let currentReceivedMessage;

// Handles the response from the server by appending words to the same message bubble
// until the "END" event is received
function handleSocketResponse(data, conversationArea) {
    const response = data.response;

    if (response === "END") {
        isAppending = false;
        return;
    }

    if (isAppending) {
        currentReceivedMessage.innerText += response;
    } else {
        isAppending = true;
        currentReceivedMessage = createReceivedMessageBubble(response, conversationArea);
    }

    scrollToBottom(conversationArea);
}

// Creates a new received message bubble and adds it to the conversation area
function createReceivedMessageBubble(response, conversationArea) {
    const receivedMessage = document.createElement('div');
    receivedMessage.className = 'message received-message';
    receivedMessage.innerText = response;
    conversationArea.appendChild(receivedMessage);
    return receivedMessage;
}

// Scrolls the conversation area to the bottom to show the most recent messages
function scrollToBottom(conversationArea) {
    conversationArea.scrollTop = conversationArea.scrollHeight;
}

// Processes user input, sends the message to the server, and displays the message in the conversation area
function handleUserMessageInput(chatInput, conversationArea, socket) {
    const message = chatInput.value.trim();

    if (message) {
        displayUserMessage(message, conversationArea);
        sendMessageToServer(socket, message, window.location.href);
        clearChatInputAndScrollToBottom(chatInput, conversationArea);
    }
}

// Displays the user message in the conversation area
function displayUserMessage(message, conversationArea) {
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerText = message;
    conversationArea.appendChild(userMessage);
}

// Sends the user message to the server
function sendMessageToServer(socket, message, url) {
    socket.emit('send_message', { message, url });
}

// Clears the chat input and scrolls the conversation area to the bottom
function clearChatInputAndScrollToBottom(chatInput, conversationArea) {
    chatInput.value = '';
    scrollToBottom(conversationArea);
}
