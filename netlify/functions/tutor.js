const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const TAVILY_BASE_URL = 'https://api.tavily.com/search';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const buildSystemPrompt = () => {
  return [
    'You are ClassDoodle AI Tutor, an expert, friendly high-school tutor for Grades 8-12 CAPS curriculum.',
    'Always explain step-by-step, use simple language, and include examples.',
    'If the learner asks for answers, teach the method and reasoning.',
    'Be honest about uncertainty and never fabricate sources.',
    'If the user requests harmful or unsafe content, refuse briefly.'
  ].join(' ');
};

const buildContextNote = (context = {}) => {
  const parts = [];
  if (context.title) parts.push(`Page title: ${context.title}`);
  if (context.path) parts.push(`Page path: ${context.path}`);
  if (context.description) parts.push(`Description: ${context.description}`);
  return parts.length ? `Context: ${parts.join(' | ')}` : '';
};

const fetchWebContext = async (query) => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(TAVILY_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 4,
      include_answer: false,
      include_raw_content: false
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  if (!data?.results?.length) return null;

  const snippets = data.results
    .slice(0, 4)
    .map((item, idx) => `${idx + 1}. ${item.title} - ${item.url}\n${item.content || ''}`)
    .join('\n\n');

  return `Web search results:\n${snippets}`;
};

const callOpenAI = async (messages) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('Missing OPENAI_API_KEY');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 700
    })
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`OpenAI error: ${body}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim();
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { messages = [], userMessage = '', allowWeb = false, context } = body;

    if (!userMessage.trim()) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ reply: 'Please ask a question.' }) };
    }

    const systemPrompt = buildSystemPrompt();
    const contextNote = buildContextNote(context);
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(contextNote ? [{ role: 'system', content: contextNote }] : []),
      ...messages.filter(msg => ['user', 'assistant'].includes(msg.role)).slice(-12),
      { role: 'user', content: userMessage }
    ];

    if (allowWeb) {
      const webContext = await fetchWebContext(userMessage);
      if (webContext) {
        chatMessages.splice(1, 0, { role: 'system', content: webContext });
      }
    }

    const reply = await callOpenAI(chatMessages);
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply || 'No response generated.' })
    };
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return {
      statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: 'Tutor service error. Please try again later.' })
    };
  }
};
