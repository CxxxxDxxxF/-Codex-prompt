// chat.js
const form     = document.getElementById('chat-form');
const input    = document.getElementById('message-input');
const messages = document.getElementById('messages');

function addMessage(text, cls) {
  const el = document.createElement('div');
  el.className = `message ${cls}`;
  el.innerText = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  input.value = '';
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const { reply } = await res.json();
    addMessage(reply, 'bot');
  } catch {
    addMessage('⚠️ Server unreachable. Try again later.', 'bot');
  }
});
