# Guia de Replicação: Painel IA Atendimento Multi-Tenant

## Stack e Setup

```
Vite + React + TypeScript
Supabase (Auth + DB + Storage)
Evolution API (WhatsApp)
n8n (Webhooks + Embeddings)
Recharts (gráficos)
Lucide-react (ícones)
```

### Variáveis de ambiente (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_EVOLUTION_URL=https://api.seudominio.com
VITE_EVOLUTION_API_KEY=xxx
```

### lib/supabase.ts
```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### vercel.json (proxy da Evolution API em produção)
```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }]
}
```

### api/evolution.js (serverless Vercel)
```js
export default async function handler(req, res) {
  const { endpoint, method, body } = req.body;
  const baseUrl = process.env.EVOLUTION_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const r = await fetch(`${baseUrl}${endpoint}`, {
    method, headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: method !== 'GET' ? JSON.stringify(body) : undefined
  });
  const data = await r.json();
  res.status(r.status).json(data);
}
```

---

## Banco de Dados Supabase (Schema Completo)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- CLIENTES (multi-usuário: cada email tem seus clientes)
CREATE TABLE z_bd_atendimento_clientes (
  id text PRIMARY KEY,
  user_id text NOT NULL,       -- email do admin (isolamento multi-user)
  nome text NOT NULL,
  email text,
  telefone text,
  instance_name text,          -- nome da instância WhatsApp
  created_at timestamptz DEFAULT now()
);

-- PRODUTOS por tenant
CREATE TABLE z_bd_produtos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,     -- = cliente.id
  nome text NOT NULL,
  descricao text,
  preco numeric DEFAULT 0,
  estoque integer DEFAULT 0,
  imagem_url text,
  tipo text DEFAULT 'produto',
  created_at timestamptz DEFAULT now()
);

-- CONFIGURAÇÕES DA IA por cliente
CREATE TABLE z_bd_configuracoes_ia (
  cliente_id text PRIMARY KEY,
  nome_agente text,
  nome_empresa text,
  saudacao text,
  objetivo text DEFAULT 'Agendar Reunião',
  tipo_conversao text DEFAULT 'Videochamada',
  papel_humano text,
  restricoes jsonb DEFAULT '[]',
  perguntas_qualificacao jsonb DEFAULT '[]',
  notificar_em text,
  google_calendar_name text,
  updated_at timestamptz DEFAULT now()
);

-- MENSAGENS DO CHAT
CREATE TABLE "Z_ia_chat_messages" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  phone text NOT NULL,
  nomewpp text,
  user_message text,
  bot_message text,
  created_at timestamptz DEFAULT now()
);

-- STATUS DO CLIENTE (IA ativa/pausada)
CREATE TABLE "Z_ia_dados_cliente" (
  telefone text PRIMARY KEY,
  tenant_id text NOT NULL,
  atendimento_ia text DEFAULT 'atendendo', -- 'atendendo' | 'pause'
  agenda_check text,
  situacaofollow text,
  uf text,
  updated_at timestamptz DEFAULT now()
);

-- RAG UNIFICADO
CREATE TABLE z_atendimento_conhecimento (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  embedding vector(1536)
);

-- Storage bucket para imagens
INSERT INTO storage.buckets (id, name, public) VALUES ('produtos_cliente', 'produtos_cliente', true) ON CONFLICT DO NOTHING;
CREATE POLICY "leitura publica" ON storage.objects FOR SELECT USING (bucket_id = 'produtos_cliente');
CREATE POLICY "upload livre" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'produtos_cliente');
CREATE POLICY "update livre" ON storage.objects FOR UPDATE USING (bucket_id = 'produtos_cliente');
CREATE POLICY "delete livre" ON storage.objects FOR DELETE USING (bucket_id = 'produtos_cliente');
```

---

## Tipos TypeScript

```ts
type Cliente = {
  id: string; nome: string; email?: string;
  telefone?: string; instance_name?: string; created_at?: string;
};

type Produto = {
  id: string; clienteId: string; nome: string;
  descricao: string; preco: number; estoque: number; imagemUrl?: string;
  tipo: 'produto' | 'servico';
};

type ChatMessage = {
  id: string; tenant_id: string; phone: string;
  nomewpp?: string; user_message?: string; bot_message?: string; created_at: string;
};

type ClientStatus = {
  telefone: string; atendimento_ia: 'atendendo' | 'pause';
  agenda_check?: string; tenant_id?: string;
};

type Toast = { id: string; message: string; type: 'warning' | 'success' };
```

---

## Estados Globais (App.tsx)

```tsx
// Auth
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [userEmail, setUserEmail] = useState('');
const [isLoadingAuth, setIsLoadingAuth] = useState(true);

// Navegação: 'home' | 'client-hub' | 'inventory' | 'conversas' | 'config'
const [view, setView] = useState('home');

// Multi-tenant
const [clientes, setClientes] = useState<Cliente[]>([]);
const [selectedClienteId, setSelectedClienteId] = useState('');
const selectedCliente = useMemo(() => clientes.find(c => c.id === selectedClienteId), [clientes, selectedClienteId]);

// Produtos
const [produtos, setProdutos] = useState<Produto[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [imageFile, setImageFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [formState, setFormState] = useState<Partial<Produto>>({ nome: '', descricao: '', preco: 0, estoque: 0 });

// Chat Monitor
const [contacts, setContacts] = useState<{phone:string, nomewpp:string, last_msg:string, time:string}[]>([]);
const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [clientStatus, setClientStatus] = useState<ClientStatus | null>(null);
const [manualMsg, setManualMsg] = useState('');
const [conversasSubView, setConversasSubView] = useState<'chat'|'dashboard'>('chat');

// WhatsApp Instance
const [instanceStatuses, setInstanceStatuses] = useState<Record<string, 'conectado'|'desconectado'>>({});
const [instanceProfiles, setInstanceProfiles] = useState<Record<string, string>>({});
const [qrCode, setQrCode] = useState<string | null>(null);
const [qrTimeLeft, setQrTimeLeft] = useState(30);

// IA Config
const [aiSettings, setAiSettings] = useState({
  nomeAgente: '', nomeEmpresa: '', saudacao: '',
  objetivo: 'Agendar Reunião', tipoConversao: 'Videochamada',
  papelHumano: '', restricoes: [] as string[],
  perguntasQualificacao: [] as {text:string, required:boolean}[],
  notificarEm: '', googleCalendarName: ''
});

// UI
const [toasts, setToasts] = useState<Toast[]>([]);
const [dashboardData, setDashboardData] = useState<any>(null);
```

---

## Funções Críticas

### evolutionFetch (proxy dev/prod)
```tsx
const evolutionFetch = async (endpoint: string, method = 'GET', body?: any) => {
  if (import.meta.env.DEV) {
    return fetch(`${import.meta.env.VITE_EVOLUTION_URL}${endpoint}`, {
      method,
      headers: { apikey: import.meta.env.VITE_EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });
  }
  return fetch('/api/evolution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, body })
  });
};
```

### saveProduct (com RAG sync + webhook embedding)
```tsx
const saveProduct = async () => {
  if (!formState.nome) return alert('Nome obrigatório!');
  setIsUploading(true);
  let finalImageUrl = formState.imagemUrl || null;

  // 1. Upload imagem se houver
  if (imageFile) {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${imageFile.name.split('.').pop()}`;
    const filePath = `${selectedClienteId}/${fileName}`;
    await supabase.storage.from('produtos_cliente').upload(filePath, imageFile);
    const { data: pub } = supabase.storage.from('produtos_cliente').getPublicUrl(filePath);
    finalImageUrl = pub.publicUrl;
  }

  const dbPayload = {
    tenant_id: selectedClienteId,
    nome: formState.nome, descricao: formState.descricao || '',
    preco: formState.preco || 0, estoque: formState.tipo === 'servico' ? 0 : (formState.estoque || 0),
    imagem_url: finalImageUrl,
    tipo: formState.tipo || 'produto'
  };

  // 2. Salva produto no banco
  let savedProduct: any;
  const type = editingId ? 'UPDATE' : 'INSERT';
  if (editingId) {
    const { data } = await supabase.from('z_bd_produtos').update(dbPayload).eq('id', editingId).select().single();
    savedProduct = data;
  } else {
    const { data } = await supabase.from('z_bd_produtos').insert([dbPayload]).select().single();
    savedProduct = data;
  }

  // 3. SINCRONIZAÇÃO RAG: Limpa o antigo e insere o novo
  await supabase.from('z_atendimento_conhecimento')
    .delete().filter('metadata->>id_ref', 'eq', savedProduct.id);

  const label = savedProduct.tipo === 'servico' ? 'Serviço' : 'Produto';
  const ragContent = `${label}: ${savedProduct.nome} | Descrição: ${savedProduct.descricao} | Preço: R$${savedProduct.preco}${savedProduct.tipo === 'servico' ? ' | Disponibilidade: Sob Consulta (Serviço)' : ` | Estoque: ${savedProduct.estoque}`}`;
  const ragMetadata = {
    id_ref: savedProduct.id, tenant_id: savedProduct.tenant_id,
    source: `z_bd_produtos_${savedProduct.id}`, tipo: savedProduct.tipo || 'produto'
  };

  const { data: ragData } = await supabase.from('z_atendimento_conhecimento')
    .insert([{ content: ragContent, metadata: ragMetadata }]).select().single();

  // 4. Dispara webhook de embedding (n8n gera o vetor)
  if (ragData) {
    await fetch('https://SEU_WEBHOOK/rag-disponibilidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        body: { record: { content: ragData.content, embedding: null, id: ragData.id, metadata: ragData.metadata }, type }
      }])
    });
  }

  setIsUploading(false);
  setIsModalOpen(false);
  fetchProdutos();
};

const deleteProduct = async (id: string) => {
  if (!window.confirm("Deseja realmente excluir este produto?")) return;
  
  // 1. Deletar do RAG
  await supabase.from('z_atendimento_conhecimento')
    .delete().filter('metadata->>id_ref', 'eq', id.toString());

  // 2. Notificar Webhook RAG (DELETE)
  fetch('https://SEU_WEBHOOK/rag-disponibilidades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ body: { record: { id_ref: id }, type: 'DELETE' } }])
  }).catch(e => console.error(e));

  // 3. Deletar produto
  await supabase.from('z_bd_produtos').delete().eq('id', id);
  fetchProdutos();
};
```

### saveClient (cria cliente + instância WhatsApp)
```tsx
const saveClient = async () => {
  const toSnakeCase = (s: string) => s.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,'_').replace(/[^\w-]+/g,'');

  const instanceName = `${userEmail}-${toSnakeCase(clientForm.nome)}`;
  const newId = 'cust_' + Date.now().toString(36);

  // 1. Salva no banco
  await supabase.from('z_bd_atendimento_clientes')
    .insert([{ ...clientForm, id: newId, instance_name: instanceName, user_id: userEmail }]);

  // 2. Cria linha de config IA
  await supabase.from('z_bd_configuracoes_ia')
    .insert([{ cliente_id: newId, updated_at: new Date().toISOString() }]);

  // 3. Cria instância na Evolution API via webhook
  await fetch('https://SEU_WEBHOOK/gerar-instancia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instance: instanceName,
      events: ['MESSAGES_UPSERT'],
      webhook_url: 'https://SEU_WEBHOOK/recebe-msg'
    })
  });
  fetchClientes();
};
```

### sendManualMessage (envia msg e pausa IA)
```tsx
const sendManualMessage = async () => {
  if (!manualMsg || !selectedPhone) return;
  await supabase.from('Z_ia_chat_messages').insert([{
    tenant_id: selectedClienteId, phone: selectedPhone,
    bot_message: manualMsg,
    nomewpp: contacts.find(c => c.phone === selectedPhone)?.nomewpp
  }]);
  setManualMsg('');
  // Pausa IA automaticamente ao intervir manualmente
  if (clientStatus?.atendimento_ia !== 'pause') toggleIAPause();
};
```

### toggleIAPause
```tsx
const toggleIAPause = async () => {
  if (!selectedPhone || !clientStatus) return;
  const newStatus = clientStatus.atendimento_ia === 'pause' ? 'atendendo' : 'pause';
  await supabase.from('Z_ia_dados_cliente').upsert({
    telefone: selectedPhone, atendimento_ia: newStatus,
    tenant_id: selectedClienteId, updated_at: new Date().toISOString()
  });
  setClientStatus({ ...clientStatus, atendimento_ia: newStatus });
};
```

### checkInstancesStatus (polling de conexão)
```tsx
const checkInstancesStatus = async (silent = false) => {
  const response = await evolutionFetch('/instance/fetchInstances');
  const rawData = await response.json();
  const data = Array.isArray(rawData) ? rawData : (rawData.instances || []);

  const statuses: Record<string, 'conectado'|'desconectado'> = {};
  const profiles: Record<string, string> = {};

  clientes.forEach(client => {
    if (!client.instance_name) return;
    const instance = data.find((i: any) =>
      i.name === client.instance_name || i.instanceName === client.instance_name
    );
    const state = (instance?.connectionStatus || instance?.status || '').toLowerCase();
    const isConnected = ['open','connected','conectado'].includes(state);
    statuses[client.id] = isConnected ? 'conectado' : 'desconectado';
    if (isConnected && instance?.profilePictureUrl)
      profiles[client.id] = instance.profilePictureUrl;
  });

  setInstanceStatuses(statuses);
  setInstanceProfiles(profiles);
};
```

### saveAISettings (upsert configurações da IA)
```tsx
const saveAISettings = async (isNotificar = false) => {
  const { error } = await supabase.from('z_bd_configuracoes_ia').upsert({
    cliente_id: selectedClienteId,
    nome_agente: aiSettings.nomeAgente,
    nome_empresa: aiSettings.nomeEmpresa,
    saudacao: aiSettings.saudacao,
    objetivo: aiSettings.objetivo,
    tipo_conversao: aiSettings.tipoConversao,
    papel_humano: aiSettings.papelHumano,
    restricoes: aiSettings.restricoes,
    perguntas_qualificacao: aiSettings.perguntasQualificacao,
    notificar_em: aiSettings.notificarEm,
    google_calendar_name: aiSettings.googleCalendarName,
    updated_at: new Date().toISOString()
  }, { onConflict: 'cliente_id' });

  if (!error) addToast(isNotificar ? 'Notificação salva!' : 'Configurações salvas!', 'success');
};
```

### Real-time chat subscription
```tsx
useEffect(() => {
  if (!selectedPhone) return;
  const channel = supabase.channel(`chat-${selectedPhone}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public',
      table: 'Z_ia_chat_messages',
      filter: `phone=eq.${selectedPhone}`
    }, (payload) => setMessages(prev => [...prev, payload.new as ChatMessage]))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [selectedPhone]);
```

---

## Estrutura de Rotas (view state machine)

```
/                     → view='home'          → Lista de Clientes
/                     → view='client-hub'    → Hub do Cliente (⚙️ Config | 💬 Chat | 📦 Produtos)
/                     → view='config'        → Config: Status WhatsApp + Ajustes IA
/                     → view='conversas'     → Monitor Chat + Dashboard Métricas
/                     → view='inventory'     → Tabela de Produtos + Modal CRUD
/qrcodegen/:instance  → QRCodeGenPage       → Página pública de conexão WhatsApp
```

---

## Mapeamento Objetivo → Tipo de Conversão (Config IA)

```tsx
const conversaoOptions: Record<string, string[]> = {
  'Agendar Reunião':      ['Videochamada', 'Visita Presencial', 'Ligação Telefônica'],
  'Venda Direta':         ['Link de Pagamento', 'Transferência PIX', 'Falar com Vendedor'],
  'Suporte Técnico':      ['Qualificação e Abertura de Chamado', 'Base de Conhecimento', 'Falar com Especialista'],
  'Qualificação Profunda':['Formulário de Qualificação', 'Encaminhar para SDR', 'Score de Lead']
};
// Ao mudar objetivo, auto-seleciona o primeiro tipo de conversão disponível
```

---

## Design System (index.css — tokens principais)

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --bg-dark: #121212;
  --bg-panel: rgba(24, 24, 27, 0.7);
  --border-color: rgba(255, 255, 255, 0.08);
  --text-primary: #ededed;
  --text-secondary: #a1a1aa;
  --accent-color: #6366f1;
  --accent-hover: #4f46e5;
  --danger: #ef4444;
  --success: #10b981;
  --button-radius: 8px;
  --panel-radius: 16px;
}

body {
  font-family: 'Outfit', sans-serif;
  background-color: var(--bg-dark);
  background-image:
    radial-gradient(at 0% 0%, hsla(0,0%,15%,1) 0, transparent 50%),
    radial-gradient(at 50% 0%, hsla(0,0%,5%,0.5) 0, transparent 50%);
  background-attachment: fixed;
}

/* Glassmorphism */
.glass-panel {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--panel-radius);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
}

/* Layout */
.layout-wrapper { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 260px; background: rgba(18,18,18,0.85); border-right: 1px solid var(--border-color); padding: 2.5rem 1.5rem; }
.main-content { flex: 1; padding: 2.5rem 3rem; overflow-y: auto; }

/* Botões */
.btn-primary { background: var(--accent-color); color: white; box-shadow: 0 4px 14px rgba(99,102,241,0.39); }
.btn-primary:hover { background: var(--accent-hover); transform: translateY(-2px); }
.btn-outline { background: transparent; color: var(--text-primary); border: 1px solid var(--border-color); }

/* Badges de Estoque */
.stock-high { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
.stock-low  { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
.stock-out  { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }

/* IA Badge */
.badge-ia.atendendo { background: rgba(16,185,129,0.1); color: #10b981; }
.badge-ia.pause     { background: rgba(239,68,68,0.1);  color: #ef4444; }

/* Animações */
@keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp   { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
@keyframes slideInLeft  { from { transform: translateX(-50px); opacity:0; } to { transform: translateX(0); opacity:1; } }
@keyframes slideInRight { from { transform: translateX(50px); opacity:0; }  to { transform: translateX(0); opacity:1; } }
```

---

## Webhooks necessários (n8n ou backend próprio)

| Webhook                              | Quando é chamado                          | Payload esperado                          |
|--------------------------------------|-------------------------------------------|-------------------------------------------|
| `POST /webhook/gerar-instancia`      | Ao criar novo cliente                     | `{ instance, events[], webhook_url }`     |
| `POST /webhook/atualizar-qr-code`    | Ao gerar QR Code de conexão               | `{ instance }`                            |
| `POST /webhook/desconecta-instancia` | Ao desconectar WhatsApp                   | `{ instance }`                            |
| `POST /webhook/recebe-msg`           | Recebido pelo WhatsApp (n8n processa)     | Payload padrão Evolution API              |
| `POST /webhook/rag-disponibilidades` | Após salvar produto (gera embedding)      | `[{ body: { record, type } }]`            |
| `POST /webhook/scrape-produtos`      | Ao importar catálogo de site              | `{ url, tenant_id }`                      |

---

## Fluxo de Autenticação

```tsx
// 1. Verifica sessão ativa na inicialização
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user?.email) { setUserEmail(session.user.email); setIsLoggedIn(true); }
  setIsLoadingAuth(false);
});

// 2. Escuta mudanças de auth (login/logout em outra aba)
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user?.email) { setUserEmail(session.user.email); setIsLoggedIn(true); }
  else { setIsLoggedIn(false); }
});

// 3. Login
await supabase.auth.signInWithPassword({ email, password });

// 4. Logout
await supabase.auth.signOut();
```

---

## QR Code de Conexão (Rota Pública)

- URL: `/qrcodegen/:instanceName`
- Detectar no App.tsx antes de qualquer outro render:

```tsx
const isQRCodeGen = window.location.pathname.startsWith('/qrcodegen/');
const qrInstanceFromUrl = isQRCodeGen ? window.location.pathname.split('/').pop() : null;
if (isQRCodeGen && qrInstanceFromUrl) return <QRCodeGenPage instanceName={decodeURIComponent(qrInstanceFromUrl)} />;
```

- O QR Code expira em 30 segundos (countdown com `setInterval`).
- Pode retornar `image/octet-stream` (blob) ou JSON com campo `base64`/`qrcode`.

---

## Dashboard de Métricas (Conversas)

Dados calculados no frontend a partir de `Z_ia_chat_messages`:
- **Total Leads**: `new Set(messages.map(m => m.phone)).size`
- **Taxa Resposta**: `(phones com user_message / phones com bot_message) * 100`
- **Agendamentos**: linhas em `Z_ia_dados_cliente` com `agenda_check` preenchido
- **Gráfico**: AreaChart (Recharts) com `iniciadas` vs `respondidas` por dia

---

## Checklist de Replicação

- [ ] Criar projeto Vite + React + TypeScript
- [ ] Instalar: `@supabase/supabase-js recharts lucide-react`
- [ ] Configurar `.env` com Supabase e Evolution API
- [ ] Executar SQL completo no Supabase (tabelas + storage policies)
- [ ] Criar `api/evolution.js` serverless e `vercel.json`
- [ ] Copiar `index.css` com design system completo
- [ ] Implementar `Auth.tsx` com split-panel (esquerda = features, direita = form)
- [ ] Implementar `App.tsx` como state machine de views
- [ ] Configurar webhooks n8n para: instâncias, QR, mensagens, RAG embeddings
- [ ] Criar função RPC no Supabase para busca vetorial filtrada por `tenant_id`

---

---

## Curadoria RAG (Ensinar IA via Chat)

Esta funcionalidade permite que o operador extraia conhecimento diretamente de conversas reais para alimentar o cérebro da IA.

### Fluxo de Implementação:
1.  **Botão de Ação**: Adicionar um botão (ícone `Zap`) nas bolhas de mensagem do usuário (lado esquerdo).
2.  **Modal de Edição**: Ao clicar, abrir um modal pré-preenchido com a mensagem do cliente e a resposta que a IA deu.
3.  **Salvamento Atômico**: O operador revisa a "Resposta Ideal" e salva diretamente na tabela `z_atendimento_conhecimento`.

### Código de Salvamento:
```tsx
const saveTeaching = async () => {
  const ragContent = `DÚVIDA/OBJEÇÃO: ${objection} | RESPOSTA IDEAL: ${answer}`;
  const { error } = await supabase
    .from('z_atendimento_conhecimento')
    .insert([{
      content: ragContent,
      metadata: { id_ref: `teach_${Date.now()}`, source: 'curadoria_chat', tipo: 'objecao' },
      tenant_id: selectedClienteId
    }]);
};
```

---

## Nota sobre RAG e Embeddings

O frontend **nunca gera embeddings diretamente**. O fluxo é:

1. Frontend salva `content` + `metadata` em `z_atendimento_conhecimento` (sem `embedding`)
2. Dispara webhook → n8n recebe o registro
3. n8n chama OpenAI `text-embedding-3-small` ou `ada-002`
4. n8n faz `UPDATE z_atendimento_conhecimento SET embedding = [...] WHERE id = X`
5. A IA consulta via `match_documents` RPC (busca vetorial filtrada por `tenant_id`)

Nunca use `UPDATE` nos registros RAG: sempre **DELETE + INSERT** para evitar lixo semântico.
