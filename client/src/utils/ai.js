// ─── AI Utility Layer ─────────────────────────────────────────────────────────
// Smart dual-mode API caller:
//   • LOCAL MODE  → calls your Express server at localhost:5000 (full proxy)
//   • VERCEL MODE → calls Gemini REST API directly from the browser (BYOK)
//
// Detection: if hostname is localhost/127.0.0.1 → local, otherwise → direct.
// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_URL = 'http://localhost:5000/api/ai';

// Gemini REST API base (no SDK needed — pure fetch)
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Detect if we are running locally (dev) or on a deployed host (Vercel etc.)
function isLocalEnv() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

// Map our provider string to the exact Gemini model identifier
function getGeminiModelId(provider) {
  if (provider === 'gemini-2.5-pro') return 'gemini-2.5-pro';
  if (provider === 'gemini-2.5-flash-lite') return 'gemini-2.5-flash-lite-preview-06-17';
  return 'gemini-2.5-flash'; // default
}

// ─── 1. API KEY PING VALIDATOR ────────────────────────────────────────────────
export async function validateApiKey(provider, apiKey) {
  // ── LOCAL: use Express proxy ──────────────────────────────────────────────
  if (isLocalEnv()) {
    const response = await fetch(`${BACKEND_URL}/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-provider': provider
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to validate API key.');
    }
    return await response.json();
  }

  // ── VERCEL / PRODUCTION: call Gemini REST directly ────────────────────────
  if (provider.startsWith('gemini')) {
    const modelId = getGeminiModelId(provider);
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || 'Invalid API key or quota exceeded.';
      throw new Error(msg);
    }

    return { success: true, message: 'Gemini Key Validated.' };
  }

  // ── Other providers (OpenAI, Anthropic, Groq) on Vercel ──────────────────
  // These require a server to avoid CORS. Show a helpful error.
  throw new Error(
    'OpenAI / Anthropic / Groq require the local Express server. ' +
    'Please use a Gemini provider on the web demo, or run the app locally.'
  );
}

// ─── 2. STREAMING CHAT COMPLETION ─────────────────────────────────────────────
export async function streamChatCompletions({ provider, apiKey, messages, memory, onToken, onDone, onError }) {
  try {
    // ── LOCAL: use Express SSE proxy ────────────────────────────────────────
    if (isLocalEnv()) {
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
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.substring(5).trim();
          if (dataStr === '[DONE]') { if (onDone) onDone(); return; }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) onToken(parsed.text);
            else if (parsed.error) { if (onError) onError(new Error(parsed.error)); return; }
          } catch (_) { /* ignore chunk parse errors */ }
        }
      }
      if (onDone) onDone();
      return;
    }

    // ── VERCEL / PRODUCTION: call Gemini Streaming REST directly ─────────────
    if (provider.startsWith('gemini')) {
      const modelId = getGeminiModelId(provider);

      // Build system instruction from memory cards
      let systemInstruction = 'You are a professional, elite AI software engineer. Help the user construct high-end code.';
      if (memory && memory.length > 0) {
        systemInstruction +=
          '\n\n[Core User Guidelines / Decisions Memory]:\n' +
          memory.map(m => `- ${m.title}: ${m.description}`).join('\n');
      }

      // Map message history to Gemini content format
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { maxOutputTokens: 8192 }
          })
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Gemini API request failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.substring(5).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            // Gemini SSE nests text inside candidates[0].content.parts[0].text
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onToken(text);
          } catch (_) { /* ignore parse errors */ }
        }
      }

      if (onDone) onDone();
      return;
    }

    throw new Error('This AI provider is only available in the local desktop app.');

  } catch (error) {
    if (onError) onError(error);
  }
}

// ─── 3. INTENT MODE REFACTOR ──────────────────────────────────────────────────
export async function requestIntentRefactor({ provider, apiKey, code, intent, language, memory }) {
  // ── LOCAL ────────────────────────────────────────────────────────────────
  if (isLocalEnv()) {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to execute intent refactoring.');
    }
    return await response.json();
  }

  // ── VERCEL: call Gemini directly ─────────────────────────────────────────
  if (provider.startsWith('gemini')) {
    const modelId = getGeminiModelId(provider);

    const prompt = `You are an expert refactoring engine. Refactor the following code block prioritizing **${intent.toUpperCase()}**.

Language detected/specified: ${language || 'JavaScript/unknown'}

### Source Code:
\`\`\`${language || ''}
${code}
\`\`\`

${memory && memory.length > 0 ? `[Core User Guidelines / Decisions Memory to respect]:
${memory.map(m => `- ${m.title}: ${m.description}`).join('\n')}` : ''}

### Requirements:
1. Provide the FULL refactored code inside a standard markdown code block starting with \`\`\`${language || ''} and ending with \`\`\`.
2. Do not omit any parts of the code. Provide the full replacement.
3. Provide a list of major enhancements, changes, or rationale of why these changes fit the "${intent}" profile.

Ensure your output is structured exactly like:
### Refactored Code:
\`\`\`${language || ''}
[YOUR REFACTORED CODE HERE]
\`\`\`

### Explanation of Changes:
- [Explanation 1]
- [Explanation 2]`;

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Intent refactor failed.');
    }

    const data = await response.json();
    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the output
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = outputText.match(codeBlockRegex);
    let refactoredCode = code;
    let explanation = 'No explanation provided.';

    if (match) {
      refactoredCode = match[1].trim();
      explanation = outputText.split('```')[2]?.replace('### Explanation of Changes:', '')?.trim() || 'Refactored successfully.';
    }

    return { refactoredCode, explanation, raw: outputText };
  }

  throw new Error('Intent refactoring requires the local server for non-Gemini providers.');
}

// ─── 4. EXPLAIN MY CODE FLOWCHART ─────────────────────────────────────────────
export async function requestExplainFlowchart({ provider, apiKey, code, language }) {
  // ── LOCAL ────────────────────────────────────────────────────────────────
  if (isLocalEnv()) {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch visual logic flowchart.');
    }
    return await response.json();
  }

  // ── VERCEL: call Gemini directly ─────────────────────────────────────────
  if (provider.startsWith('gemini')) {
    const modelId = getGeminiModelId(provider);

    const prompt = `You are a program analyzer. Create a visual flowchart showing the logic flow, connections, and functions in this code block.
Your output MUST be a single JSON object that defines "nodes" and "edges" compatible with React Flow / reactflow.

### Source Code:
\`\`\`${language || ''}
${code}
\`\`\`

### Response format:
You must return ONLY a JSON block, no other text or explanation. The JSON schema must strictly match:
{
  "nodes": [
    {
      "id": "node_id_1",
      "type": "default",
      "data": { "label": "Node Label describing code part" },
      "line": 4,
      "position": { "x": 250, "y": 50 }
    }
  ],
  "edges": [
    {
      "id": "e_1_2",
      "source": "node_id_1",
      "target": "node_id_2",
      "animated": true,
      "label": "optional flow condition label"
    }
  ]
}

### Guidelines:
- Parse actual function declarations, conditions (if/else), and return paths into separate nodes.
- Make sure positions are spaced out logically so nodes do not overlap.
- For each node, include a "line" property (1-indexed integer) indicating the start line number in the source code.
- Output ONLY the JSON block. Do not include markdown code ticks in your response, just the raw JSON.`;

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Explain flowchart failed.');
    }

    const data = await response.json();
    let outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean JSON output (remove markdown blocks if LLM wrapped them anyway)
    let jsonString = outputText.trim();
    if (jsonString.startsWith('```')) {
      const matches = jsonString.match(/```(?:json)?([\s\S]*?)```/);
      if (matches) jsonString = matches[1].trim();
    }

    try {
      return JSON.parse(jsonString);
    } catch (_) {
      // Graceful fallback flowchart
      return {
        nodes: [
          { id: '1', type: 'default', data: { label: 'Start Entry' }, position: { x: 250, y: 50 } },
          { id: '2', type: 'default', data: { label: 'Logic Block' }, position: { x: 250, y: 180 } },
          { id: '3', type: 'default', data: { label: 'End Return' }, position: { x: 250, y: 310 } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', animated: true },
          { id: 'e2-3', source: '2', target: '3', animated: true }
        ]
      };
    }
  }

  throw new Error('Explain flowchart requires the local server for non-Gemini providers.');
}
