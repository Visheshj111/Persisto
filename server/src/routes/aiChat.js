import express from 'express';
import OpenAI from 'openai';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// AI Study Chat endpoint - uses user's own OpenAI API key
router.post('/study-chat', authenticateToken, async (req, res) => {
  try {
    const { message, taskContext, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user's API key
    const user = await User.findById(req.user._id);
    if (!user?.openaiApiKey) {
      return res.status(400).json({ 
        error: 'No OpenAI API key configured. Please add your API key in Settings.',
        code: 'NO_API_KEY'
      });
    }

    // Initialize OpenAI with user's API key
    const openai = new OpenAI({
      apiKey: user.openaiApiKey
    });

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

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    res.json({
      message: assistantMessage,
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI Study Chat error:', error);
    
    // Handle OpenAI specific errors
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your OpenAI API key in Settings.',
        code: 'INVALID_API_KEY'
      });
    }
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded. Please check your billing at platform.openai.com.',
        code: 'QUOTA_EXCEEDED'
      });
    }

    if (error.code === 'rate_limit_exceeded') {
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
    res.json({ hasApiKey: Boolean(user?.openaiApiKey) });
  } catch (error) {
    console.error('Check API key error:', error);
    res.status(500).json({ error: 'Failed to check API key status' });
  }
});

export default router;
