const BACKEND_URL = 'http://localhost:5000/api/ai';

// 1. API KEY PING VALIDATOR
export async function validateApiKey(provider, apiKey) {
  const response = await fetch(`${BACKEND_URL}/ping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-provider': provider
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to validate API key.');
  }

  return await response.json();
}

// 2. STREAMING CHAT COMPLETION
export async function streamChatCompletions({ provider, apiKey, messages, memory, onToken, onDone, onError }) {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-provider': provider
      },
      body: JSON.stringify({ messages, memory })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Server returned an error.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Preserve any partial line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.substring(5).trim();
        if (dataStr === '[DONE]') {
          if (onDone) onDone();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            onToken(parsed.text);
          } else if (parsed.error) {
            if (onError) onError(new Error(parsed.error));
            return;
          }
        } catch (e) {
          // Ignore parse errors from chunk fragments
        }
      }
    }

    if (onDone) onDone();

  } catch (error) {
    if (onError) onError(error);
  }
}

// 3. INTENT MODE REFACTOR CALLER
export async function requestIntentRefactor({ provider, apiKey, code, intent, language, memory }) {
  const response = await fetch(`${BACKEND_URL}/intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-provider': provider
    },
    body: JSON.stringify({ code, intent, language, memory })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to execute intent refactoring.');
  }

  return await response.json();
}

// 4. EXPLAIN MY CODE FLOWCHART CALLER
export async function requestExplainFlowchart({ provider, apiKey, code, language }) {
  const response = await fetch(`${BACKEND_URL}/explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-provider': provider
    },
    body: JSON.stringify({ code, language })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch visual logic flowchart.');
  }

  return await response.json();
}
