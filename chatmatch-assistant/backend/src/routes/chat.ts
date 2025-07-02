import express from 'express';
import OpenAI from 'openai';
import { authenticateToken } from './auth';
import { prisma } from '../index';
import { checkUsageLimit } from '../utils/usage';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available tones for chat generation
const TONES = {
  flirt: {
    name: 'Флирт',
    description: 'Игривый и романтичный тон',
    systemPrompt: 'Ты помогаешь продолжить флиртующий диалог. Отвечай игриво, с лёгким кокетством, используй эмодзи и намёки. Будь очаровательным и интригующим.'
  },
  friendly: {
    name: 'Дружелюбный',
    description: 'Тёплый и открытый тон',
    systemPrompt: 'Ты помогаешь продолжить дружескую беседу. Отвечай тепло, искренне, с интересом к собеседнику. Используй дружелюбные эмодзи и открытые вопросы.'
  },
  serious: {
    name: 'Серьёзный',
    description: 'Деловой и вдумчивый тон',
    systemPrompt: 'Ты помогаешь продолжить серьёзную беседу. Отвечай вдумчиво, по существу, профессионально. Избегай лишних эмодзи, фокусируйся на содержании.'
  }
};

// Get available tones
router.get('/tones', (req, res) => {
  const tones = Object.entries(TONES).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description
  }));
  
  res.json({ tones });
});

// Generate chat responses
router.post('/generate', authenticateToken, async (req: any, res) => {
  try {
    const { chatMessages, tone } = req.body;
    const user = req.user;

    // Validate input
    if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
      return res.status(400).json({ error: 'chatMessages array is required' });
    }

    if (!tone || !TONES[tone as keyof typeof TONES]) {
      return res.status(400).json({ error: 'Valid tone is required' });
    }

    // Check usage limits
    const canGenerate = await checkUsageLimit(user);
    if (!canGenerate) {
      return res.status(429).json({ 
        error: 'Usage limit exceeded',
        message: user.subscriptionActive 
          ? 'Monthly limit reached. Please upgrade your plan or wait for next month.'
          : 'Daily limit reached. Please subscribe to Pro for more generations.'
      });
    }

    // Prepare messages for OpenAI
    const lastMessage = chatMessages[chatMessages.length - 1];
    const contextMessages = chatMessages.slice(-5); // Last 5 messages for context

    const systemPrompt = TONES[tone as keyof typeof TONES].systemPrompt;
    
    const conversation = contextMessages.map((msg: any) => ({
      role: msg.sender === 'me' ? 'assistant' : 'user',
      content: msg.text
    }));

    const prompt = `
${systemPrompt}

Контекст переписки:
${contextMessages.map((msg: any) => `${msg.sender === 'me' ? 'Я' : 'Собеседник'}: ${msg.text}`).join('\n')}

Последнее сообщение собеседника: "${lastMessage.text}"

Создай 3 разных варианта ответа в выбранном тоне. Каждый ответ должен быть:
- Естественным продолжением разговора
- Соответствующим выбранному тону
- Не длиннее 2-3 предложений
- Уникальным по подходу

Верни ответ в формате JSON:
{
  "responses": [
    {"text": "Первый вариант ответа"},
    {"text": "Второй вариант ответа"},
    {"text": "Третий вариант ответа"}
  ]
}
`;

    // Generate responses with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let responses;
    try {
      const parsed = JSON.parse(responseText);
      responses = parsed.responses || [];
    } catch (parseError) {
      // Fallback: try to extract responses manually
      console.warn('Failed to parse JSON, using fallback');
      responses = [
        { text: responseText.slice(0, 200) + '...' },
        { text: responseText.slice(0, 200) + '...' },
        { text: responseText.slice(0, 200) + '...' }
      ];
    }

    // Ensure we have exactly 3 responses
    while (responses.length < 3) {
      responses.push({ text: 'Интересно! Расскажи подробнее 😊' });
    }
    responses = responses.slice(0, 3);

    // Save generation to database
    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        chatMessages: JSON.stringify(chatMessages),
        tone,
        responses: JSON.stringify(responses),
        tokensUsed: completion.usage?.total_tokens || 0,
        model: 'gpt-3.5-turbo',
      }
    });

    // Update user usage
    await updateUserUsage(user);

    res.json({
      success: true,
      generation: {
        id: generation.id,
        responses,
        tone,
        tokensUsed: generation.tokensUsed,
      }
    });

  } catch (error) {
    console.error('Chat generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate responses',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's generation history
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const generations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        tone: true,
        responses: true,
        selectedResponse: true,
        tokensUsed: true,
        createdAt: true,
      }
    });

    const total = await prisma.generation.count({
      where: { userId: user.id }
    });

    res.json({
      generations: generations.map(gen => ({
        ...gen,
        responses: JSON.parse(gen.responses as string)
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Mark response as selected
router.post('/select/:generationId', authenticateToken, async (req: any, res) => {
  try {
    const { generationId } = req.params;
    const { selectedResponse } = req.body;
    const user = req.user;

    if (!selectedResponse) {
      return res.status(400).json({ error: 'selectedResponse is required' });
    }

    const generation = await prisma.generation.findFirst({
      where: {
        id: generationId,
        userId: user.id
      }
    });

    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    await prisma.generation.update({
      where: { id: generationId },
      data: { selectedResponse }
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Select response error:', error);
    res.status(500).json({ error: 'Failed to select response' });
  }
});

// Update user usage counters
async function updateUserUsage(user: any) {
  const now = new Date();
  const resetDate = new Date(user.lastResetDate);
  
  // Check if we need to reset daily counter (new day)
  const isNewDay = now.getDate() !== resetDate.getDate() || 
                   now.getMonth() !== resetDate.getMonth() ||
                   now.getFullYear() !== resetDate.getFullYear();

  // Check if we need to reset monthly counter (new month)
  const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                     now.getFullYear() !== resetDate.getFullYear();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      dailyGenerations: isNewDay ? 1 : user.dailyGenerations + 1,
      monthlyGenerations: isNewMonth ? 1 : user.monthlyGenerations + 1,
      lastResetDate: isNewDay ? now : user.lastResetDate,
    }
  });
}

export default router;