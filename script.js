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

// Sends the current conversation to OpenAI and gets back one assistant response.
// Uses the global `apiKey` from `secrets.js` in the Authorization header.
// Returns only the assistant text (not the full API JSON object).
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

  // Convert the JSON response body into a JavaScript object.
  const result = await response.json();

  // Return the assistant's message text from the first choice in the response.
  return result.choices[0].message.content;
}

// Rebuilds the chat area from scratch using `conversationDisplay`.
// This keeps the UI in sync with the current conversation state.
function renderConversation() {
  // Clear old chat HTML before drawing all messages again.
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

// Runs when the user submits the chat form.
// Steps: validate input, add the user's message, show a loading message,
// call the API, then replace loading text with the assistant reply.
// `event` is the submit event object passed by the browser.
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
    // Wait for the API call, then store the assistant's final text.
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