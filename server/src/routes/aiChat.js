import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

function getGeminiServerApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

function getGeminiChatModel() {
  return (process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
}

function resolveUserGeminiKey(user) {
  return (user?.geminiApiKey || user?.openaiApiKey || '').trim();
}

async function generateStudyResponseWithGemini({ apiKey, model, systemPrompt, conversationHistory, message }) {
  const contents = [];

  for (const entry of conversationHistory.slice(-10)) {
    if (!entry?.content || typeof entry.content !== 'string') continue;
    if (entry.role === 'user' || entry.role === 'assistant') {
      contents.push({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }]
      });
    }
  }

  contents.push({ role: 'user', parts: [{ text: message }] });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data?.error?.message || 'Gemini request failed.');
    err.status = response.status;
    throw err;
  }

  const assistantMessage = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!assistantMessage) {
    throw new Error('No response from AI');
  }

  return {
    assistantMessage,
    usage: data?.usageMetadata || null
  };
}

// AI Study Chat endpoint - uses user's own Gemini API key
router.post('/study-chat', authenticateToken, async (req, res) => {
  try {
    const { message, taskContext, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's API key (preferred), fallback to server key
    const user = await User.findById(req.user._id);
    const serverApiKey = getGeminiServerApiKey();
    const apiKeyToUse = resolveUserGeminiKey(user) || serverApiKey;

    if (!apiKeyToUse) {
      return res.status(400).json({ 
        error: 'No Gemini API key configured. Add one in Settings or set GEMINI_API_KEY on the server.',
        code: 'NO_API_KEY'
      });
    }

    // Build system prompt for study assistance
    const systemPrompt = `You are a friendly, encouraging AI study assistant helping someone learn "${taskContext?.title || 'a new topic'}".

CONTEXT:
- Today's topic: ${taskContext?.title || 'General study'}
- Description: ${taskContext?.description || 'No specific description'}
- What to learn: ${taskContext?.whatToLearn?.join(', ') || 'General concepts'}
- Skill progression: ${taskContext?.skillProgression || 'Building foundational knowledge'}

YOUR ROLE:
1. Explain concepts clearly and simply
2. Use examples and analogies to make learning easier
3. Be encouraging and patient - no pressure or anxiety-inducing language
4. Break down complex topics into digestible pieces
5. Offer to quiz or test understanding if asked
6. Suggest practical exercises when relevant
7. Answer questions thoroughly but concisely

TONE:
- Calm and supportive
- Never condescending
- Celebrate small wins
- Make learning feel achievable and enjoyable

If the user asks about something unrelated to learning, gently guide them back to the topic or help them see connections to what they're studying.`;

    const { assistantMessage, usage } = await generateStudyResponseWithGemini({
      apiKey: apiKeyToUse,
      model: getGeminiChatModel(),
      systemPrompt,
      conversationHistory,
      message
    });

    res.json({
      message: assistantMessage,
      usage
    });

  } catch (error) {
    console.error('AI Study Chat error:', error);

    const message = (error?.message || '').toLowerCase();

    if (error?.status === 401 || message.includes('api key not valid') || message.includes('invalid api key')) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your Gemini API key in Settings.',
        code: 'INVALID_API_KEY'
      });
    }

    if (error?.status === 429 || message.includes('quota') || message.includes('resource exhausted')) {
      return res.status(402).json({ 
        error: 'Gemini API quota exceeded. Please check your billing in Google AI Studio.',
        code: 'QUOTA_EXCEEDED'
      });
    }

    if (error?.status === 503 || message.includes('rate') || message.includes('too many requests')) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED'
      });
    }

    res.status(500).json({ 
      error: 'Failed to get AI response. Please try again.',
      code: 'AI_ERROR'
    });
  }
});

// Check if user has API key configured
router.get('/has-api-key', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const serverApiKey = getGeminiServerApiKey();
    res.json({ hasApiKey: Boolean(resolveUserGeminiKey(user) || serverApiKey) });
  } catch (error) {
    console.error('Check API key error:', error);
    res.status(500).json({ error: 'Failed to check API key status' });
  }
});

export default router;
