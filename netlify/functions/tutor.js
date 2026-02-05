const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const TAVILY_BASE_URL = 'https://api.tavily.com/search';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const buildSystemPrompt = (mode = 'tutor') => {
  const base = [
    'You are ClassDoodle AI Tutor, an expert, friendly high-school tutor for Grades 8-12 CAPS curriculum.',
    'Always explain step-by-step, use simple language, and include examples.',
    'If the learner asks for answers, teach the method and reasoning.',
    'Be honest about uncertainty and never fabricate sources.',
    'If the user requests harmful or unsafe content, refuse briefly.'
  ];

  const modes = {
    tutor: 'Mode: Smart Tutor. Provide clear explanations, worked examples, and check understanding.',
    quiz: 'Mode: Quiz Generator. Create a short quiz with answers and brief explanations.',
    homework: 'Mode: Homework Checker. Give feedback, point out mistakes, and show the correct method.'
  };

  base.push(modes[mode] || modes.tutor);
  return base.join(' ');
};

const buildContextNote = (context = {}) => {
  const parts = [];
  if (context.title) parts.push(`Page title: ${context.title}`);
  if (context.path) parts.push(`Page path: ${context.path}`);
  if (context.description) parts.push(`Description: ${context.description}`);
  return parts.length ? `Context: ${parts.join(' | ')}` : '';
};

const fetchWebContext = async (query, startIndex = 1) => {
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

  const sources = data.results.slice(0, 4).map((item, idx) => ({
    index: startIndex + idx,
    title: item.title,
    url: item.url,
    excerpt: item.content || ''
  }));

  const snippets = sources
    .map((item) => `[${item.index}] ${item.title} - ${item.url}\n${item.excerpt}`)
    .join('\n\n');

  return {
    note: `Web search results:\n${snippets}`,
    sources: sources.map(({ title, url }) => ({ title, url }))
  };
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
    const { messages = [], userMessage = '', allowWeb = false, context, mode = 'tutor', localSources = [] } = body;

    if (!userMessage.trim()) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ reply: 'Please ask a question.' }) };
    }

    const systemPrompt = buildSystemPrompt(mode);
    const contextNote = buildContextNote(context);
    const normalizedLocalSources = Array.isArray(localSources)
      ? localSources.filter(source => source?.url && source?.excerpt)
      : [];

    const localSourcesNote = normalizedLocalSources.length
      ? `Local ClassDoodle sources (cite like [1], [2]):\n${normalizedLocalSources
          .map((source, idx) => `[${idx + 1}] ${source.title || source.url} - ${source.url}\n${source.excerpt}`)
          .join('\n\n')}`
      : '';

    let responseSources = normalizedLocalSources.map(source => ({
      title: source.title || source.url,
      url: source.url
    }));
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(contextNote ? [{ role: 'system', content: contextNote }] : []),
      ...(localSourcesNote ? [{ role: 'system', content: localSourcesNote }] : []),
      ...messages.filter(msg => ['user', 'assistant'].includes(msg.role)).slice(-12),
      { role: 'user', content: userMessage }
    ];

    if (allowWeb) {
      const webContext = await fetchWebContext(userMessage, responseSources.length + 1);
      if (webContext?.note) {
        chatMessages.splice(1, 0, { role: 'system', content: webContext.note });
      }
      if (webContext?.sources?.length) {
        responseSources = responseSources.concat(webContext.sources);
      }
    }

    const reply = await callOpenAI(chatMessages);
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply || 'No response generated.', sources: responseSources })
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
