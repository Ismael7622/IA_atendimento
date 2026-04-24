# Base de Conhecimento: Chat de IA + Dashboard Analítico

Este documento serve como guia mestre para criar um sistema de monitoramento de chat de IA com dashboard integrado, exatamente como o sistema atual. Use estas instruções para implementar as conexões, lógica e funcionalidades em qualquer projeto.

---

## 1. Coleta de Informações (MANDATÓRIO)
Antes de começar, você **deve** pedir ao usuário:
1. **Credenciais do Supabase**: URL do projeto e a `anon_key`.
2. **Webhooks do n8n/Backend**: 
   - Envio de mensagem manual.
   - Reativação de IA (unpause).
   - Cadastro de novas objeções/treinamento (RAG).
3. **Estrutura do Banco**: Confirme se as tabelas seguem o padrão abaixo ou se precisam de mapeamento.

---

## 2. Arquitetura de Dados (Supabase)

O sistema depende de três tabelas principais:

### Tabela: `ia_chat_messages` (Histórico)
- `phone` (text): Identificador único do cliente (WhatsApp).
- `nomewpp` (text): Nome do perfil no WhatsApp.
- `user_message` (text): Mensagem enviada pelo cliente.
- `bot_message` (text): Resposta enviada pela IA.
- `created_at` (timestamp): Data e hora da interação.

### Tabela: `ia_dados_cliente` (Status e CRM)
- `telefone` (text): Identificador (FK para mensagens).
- `atendimento_ia` (text): Status da automação (`pause` ou `atendendo`).
- `agenda_check` (text): Status do funil (`null`, `agendou`, `compareceu`, `no_show`).
- `situacaofollow` (text): Etapa do follow-up (ex: "1", "2", "9" para finalizado).
- `uf` (text): Estado do cliente (para o mapa).

### Tabela: `ia_documents` (Conhecimento/RAG)
- `content` (text): Formato esperado: `pergunta: X | resposta: Y`. Usado para sinalizar no chat quais perguntas já têm resposta treinada.

---

## 3. Lógica do Chat (Real-time)

### Exibição de Mensagens
- **Agrupamento**: Agrupe mensagens por `phone` para listar os contatos.
- **Ordenação**: Sempre ordene por `created_at DESC` na lista e `ASC` dentro da conversa.
- **Sinalização de Resposta**: Ao renderizar, verifique se o texto da `user_message` existe na tabela `ia_documents`. Se sim, mostre um selo de "✓ Resposta cadastrada".

### Tempo Real
Use o SDK do Supabase para ouvir mudanças na tabela `ia_chat_messages`:
```javascript
supabase.channel('chat-changes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ia_chat_messages' }, payload => {
    // Se a mensagem for do cliente atual, adicione a bolha na tela
  })
  .subscribe();
```

---

## 4. Dashboard e Métricas

### Cálculos Chave
1. **Conversas Iniciadas**: Contagem de `phone` distintos onde `bot_message` não é nulo.
2. **Conversas Respondidas**: Contagem de `phone` distintos onde `user_message` não é nulo.
3. **Taxa de Resposta**: `(Respondidas / Iniciadas) * 100`.
4. **Taxa de Agendamento**: `(Leads com agenda_check != null / Respondidas) * 100`.

### Gráficos
- **Volume Diário**: Use Chart.js para mostrar Barras (Iniciadas) e Linha (Respondidas) no mesmo eixo X (Data).

### Mapa Geográfico
- Utilize um GeoJSON do Brasil.
- Conte as interações por estado (`uf`) na tabela `ia_dados_cliente` e pinte o mapa proporcionalmente (Choropleth).

---

## 5. Funcionalidades Avançadas

### Extração de PDF
- Use a biblioteca `html2pdf.js`.
- Gere um documento formatado capturando o conteúdo da div de histórico de chat.
- **Importante**: Remova animações e elementos interativos no estilo de impressão antes de gerar.

### Gestão de Objeções (Feedback Loop)
- Permita clicar com o botão direito (context menu) em uma mensagem do usuário.
- Abra um modal para o operador digitar a "resposta ideal".
- Envie um payload `{ pergunta, resposta, phone }` para o webhook de treinamento.

---

## 6. Frontend e Design

**Instrução para a LLM**: Não tente impor um design complexo de imediato. Siga estas diretrizes:
1. Implemente uma estrutura HTML semântica básica (Sidebar de contatos, Área de Chat, Painel de Dashboard).
2. Use variáveis CSS para cores e fontes, permitindo que o usuário as adapte ao tema do projeto atual.
3. Priorize a **funcionalidade** e **responsividade**.
4. Use ícones simples (SVG ou emojis) para ações como PDF, Pausa e Enviar.

---

## 7. Integrações Externas (Webhooks)

Ao implementar as ações, use chamadas `fetch` para os seguintes endpoints fornecidos pelo usuário:
- **Pausar/Despausar**: Envia o telefone para o fluxo que controla a automação.
- **Mensagem Manual**: Envia o texto digitado pelo operador para o WhatsApp do cliente, garantindo que a IA não interfira no momento (geralmente dispara um pause automático).

---

*Nota: Este guia foi gerado para replicar a inteligência e conexões do sistema "Sitebase/IA Atendimento".*
