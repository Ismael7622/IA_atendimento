const MCP_URL = 'https://webhook.storyallday.com/mcp/agendamento';

const tools = [
  {
    type: 'function',
    function: {
      name: 'listar_eventos',
      description: 'Lista eventos do Google Calendar para verificar disponibilidade.',
      parameters: {
        type: 'object',
        properties: {
          Calendar: { type: 'string', description: 'Nome da agenda enviada pelo agente' },
          After: { type: 'string', description: 'Data/hora inicial ISO 8601 com -03:00' },
          Before: { type: 'string', description: 'Data/hora final ISO 8601 com -03:00' }
        },
        required: ['Calendar', 'After', 'Before']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'criar_evento',
      description: 'Cria um novo evento no Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          Calendar: { type: 'string', description: 'Nome da agenda enviada pelo agente' },
          Start: { type: 'string', description: 'Data/hora de inicio ISO 8601 com -03:00' },
          End: { type: 'string', description: 'Data/hora de termino ISO 8601 com -03:00' },
          Summary: { type: 'string', description: 'Titulo do evento' },
          Description: { type: 'string', description: 'Descricao do evento' }
        },
        required: ['Calendar', 'Start', 'End', 'Summary', 'Description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'confirmar_status_agendado',
      description: 'Confirma no banco de dados que o atendimento foi agendado.',
      parameters: {
        type: 'object',
        properties: {
          id_supabase: { type: 'string', description: 'ID do cliente/registro no Supabase' },
          eventId: { type: 'string', description: 'ID do evento criado no calendario' },
          status: { type: 'string', description: 'Status a registrar no atendimento' }
        },
        required: ['id_supabase']
      }
    }
  }
];

async function parseMCPResponse(response) {
  const text = await response.text();
  console.log('Resposta RAW do n8n:', text.substring(0, 150) + '...');

  const dataLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s*/, '').trim())
    .filter(Boolean);

  if (dataLines.length > 0) {
    return JSON.parse(dataLines.join('\n'));
  }

  return JSON.parse(text);
}

function extractDefaults(systemPrompt) {
  return {
    calendarName:
      systemPrompt.match(/nome da agenda do agendamento:\s*"([^"]+)"/i)?.[1] ||
      systemPrompt.match(/Calendar:\s*"([^"]+)"/i)?.[1] ||
      'primary',
    supabaseId:
      systemPrompt.match(/Use id do supabase\s*:\s*([^\s\n]+)/i)?.[1] ||
      ''
  };
}

function normalizeMCPArgs(toolName, args, defaults) {
  if (toolName === 'listar_eventos') {
    return {
      Calendar: args.Calendar || args.calendarName || defaults.calendarName,
      After: args.After || args.timeMin,
      Before: args.Before || args.timeMax
    };
  }

  if (toolName === 'criar_evento') {
    return {
      Calendar: args.Calendar || args.calendarName || defaults.calendarName,
      Start: args.Start || args.start,
      End: args.End || args.end,
      Summary: args.Summary || args.summary,
      Description: args.Description || args.description || ''
    };
  }

  if (toolName === 'confirmar_status_agendado') {
    const id = args.id_supabase || args.idSupabase || args.id || args.tenant_id || defaults.supabaseId;
    return {
      ...args,
      id_supabase: id,
      id,
      eventId: args.eventId || args.event_id || args.EventId || args.eventID || '',
      status: args.status || 'agendado'
    };
  }

  return args;
}

async function callMCPTool(toolName, args) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  const commonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };

  try {
    const initRes = await fetch(MCP_URL, {
      method: 'POST',
      headers: commonHeaders,
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'Sandbox-Internal', version: '1.0.0' }
        }
      })
    });

    const setCookie = initRes.headers.get('set-cookie');
    const sessionId = initRes.headers.get('mcp-session-id');
    await parseMCPResponse(initRes);

    const sessionHeaders = {
      ...commonHeaders,
      ...(setCookie ? { Cookie: setCookie } : {}),
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
    };

    await fetch(MCP_URL, {
      method: 'POST',
      headers: sessionHeaders,
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {}
      })
    }).catch(() => {});

    const mcpResponse = await fetch(MCP_URL, {
      method: 'POST',
      headers: sessionHeaders,
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: toolName, arguments: args },
        id: Date.now()
      })
    });

    const mcpData = await parseMCPResponse(mcpResponse);
    if (mcpData.result?.content) return JSON.stringify(mcpData.result.content);
    if (mcpData.error) return JSON.stringify({ error: mcpData.error.message });
    return JSON.stringify(mcpData.result || mcpData);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenAI(apiKey, messages, options = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages,
      presence_penalty: 0.2,
      temperature: 0.4,
      top_p: 0.9,
      ...options
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro na OpenAI');
  }
  return data.choices?.[0]?.message || {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, history, userMessage } = req.body;

  if (!systemPrompt || !userMessage) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API Key not configured on server' });
  }

  try {
    const ragPreview = systemPrompt.match(/Mensagem ou instrução anterior:\s*"([\s\S]*?)"\s*Ação indicada:/)?.[1]?.trim();
    console.log('\n--- 🤖 INICIANDO CHAMADA SANDBOX ---');
    console.log('Pergunta:', userMessage);
    console.log('📚 RAG no prompt:', ragPreview ? ragPreview.slice(0, 220).replace(/\s+/g, ' ') : 'não identificado');

    const defaults = extractDefaults(systemPrompt);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((m) => ({
        role: m.user_message ? 'user' : 'assistant',
        content: m.user_message || m.bot_message
      })),
      { role: 'user', content: userMessage }
    ];

    let finalResponse = '';
    let maxIter = 6;
    const toolResultCache = new Map();

    while (maxIter > 0) {
      maxIter -= 1;
      const message = await callOpenAI(apiKey, messages, { tools, tool_choice: 'auto' });

      if (!message.tool_calls) {
        finalResponse = message.content || '';
        break;
      }

      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const args = normalizeMCPArgs(toolName, JSON.parse(toolCall.function.arguments), defaults);
        const cacheKey = toolName === 'criar_evento'
          ? `${toolName}:${args.Calendar}|${args.Start}|${args.End}|${args.Summary}`
          : '';

        let toolContent;
        if (cacheKey && toolResultCache.has(cacheKey)) {
          toolContent = toolResultCache.get(cacheKey);
          messages.push({
            role: 'system',
            content: 'O evento solicitado já foi criado nesta mesma rodada. Não chame criar_evento novamente para o mesmo horário; continue o fluxo normal e responda ao cliente.'
          });
        } else {
          toolContent = await callMCPTool(toolName, args);
          if (cacheKey) toolResultCache.set(cacheKey, toolContent);
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: toolContent
        });
      }
    }

    if (!finalResponse) {
      messages.push({
        role: 'system',
        content: 'Finalize agora com uma mensagem curta ao cliente, sem chamar ferramentas novamente. Se um evento foi criado, confirme o agendamento e siga o atendimento normal.'
      });
      const finalOnlyMessage = await callOpenAI(apiKey, messages);
      finalResponse = finalOnlyMessage.content || 'Consegui sim! Seu agendamento ficou confirmado. Posso te ajudar com mais alguma coisa?';
    }

    return res.status(200).json({ output: finalResponse });
  } catch (error) {
    console.error('API Sandbox Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
