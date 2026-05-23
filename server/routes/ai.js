import express from 'express';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// Helper to map generic or prefixed provider strings to appropriate model identifier
function getModelName(provider) {
  if (provider === 'gemini') {
    return 'gemini-2.5-flash';
  }
  return provider;
}

// Helper to initialize the appropriate client based on provider and key
function getAIClient(provider, apiKey) {
  if (provider.startsWith('gemini')) {
    return new GoogleGenAI({ apiKey });
  }
  switch (provider) {
    case 'openai':
      return new OpenAI({ apiKey });
    case 'anthropic':
      return new Anthropic({ apiKey });
    case 'groq':
      return new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1'
      });
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// 1. API KEY VALIDATION PING
router.post('/ping', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const provider = req.headers['x-provider'];

  if (!apiKey || !provider) {
    return res.status(400).json({ error: 'Missing x-api-key or x-provider headers.' });
  }

  try {
    const client = getAIClient(provider, apiKey);

    if (provider.startsWith('gemini')) {
      const response = await client.models.generateContent({
        model: getModelName(provider),
        contents: 'ping'
      });
      if (response) return res.json({ success: true, message: 'Gemini Key Validated.' });
    } else if (provider === 'openai') {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });
      if (response) return res.json({ success: true, message: 'OpenAI Key Validated.' });
    } else if (provider === 'anthropic') {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }]
      });
      if (response) return res.json({ success: true, message: 'Anthropic Key Validated.' });
    } else if (provider === 'groq') {
      const response = await client.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });
      if (response) return res.json({ success: true, message: 'Groq Key Validated.' });
    }

    throw new Error('Verification returned no response');
  } catch (error) {
    console.error('Validation Error:', error);
    res.status(401).json({ error: error.message || 'Validation failed. Check key & connection.' });
  }
});

// 2. STREAMING CHAT
router.post('/chat', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const provider = req.headers['x-provider'];
  const { messages, memory } = req.body;

  if (!apiKey || !provider) {
    return res.status(400).json({ error: 'Missing x-api-key or x-provider headers.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const client = getAIClient(provider, apiKey);

    // Format memory if present
    let systemInstruction = "You are a professional, elite AI software engineer. Help the user construct high-end code.";
    if (memory && memory.length > 0) {
      systemInstruction += "\n\n[Core User Guidelines / Decisions Memory]:\n" + 
        memory.map(m => `- ${m.title}: ${m.description}`).join('\n');
    }

    if (provider.startsWith('gemini')) {
      // Map standard message roles to Gemini content format (user / model)
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const responseStream = await client.models.generateContentStream({
        model: getModelName(provider),
        contents: contents,
        config: {
          systemInstruction: systemInstruction
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
    } 
    else if (provider === 'openai' || provider === 'groq') {
      const model = provider === 'openai' ? 'gpt-4o-mini' : 'llama3-70b-8192';
      
      const formattedMessages = [
        { role: 'system', content: systemInstruction },
        ...messages
      ];

      const stream = await client.chat.completions.create({
        model,
        messages: formattedMessages,
        stream: true
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    } 
    else if (provider === 'anthropic') {
      // Anthropic does not support 'system' role in messages list directly, it has a top-level system parameter
      const formattedMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const stream = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemInstruction,
        messages: formattedMessages,
        stream: true
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const text = event.delta?.text || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Chat Error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// 3. INTENT MODE REFACTORING
router.post('/intent', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const provider = req.headers['x-provider'];
  const { code, intent, language, memory } = req.body;

  if (!apiKey || !provider || !code || !intent) {
    return res.status(400).json({ error: 'Missing required parameters (key, provider, code, intent).' });
  }

  const prompt = `
You are an expert refactoring engine. Refactor the following code block prioritizing **${intent.toUpperCase()}**.

Language detected/specified: ${language || 'JavaScript/unknown'}

### Source Code:
\`\`\`${language || ''}
${code}
\`\`\`

${memory && memory.length > 0 ? `
[Core User Guidelines / Decisions Memory to respect]:
${memory.map(m => `- ${m.title}: ${m.description}`).join('\n')}
` : ''}

### Requirements:
1. Provide the FULL refactored code inside a standard markdown code block starting with \`\`\`${language || ''} and ending with \`\`\`.
2. Do not omit any parts of the code. Provide the full replacement.
3. Provide a list of major enhancements, changes, or rationale of why these changes fit the "**${intent}**" profile. Keep descriptions short and bulleted.

Ensure your output is structured exactly like:
### Refactored Code:
\`\`\`${language || ''}
[YOUR REFACTORED CODE HERE]
\`\`\`

### Explanation of Changes:
- [Explanation 1]
- [Explanation 2]
`;

  try {
    const client = getAIClient(provider, apiKey);
    let outputText = '';

    if (provider.startsWith('gemini')) {
      const response = await client.models.generateContent({
        model: getModelName(provider),
        contents: prompt
      });
      outputText = response.text || '';
    } else if (provider === 'openai' || provider === 'groq') {
      const model = provider === 'openai' ? 'gpt-4o-mini' : 'llama3-70b-8192';
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      outputText = response.choices[0]?.message?.content || '';
    } else if (provider === 'anthropic') {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });
      outputText = response.content[0]?.text || '';
    }

    // Parse the output to separate code from explanation
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = outputText.match(codeBlockRegex);
    let refactoredCode = code; // fallback
    let explanation = 'No explanation provided.';

    if (match) {
      refactoredCode = match[1].trim();
      explanation = outputText.split('```')[2]?.replace('### Explanation of Changes:', '')?.trim() || 'Refactored successfully.';
    }

    res.json({
      refactoredCode,
      explanation,
      raw: outputText
    });

  } catch (error) {
    console.error('Intent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. EXPLAIN MY CODE FLOWCHART
router.post('/explain', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const provider = req.headers['x-provider'];
  const { code, language } = req.body;

  if (!apiKey || !provider || !code) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  const prompt = `
You are a program analyzer. Create a visual flowchart showing the logic flow, connections, and functions in this code block.
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
- Make sure positions are spaced out logically (e.g., node 1 at y:0, node 2 at y:150, node 3 at y:300) so nodes do not overlap.
- Nodes should have clear labels.
- Important: For each node, include a "line" property (1-indexed integer) indicating the start line number in the source code where this logic block begins.
- Output ONLY the JSON block. Do not include markdown code ticks (\`\`\`) in your response, just the raw JSON.
`;

  try {
    const client = getAIClient(provider, apiKey);
    let outputText = '';

    if (provider.startsWith('gemini')) {
      const response = await client.models.generateContent({
        model: getModelName(provider),
        contents: prompt
      });
      outputText = response.text || '';
    } else if (provider === 'openai' || provider === 'groq') {
      const model = provider === 'openai' ? 'gpt-4o-mini' : 'llama3-70b-8192';
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      outputText = response.choices[0]?.message?.content || '';
    } else if (provider === 'anthropic') {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });
      outputText = response.content[0]?.text || '';
    }

    // Clean JSON output (remove markdown blocks if the LLM ignored guidelines)
    let jsonString = outputText.trim();
    if (jsonString.startsWith('```')) {
      const matches = jsonString.match(/```(?:json)?([\s\S]*?)```/);
      if (matches) jsonString = matches[1].trim();
    }

    // Try parsing
    const flowData = JSON.parse(jsonString);
    res.json(flowData);

  } catch (error) {
    console.error('Explain Flowchart Error:', error);
    // Return a graceful simple fallback flowchart
    res.json({
      nodes: [
        { id: '1', type: 'default', data: { label: 'Start Entry' }, position: { x: 250, y: 50 } },
        { id: '2', type: 'default', data: { label: 'Logic Block (Failed to Parse Visual Flow)' }, position: { x: 250, y: 180 } },
        { id: '3', type: 'default', data: { label: 'End Return' }, position: { x: 250, y: 310 } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true }
      ]
    });
  }
});

export default router;
