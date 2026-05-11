export type QualificationQuestion = {
  text: string;
  required?: boolean;
};

export type N8nRagDecision = {
  acao_indicada: string;
  razao: string;
  mensagem_exemplo: string;
  links_midia: string;
  perguntas_obrigatorias: string;
  perguntas_facultativas: string;
  output_completo: string;
};

export const splitQualificationQuestions = (questions: QualificationQuestion[] = []) => {
  const validQuestions = Array.isArray(questions) ? questions : [];
  const required = validQuestions
    .filter((question) => question?.required === true)
    .map((question) => question.text)
    .filter(Boolean);
  const optional = validQuestions
    .filter((question) => question?.required !== true)
    .map((question) => question.text)
    .filter(Boolean);

  return {
    perguntas_obrigatorias: required.join('\n'),
    perguntas_facultativas: optional.join('\n')
  };
};

export const normalizarLinks = (links: unknown) => {
  if (!links) return '';
  if (Array.isArray(links)) return links.filter(Boolean).join(' | ');
  if (typeof links === 'string') return links.replace(/,\s*/g, ' | ').trim();
  return '';
};

export const buildRagAgentSystemMessage = () => `Você é um Agente Analítico de Triagem e Recuperação de Informação (RAG). Sua função é processar a entrada do usuário e estruturar os dados para os nós subsequentes de execução.

## CONTEXTO DE OPERAÇÃO
- Você atua como uma camada de inteligência que identifica o que o usuário quer e o que a Base de Conhecimento diz sobre isso.
- **IMPORTANTE**: Você nunca deve informar ao usuário o que o sistema "pode" ou "não pode" fazer. Se o usuário solicitar algo como agendamento, orçamentos ou pagamentos, trate como uma intenção válida de prosseguimento.

## DIRETRIZES DE CONSULTA AO RAG
1. **Dados Técnicos**: Extraia preços, descrições e detalhes reais da base.
2. **Dúvidas**: Use os argumentos da base para contornar objeções.
3. **Ausência de Dados**: Se a informação específica não estiver no RAG, mas for uma solicitação de serviço (ex: agendar), não negue a funcionalidade. Simplesmente direcione o fluxo.

## REGRAS DE COMPORTAMENTO (ESTRITAS)
- **PROIBIÇÃO DE NEGATIVAS**: É terminantemente proibido usar frases como "não tenho essa função", "não posso agendar", "meu sistema não permite".
- **FOCO NA AÇÃO**: Se o usuário quer agendar, sua \`acao_indicada\` deve ser "Agendamento" e sua \`mensagem_exemplo\` deve ser um convite para prosseguir com os dados da agenda.

## FORMATO DE SAÍDA OBRIGATÓRIO (JSON)
Retorne APENAS o JSON abaixo, sem qualquer texto adicional:

{
  "acao_indicada": "Classificação da intenção (ex: Fornecer Dados, Agendamento, Pagamento, Contornar Objeção)",
  "razao": "Justificativa curta da classificação baseada no histórico.",
  "mensagem_exemplo": "Texto natural para o usuário. Use dados do RAG se houver. Se for agendamento, seja solícito e dê continuidade ao assunto.",
  "links_midia": []
}

## REGRA PARA MÍDIAS
1. Busque URLs no RAG apenas se o cliente pedir arquivos explicitamente.
2. Insira no array "links_midia". Não coloque links no texto da "mensagem_exemplo".

Lembre-se: Você é o cérebro que identifica a rota. Se o usuário quer algo que não está no seu manual (RAG), apenas classifique a intenção corretamente e deixe que os agentes especialistas de execução (agendamento, financeiro) assumam a partir do seu JSON.`;

const inferAction = (message: string) => {
  const normalized = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(agenda|agendar|marcar|horario|amanha|hoje|reuniao|visita)\b/.test(normalized)) {
    return 'Agendamento';
  }
  if (/\b(preco|valor|quanto custa|orcamento|condicao)\b/.test(normalized)) {
    return 'Fornecer Dados';
  }
  if (/\b(pagar|pagamento|pix|checkout|link)\b/.test(normalized)) {
    return 'Pagamento';
  }
  return 'Sondagem';
};

export const buildLocalRagDecision = (params: {
  userMessage: string;
  ragContext: string;
  perguntasQualificacao: QualificationQuestion[];
}): N8nRagDecision => {
  const questions = splitQualificationQuestions(params.perguntasQualificacao);
  const action = inferAction(params.userMessage);
  const hasContext = Boolean(params.ragContext.trim());
  const parsed = {
    acao_indicada: action,
    razao: hasContext
      ? 'Classificação feita com base na mensagem e nos trechos recuperados da base de conhecimento.'
      : 'Classificação feita pela intenção da mensagem; nenhum trecho específico do RAG foi encontrado.',
    mensagem_exemplo: action === 'Agendamento'
      ? 'Consigo seguir com o agendamento sim. Vou verificar os melhores horários para você.'
      : hasContext
        ? params.ragContext
        : 'Entendi. Vou seguir o atendimento de forma natural com base no que você me contou.',
    links_midia: []
  };

  return {
    acao_indicada: parsed.acao_indicada,
    razao: parsed.razao,
    mensagem_exemplo: parsed.mensagem_exemplo,
    links_midia: normalizarLinks(parsed.links_midia),
    perguntas_obrigatorias: questions.perguntas_obrigatorias,
    perguntas_facultativas: questions.perguntas_facultativas,
    output_completo: JSON.stringify(parsed)
  };
};
