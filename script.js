// Get references to the form, the text input, and the response area on the page.
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const responseContainer = document.getElementById('response');

// This array stores the full conversation so each new request can include earlier messages.
const conversationHistory = [];

// This array stores the messages shown on the page so the full conversation stays visible.
const conversationDisplay = [];

// This system message gives the model its role and keeps the answers focused on budget travel.
const systemMessage = {
  role: 'system',
  content: 'You are a friendly Budget Travel Planner, specializing in cost-conscious travel advice. You help users find cheap flights, budget-friendly accommodations, affordable itineraries, and low-cost activities in their chosen destination. If a user\'s query is unrelated to budget travel, respond by stating that you do not know.'
};

// This function sends the conversation history to the OpenAI Chat Completions API.
// It returns the assistant reply so the page can show it directly to the user.
async function sendChatMessage() {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [systemMessage, ...conversationHistory]
    })
  });

  // If the API returns an error status, stop here so the app can show a friendly message.
  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// This function redraws the conversation area so the user can see every message in order.
function renderConversation() {
  responseContainer.innerHTML = '';

  conversationDisplay.forEach((message) => {
    // Each message gets its own block so the chat reads like a real conversation.
    const messageBlock = document.createElement('div');
    messageBlock.className = `chat-message chat-message-${message.role}`;

    const messageLabel = document.createElement('strong');
    messageLabel.textContent = message.role === 'user' ? 'You' : 'Assistant';

    const messageText = document.createElement('p');
    messageText.textContent = message.content;

    messageBlock.appendChild(messageLabel);
    messageBlock.appendChild(messageText);
    responseContainer.appendChild(messageBlock);
  });
}

// This function runs every time the form is submitted.
// It sends the user's message, waits for the assistant reply, and puts that reply on the page.
async function handleSubmit(event) {
  event.preventDefault();

  // Trim whitespace so empty submissions do not get sent to the API.
  const message = userInput.value.trim();

  if (!message) {
    return;
  }

  // Save the user's message so the next request includes the conversation so far.
  conversationHistory.push({
    role: 'user',
    content: message
  });

  // Add the user's message to the visible conversation so it stays on the page.
  conversationDisplay.push({
    role: 'user',
    content: message
  });

  // Repaint the conversation right away so the user sees their question appear instantly.
  renderConversation();

  // Clear the input immediately so the form feels responsive after the user submits.
  userInput.value = '';

  // Show a loading message as a temporary assistant response while the request is in progress.
  conversationDisplay.push({
    role: 'assistant',
    content: 'thinking'
  });
  renderConversation();

  try {
    const assistantReply = await sendChatMessage();

    // Replace the temporary loading message with the real assistant reply.
    conversationDisplay.pop();

    // Save the assistant reply so future prompts can continue the same conversation.
    conversationHistory.push({
      role: 'assistant',
      content: assistantReply
    });

    // Add the assistant reply to the visible conversation so the full chat remains on screen.
    conversationDisplay.push({
      role: 'assistant',
      content: assistantReply
    });

    // Redraw the conversation so the new assistant message appears in the chat history.
    renderConversation();
  } catch (error) {
    // Log the real error so it can be inspected in the console.
    console.error(error);

    // Remove the loading placeholder so the chat does not get stuck showing "thinking".
    conversationDisplay.pop();

    // Show a user-friendly error message inside the response container.
    conversationDisplay.push({
      role: 'assistant',
      content: 'Sorry, something went wrong while fetching the response. Please try again.'
    });
    renderConversation();
  }
}

// Listen for form submissions and connect the submit action to the chat request.
chatForm.addEventListener('submit', handleSubmit);