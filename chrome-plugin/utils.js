// insertChatPlugin function
window.insertChatPlugin = () => {
    const recommendationsTab = document.querySelector('#related');

    if (recommendationsTab) {
        // Initialize WebSocket connection to the Flask server
        const socket = initializeSocket();
        socket.on('message_response', (data) => {
            handleSocketResponse(data, conversationArea);
        });

        // Add the chat window container
        const { conversationArea, sendButton, chatInput } = initialiseUI(recommendationsTab);

        // Send a request to the server
        sendButton.addEventListener('click', () => {
            handleUserMessageInput(chatInput, conversationArea, socket);
        });

        // Send a request to the server when pressing Enter
        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default behavior (adding a newline)
                sendButton.click(); // Trigger the submit button
            }
        });
    }
};

initializeSocket = () => {
    const socket = io('http://localhost:9000');

    socket.on('connect', () => {
        console.log('Connected to the Flask-SocketIO server.');
    });

    return socket;
}

sendMessageToServer = (message, url) => {
    socket.emit('send_message', { message, url });
}

showSpinner = (conversationArea) => {
    const spinner = document.createElement('div');
    spinner.className = 'bouncing-loader';
    const dot1 = document.createElement('div');
    spinner.appendChild(dot1)
    const dot2 = document.createElement('div');
    spinner.appendChild(dot2)
    const dot3 = document.createElement('div');
    spinner.appendChild(dot3)
    conversationArea.appendChild(spinner);
}

hideSpinner = (conversationArea) => {
    const spinner = conversationArea.querySelector('.bouncing-loader');
    if (spinner) {
        conversationArea.removeChild(spinner);
    }
}

handleUserMessageInput = (chatInput, conversationArea, socket) => {
    const message = chatInput.value.trim();

    if (message) {
        // Add the user's message to the conversation area
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.innerText = message;
        conversationArea.appendChild(userMessage);

        const url = window.location.href;

        // Show the spinner while waiting for the response
        showSpinner(conversationArea);

        // Send the message to the websocket                
        socket.emit('send_message', { message, url });

        // Clear the input and scroll to the bottom of the conversation area
        chatInput.value = '';
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }
}

let isAppending = false;
let currentReceivedMessage;

handleSocketResponse = (data, conversationArea) => {
    // Process the received response
    const response = data.response;

    if (response.length > 0) {
        hideSpinner(conversationArea);
    }

    // If the response is the "END" event, stop appending words to the current message
    if (response === "END") {
        isAppending = false;
        return;
    }

    // If we're appending words to an existing message, update the existing message
    if (isAppending) {
        currentReceivedMessage.innerText += ' ' + response;
    } else {
        // If we're not appending, create a new message bubble and set isAppending to true
        isAppending = true;
        currentReceivedMessage = document.createElement('div');
        currentReceivedMessage.className = 'message received-message';
        currentReceivedMessage.innerText = response;
        conversationArea.appendChild(currentReceivedMessage);
    }


    // // Hide the spinner when the response is received
    // hideSpinner(conversationArea);

    // // Process the received response
    // const response = data.response;

    // // Add the server's response to the conversation area
    // const receivedMessage = document.createElement('div');
    // receivedMessage.className = 'message received-message';
    // receivedMessage.innerText = response;
    // conversationArea.appendChild(receivedMessage);

    // // Scroll to the bottom of the conversation area
    // conversationArea.scrollTop = conversationArea.scrollHeight;
}

initialiseUI = (recommendationsTab) => {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    recommendationsTab.parentNode.insertBefore(chatWindow, recommendationsTab);

    // Add the conversation area
    const conversationArea = document.createElement('div');
    conversationArea.className = 'conversation-area';
    chatWindow.appendChild(conversationArea);

    // Add the input text and button at the bottom
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
    return { conversationArea, sendButton, chatInput };
}

