import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'chat-treinamento-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/chat-treinamento' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { systemPrompt, history, userMessage } = JSON.parse(body);
                  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
                  const mcpUrl = 'https://webhook.storyallday.com/mcp/agendamento';

                  console.log('\n--- ðŸ¤– INICIANDO CHAMADA SANDBOX ---');
                  console.log('Pergunta:', userMessage);

                  if (!apiKey) {
                    console.error('âŒ ERRO: OPENAI_API_KEY nÃ£o configurada');
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'OPENAI_API_KEY nÃ£o configurada' }));
                    return;
                  }

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

                  // FunÃ§Ã£o auxiliar para limpar resposta SSE do n8n
                  const parseMCPResponse = async (response: Response) => {
                    const text = await response.text();
                    console.log(`ðŸ“¦ Resposta RAW do n8n:`, text.substring(0, 150) + '...');

                    const dataLines = text
                      .split(/\r?\n/)
                      .filter(line => line.startsWith('data:'))
                      .map(line => line.replace(/^data:\s*/, '').trim())
                      .filter(Boolean);

                    if (dataLines.length > 0) {
                      return JSON.parse(dataLines.join('\n'));
                    }

                    return JSON.parse(text);
                  };

                  const calendarName =
                    systemPrompt.match(/nome da agenda do agendamento:\s*"([^"]+)"/i)?.[1] ||
                    systemPrompt.match(/Calendar:\s*"([^"]+)"/i)?.[1] ||
                    'primary';
                  const supabaseId =
                    systemPrompt.match(/Use id do supabase\s*:\s*([^\s\n]+)/i)?.[1] ||
                    '';

                  const normalizeMCPArgs = (toolName: string, args: Record<string, any>) => {
                    if (toolName === 'listar_eventos') {
                      return {
                        Calendar: args.Calendar || args.calendarName || calendarName,
                        After: args.After || args.timeMin,
                        Before: args.Before || args.timeMax
                      };
                    }

                    if (toolName === 'criar_evento') {
                      return {
                        Calendar: args.Calendar || args.calendarName || calendarName,
                        Start: args.Start || args.start,
                        End: args.End || args.end,
                        Summary: args.Summary || args.summary,
                        Description: args.Description || args.description || ''
                      };
                    }

                    if (toolName === 'confirmar_status_agendado') {
                      const id = args.id_supabase || args.idSupabase || args.id || args.tenant_id || supabaseId;
                      return {
                        ...args,
                        id_supabase: id,
                        id,
                        eventId: args.eventId || args.event_id || args.EventId || args.eventID || '',
                        status: args.status || 'agendado'
                      };
                    }

                    return args;
                  };

                  let messages: any[] = [
                    { role: 'system', content: systemPrompt },
                    ...(history || []).map((m: any) => ({
                      role: m.user_message ? 'user' : 'assistant',
                      content: m.user_message || m.bot_message
                    })),
                    { role: 'user', content: userMessage }
                  ];

                  let finalResponse = '';
                  let maxIter = 6;
                  const toolResultCache = new Map<string, string>();

                  while (maxIter > 0) {
                    maxIter--;
                    console.log(`ðŸ“¡ Chamando OpenAI (IteraÃ§Ã£o ${6 - maxIter})...`);

                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        model: 'gpt-4.1-mini',
                        messages,
                        tools,
                        tool_choice: 'auto',
                        presence_penalty: 0.2,
                        temperature: 0.4,
                        top_p: 0.9
                      })
                    });

                    const data = await response.json() as any;
                    if (!response.ok) {
                      console.error('âŒ Erro OpenAI:', data.error?.message);
                      throw new Error(data.error?.message || 'Erro na OpenAI');
                    }

                    const message = data.choices[0].message;

                    if (message.tool_calls) {
                      console.log('ðŸ› ï¸ IA solicitou uso de ferramentas:', message.tool_calls.map((tc: any) => tc.function.name).join(', '));
                      messages.push(message);

                      for (const toolCall of message.tool_calls) {
                        const toolName = toolCall.function.name;
                        const args = normalizeMCPArgs(toolName, JSON.parse(toolCall.function.arguments));
                        const cacheKey = toolName === 'criar_evento'
                          ? `${toolName}:${args.Calendar}|${args.Start}|${args.End}|${args.Summary}`
                          : '';

                        console.log(`ðŸ”Œ Chamando n8n -> ${toolName}...`);

                        if (cacheKey && toolResultCache.has(cacheKey)) {
                          console.log('â™»ï¸ Evento jÃ¡ criado nesta rodada; reutilizando retorno anterior.');
                          messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: toolResultCache.get(cacheKey)!
                          });
                          messages.push({
                            role: 'system',
                            content: 'O evento solicitado jÃ¡ foi criado nesta mesma rodada. NÃ£o chame criar_evento novamente para o mesmo horÃ¡rio; continue o fluxo normal e responda ao cliente.'
                          });
                          continue;
                        }

                        try {
                          const controller = new AbortController();
                          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

                          const commonHeaders: Record<string, string> = {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json, text/event-stream'
                          };

                          // 1. PASSO: INITIALIZE
                          console.log(`ðŸ¤ Inicializando conexÃ£o MCP...`);
                          let sessionCookies = '';
                          let sessionId = '';

                          const initRes = await fetch(mcpUrl, {
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
                          const mcpSessionId = initRes.headers.get('mcp-session-id');
                          if (setCookie) sessionCookies = setCookie;
                          if (mcpSessionId) sessionId = mcpSessionId;

                          await parseMCPResponse(initRes);
                          console.log(`âœ… Identificado.`);

                          const sessionHeaders: Record<string, string> = {
                            ...commonHeaders,
                            ...(sessionCookies ? { 'Cookie': sessionCookies } : {}),
                            ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
                          };

                          await fetch(mcpUrl, {
                            method: 'POST',
                            headers: sessionHeaders,
                            signal: controller.signal,
                            body: JSON.stringify({
                              jsonrpc: '2.0',
                              method: 'notifications/initialized',
                              params: {}
                            })
                          }).catch(() => {
                            // Algumas implementaÃƒÂ§ÃƒÂµes fecham a resposta de notificaÃƒÂ§ÃƒÂ£o sem corpo.
                          });

                          // 2. PASSO: CHAMADA REAL DA TOOL
                          console.log(`ðŸ”Œ Executando: ${toolName}...`);
                          const mcpResponse = await fetch(mcpUrl, {
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

                          clearTimeout(timeoutId);
                          const mcpData = await parseMCPResponse(mcpResponse);

                          let toolContent = '';
                          if (mcpData.result && mcpData.result.content) {
                            toolContent = JSON.stringify(mcpData.result.content);
                          } else if (mcpData.error) {
                            console.error(`âš ï¸ Erro no n8n:`, mcpData.error.message);
                            toolContent = JSON.stringify({ error: mcpData.error.message });
                          } else {
                            toolContent = JSON.stringify(mcpData.result || mcpData);
                          }

                          messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: toolContent
                          });
                          if (cacheKey) toolResultCache.set(cacheKey, toolContent);
                        } catch (err: any) {
                          console.error(`âš ï¸ Erro na tool ${toolName}:`, err.message);
                          messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify({ error: `Erro na ferramenta: ${err.message}` })
                          });
                        }
                      }
                      continue;
                    }

                    finalResponse = message.content || '';
                    console.log('ðŸ Resposta final gerada.');
                    break;
                  }

                  if (!finalResponse) {
                    messages.push({
                      role: 'system',
                      content: 'Finalize agora com uma mensagem curta ao cliente, sem chamar ferramentas novamente. Se um evento foi criado, confirme o agendamento e siga o atendimento normal.'
                    });

                    const finalOnlyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                        top_p: 0.9
                      })
                    });

                    const finalOnlyData = await finalOnlyResponse.json() as any;
                    finalResponse = finalOnlyData.choices?.[0]?.message?.content || 'Consegui sim! Seu agendamento ficou confirmado. Posso te ajudar com mais alguma coisa?';
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ output: finalResponse }));
                } catch (err: any) {
                  console.error('ðŸ’¥ ERRO FATAL NO PROXY:', err.message);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    server: {
      proxy: {
        '/api/evolution': {
          target: 'https://api.storyallday.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/evolution/, '')
        },
        '/webhook-api': {
          target: 'https://webhook.storyallday.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/webhook-api/, '')
        }
      }
    }
  }
})
