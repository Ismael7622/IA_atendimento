import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { buildN8nSandboxPrompt } from './sandbox/n8nPromptMirror';
import { buildLocalRagDecision } from './sandbox/n8nRagMirror';
import type { N8nRagDecision } from './sandbox/n8nRagMirror';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  LayoutDashboard, MessageSquare,
  Trash2, LogOut, Plus, ArrowRight, ArrowLeft, User, Mail, Phone, Settings, Package,
  CheckCircle2, Globe, RefreshCw,
  Copy, Shield, Zap, Smartphone, HelpCircle, X, MoreVertical
} from 'lucide-react';

const WEBHOOK_BASE = import.meta.env.DEV ? '/webhook-api' : 'https://webhook.storyallday.com';

// --- COMPONENTE DA PÃGINA EXTERNA DE QR CODE ---
const QRCodeGenPage = ({ instanceName }: { instanceName: string }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const fetchQRCode = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      const response = await fetch(`${WEBHOOK_BASE}/webhook/atualizar-qr-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance: instanceName })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && (contentType.includes("image") || contentType.includes("octet-stream"))) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setQrCode(url);
        startTimer();
      } else {
        const data = await response.json();
        const code = data.qrcode || data.base64 || data.code || (typeof data === 'string' ? data : null);
        if (code) {
          setQrCode(code);
          startTimer();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar QR Code. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setTimeLeft(30);
  };

  useEffect(() => {
    let timer: any;
    if (qrCode && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setQrCode(null);
    }
    return () => clearInterval(timer);
  }, [qrCode, timeLeft]);

  return (
    <div className="login-container" style={{
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, #1e1b4b, #09090b)',
      padding: '2rem'
    }}>
      <div className="text-center mb-10" style={{ animation: 'fadeIn 0.8s ease' }}>
        <div style={{
          width: '80px', height: '80px', background: 'var(--accent-color)',
          borderRadius: '24px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 2rem',
          boxShadow: '0 12px 32px rgba(99, 102, 241, 0.4)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)' }}></div>
          <Smartphone size={40} color="white" />
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white', letterSpacing: '-0.02em' }}>
          Conectar WhatsApp
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          InstÃ¢ncia: <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{instanceName}</span>
        </p>
      </div>

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem',
        borderRadius: '32px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem 0.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Zap size={24} color="var(--accent-color)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>RÃ¡pido</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem 0.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Shield size={24} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Seguro</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem 0.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CheckCircle2 size={24} color="#6366f1" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Simples</p>
          </div>
        </div>

        {!qrCode && !loading ? (
          <button className="btn-primary" style={{ width: '100%', padding: '1.5rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700 }} onClick={fetchQRCode}>
            ComeÃ§ar ConexÃ£o
          </button>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner" style={{ width: '48px', height: '48px', marginBottom: '1.5rem', borderTopColor: 'var(--accent-color)' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Sincronizando com Evolution API...</p>
          </div>
        ) : (
          <div style={{ animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{
              padding: '16px', background: 'white', borderRadius: '24px',
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
              border: '4px solid rgba(99, 102, 241, 0.1)',
              marginBottom: '2rem',
              position: 'relative'
            }}>
              <img src={qrCode!} alt="QR Code" style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.05)', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</div>
                <p style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 500 }}>Abra o WhatsApp no celular</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>2</div>
                <p style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 500 }}>VÃ¡ em ConfiguraÃ§Ãµes &gt; Aparelhos</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>3</div>
                <p style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 500 }}>Escaneie este cÃ³digo QR</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <RefreshCw size={16} className="spin-slow" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>O cÃ³digo expira em {timeLeft} segundos</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <button className="btn-outline" style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)' }} onClick={() => window.open('https://storyallday.com', '_blank')}>
          <HelpCircle size={20} /> Precisa de suporte tÃ©cnico?
        </button>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.8 }}>
          <Shield size={14} color="#10b981" /> Protocolo de seguranÃ§a ponta-a-ponta Evolution API
        </p>
      </div>

      <style>{`
        .spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

type Produto = {
  id: string;
  clienteId: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  imagemUrl?: string;
  tipo: 'produto' | 'servico';
};

type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  instance_name?: string;
  created_at?: string;
  user_id?: string;
};

type Toast = { id: string; message: string; type: 'warning' | 'success' };

type ChatMessage = {
  id: string;
  tenant_id: string;
  phone: string;
  nomewpp?: string;
  user_message?: string;
  bot_message?: string;
  created_at: string;
};

type ClientStatus = {
  telefone: string;
  atendimento_ia: 'atendendo' | 'pause';
  agenda_check?: string;
  situacaofollow?: string;
  uf?: string;
  tenant_id?: string;
};

const conversaoOptions: Record<string, string[]> = {
  'Agendamento':          ['Videochamada', 'Visita Presencial', 'LigaÃ§Ã£o TelefÃ´nica', 'Agendamento de ServiÃ§o'],
  'Venda Direta':         ['Link de Pagamento', 'TransferÃªncia PIX', 'Falar com Vendedor'],
  'Suporte TÃ©cnico':      ['QualificaÃ§Ã£o e Abertura de Chamado', 'Base de Conhecimento', 'Falar com Especialista'],
  'QualificaÃ§Ã£o Profunda':['FormulÃ¡rio de QualificaÃ§Ã£o', 'Encaminhar para SDR', 'Score de Lead']
};

export default function App() {
  // DetecÃ§Ã£o de Rota Externa para QR Code
  const isQRCodeGen = window.location.pathname.startsWith('/qrcodegen/');
  const qrInstanceFromUrl = isQRCodeGen ? window.location.pathname.split('/').pop() : null;

  if (isQRCodeGen && qrInstanceFromUrl) {
    return <QRCodeGenPage instanceName={decodeURIComponent(qrInstanceFromUrl)} />;
  }

  // --- STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [view, setView] = useState<'home' | 'client-hub' | 'inventory' | 'conversas' | 'config'>('home');
  const [isLoading, setIsLoading] = useState(false);

  // Clientes State
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const selectedCliente = useMemo(() =>
    clientes.find(c => c.id === selectedClienteId),
    [clientes, selectedClienteId]
  );

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formState, setFormState] = useState<Partial<Produto>>({ nome: '', descricao: '', preco: 0, estoque: 0, tipo: 'produto' });

  // Chat Monitor State
  const [contacts, setContacts] = useState<{ phone: string, nomewpp: string, last_msg: string, time: string, unread?: boolean }[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clientStatus, setClientStatus] = useState<ClientStatus | null>(null);
  const [manualMsg, setManualMsg] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [conversasSubView, setConversasSubView] = useState<'chat' | 'dashboard'>('chat');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Curadoria/RAG State
  const [showTeachingModal, setShowTeachingModal] = useState(false);
  const [teachingData, setTeachingData] = useState({ objection: '', answer: '', messageId: '' });
  const [taughtMessageIds, setTaughtMessageIds] = useState<string[]>([]);

  // InstÃ¢ncias/Evolution State
  const [instanceStatuses, setInstanceStatuses] = useState<Record<string, 'conectado' | 'desconectado'>>({});
  const [instanceProfiles, setInstanceProfiles] = useState<Record<string, string>>({});
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(30);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Scraping State
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([]);

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    nomeAgente: '', nomeEmpresa: '', saudacao: '', objetivo: 'Agendamento', tipoConversao: 'Videochamada',
    papelHumano: '', restricoes: [] as string[], perguntasQualificacao: [] as { text: string, required: boolean }[],
    notificarEm: '', googleCalendarName: ''
  });
  const [novaRestricao, setNovaRestricao] = useState('');
  const [novaPergunta, setNovaPergunta] = useState('');
  const [isSavingAI, setIsSavingAI] = useState(false);
  const [showSuccessAI, setShowSuccessAI] = useState(false);
  const [isSavingNotificar, setIsSavingNotificar] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [isFetchingGroups, setIsFetchingGroups] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  // Internal Sandbox (Training Chat) State
  const [showTrainingChat, setShowTrainingChat] = useState(false);
  const [trainingMessages, setTrainingMessages] = useState<any[]>([]);
  const [trainingInput, setTrainingInput] = useState('');
  const [isTrainingLoading, setIsTrainingLoading] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState('');

  // Client Form
  const [clientForm, setClientForm] = useState<{nome: string, email: string, telefone: string}>({ nome: '', email: '', telefone: '' });

  // --- EFFECTS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsLoggedIn(true);
      }
      setIsLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsLoggedIn(true);
      } else {
        setUserEmail('');
        setIsLoggedIn(false);
      }
      setIsLoadingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchClientes();
  }, [isLoggedIn]);

  useEffect(() => {
    if (view === 'inventory' && selectedClienteId) fetchProdutos();
    if (view === 'conversas' && selectedClienteId) {
      fetchContacts();
      fetchDashboardData();
    }
    if (view === 'config' && selectedClienteId) {
      setQrCode(null);
      checkInstancesStatus();
      fetchAISettings();
    }
  }, [selectedClienteId, view]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (showTrainingChat && selectedClienteId) {
      // Chat de treinamento agora Ã© apenas em memÃ³ria
      if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showTrainingChat, trainingMessages]);

  useEffect(() => {
    if (view === 'conversas' && selectedPhone) {
      fetchMessages();
      fetchClientStatus();
      setContacts(prev => prev.map(c => c.phone === selectedPhone ? { ...c, unread: false } : c));

      const channel = supabase
        .channel(`chat-${selectedPhone}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'z_ia_chat_messages', filter: `phone=eq.${selectedPhone}` },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMsg]);
            setContacts(prev => prev.map(c => c.phone === selectedPhone ? {
              ...c,
              last_msg: newMsg.user_message || newMsg.bot_message || c.last_msg,
              time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : c));
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedPhone, view]);

  useEffect(() => {
    let timer: any;
    if (qrCode && qrTimeLeft > 0 && view === 'config') {
      timer = setInterval(() => setQrTimeLeft(prev => prev - 1), 1000);
    } else if (qrTimeLeft === 0) {
      setQrCode(null);
    }
    return () => clearInterval(timer);
  }, [qrCode, qrTimeLeft, view]);

  // --- FUNCTIONS ---
  const evolutionFetch = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      if (import.meta.env.DEV) {
        const baseUrl = import.meta.env.VITE_EVOLUTION_URL || "https://api.storyallday.com";
        const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: { "apikey": apiKey || "", "Content-Type": "application/json" },
          body: method !== 'GET' ? JSON.stringify(body) : undefined
        });
        return response;
      } else {
        const response = await fetch('/api/evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, method, body })
        });
        return response;
      }
    } catch (err) {
      console.error('Erro no evolutionFetch:', err);
      throw err;
    }
  };

  const addToast = (message: string, type: 'warning' | 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const fetchClientes = async () => {
    if (!userEmail) return;
    setIsLoadingClientes(true);
    const { data, error } = await supabase
      .from('z_bd_atendimento_clientes')
      .select('*')
      .eq('user_id', userEmail)
      .order('nome', { ascending: true });
    if (error) {
      console.error(error);
      setIsLoadingClientes(false);
      return;
    }
    setClientes(data || []);
    setIsLoadingClientes(false);
  };

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from('z_bd_produtos')
      .select('*')
      .eq('tenant_id', selectedClienteId);
    if (error) return console.error(error);
    if (data) {
      setProdutos(data.map(dbItem => ({
        id: dbItem.id, clienteId: dbItem.tenant_id, nome: dbItem.nome,
        descricao: dbItem.descricao, preco: Number(dbItem.preco),
        estoque: Number(dbItem.estoque), imagemUrl: dbItem.imagem_url,
        tipo: dbItem.tipo
      })));
    }
  };

  const fetchContacts = useCallback(async () => {
    if (!selectedClienteId) return;
    setIsLoadingChat(true);
    const { data: chats, error: chatsError } = await supabase
      .from('z_ia_chats')
      .select('phone, updated_at')
      .eq('tenant_id', selectedClienteId)
      .order('updated_at', { ascending: false });

    if (chatsError) {
      setIsLoadingChat(false);
      return;
    }

    const { data: messages } = await supabase
      .from('z_ia_chat_messages')
      .select('phone, nomewpp, user_message, bot_message, created_at')
      .eq('tenant_id', selectedClienteId)
      .order('created_at', { ascending: false })
      .limit(1000);

    const unique: any[] = [];
    chats?.forEach(chat => {
      const lastMsg = messages?.find(m => m.phone === chat.phone);
      unique.push({
        phone: chat.phone,
        nomewpp: lastMsg?.nomewpp || 'Cliente',
        last_msg: lastMsg?.bot_message || lastMsg?.user_message || 'Iniciando conversa...',
        time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                     new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });
    setContacts(unique);
    setIsLoadingChat(false);
  }, [selectedClienteId]);

  const fetchMessages = async () => {
    if (!selectedPhone) return;
    const { data } = await supabase
      .from('z_ia_chat_messages')
      .select('*')
      .eq('phone', selectedPhone)
      .eq('tenant_id', selectedClienteId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Busca quais dessas mensagens jÃ¡ foram ensinadas no RAG
      const { data: taught } = await supabase
        .from('z_atendimento_conhecimento')
        .select('metadata')
        .eq('metadata->>tenant_id', selectedClienteId)
        .eq('metadata->>source', 'curadoria_chat');

      if (taught) {
        const ids = taught.map((t: any) => t.metadata.id_ref).filter(Boolean);
        setTaughtMessageIds(ids);
      }
    }
  };

  const fetchClientStatus = async () => {
    if (!selectedPhone) return;
    const { data } = await supabase
      .from('z_ia_dados_cliente')
      .select('*')
      .eq('telefone', selectedPhone)
      .single();
    if (data) setClientStatus(data);
    else setClientStatus({ telefone: selectedPhone, atendimento_ia: 'atendendo', tenant_id: selectedClienteId } as any);
  };

  const toggleIAPause = async () => {
    if (!selectedPhone || !clientStatus) return;
    const newStatus = clientStatus.atendimento_ia === 'pause' ? 'atendendo' : 'pause';
    const { error } = await supabase
      .from('z_ia_dados_cliente')
      .upsert({
        telefone: selectedPhone, atendimento_ia: newStatus,
        tenant_id: selectedClienteId, updated_at: new Date().toISOString()
      });
    if (!error) setClientStatus({ ...clientStatus, atendimento_ia: newStatus });
  };

  const sendManualMessage = async () => {
    if (!manualMsg || !selectedPhone) return;
    const { error } = await supabase
      .from('z_ia_chat_messages')
      .insert([{
        tenant_id: selectedClienteId, phone: selectedPhone,
        bot_message: manualMsg, nomewpp: contacts.find(c => c.phone === selectedPhone)?.nomewpp
      }]);
    if (!error) {
      setManualMsg('');
      if (clientStatus?.atendimento_ia !== 'pause') toggleIAPause();
    }
  };

  const saveTeaching = async () => {
    if (!teachingData.objection || !teachingData.answer) return;
    setIsLoading(true);

    // Garantir que o id_ref seja uma string Ãºnica
    const idRef = (teachingData.messageId || `teach_${Date.now()}`).toString();
    const ragContent = `DÃšVIDA/OBJEÃ‡ÃƒO: ${teachingData.objection} | RESPOSTA IDEAL: ${teachingData.answer}`;

    // Metadata limpo conforme o guia, sem duplicar o tenant_id que jÃ¡ vai no topo
    const ragMetadata = {
      id_ref: idRef,
      tenant_id: selectedClienteId,
      source: 'curadoria_chat',
      tipo: 'objecao'
    };

    const { data: ragData, error } = await supabase
      .from('z_atendimento_conhecimento')
      .insert([{
        content: ragContent,
        metadata: ragMetadata
      }])
      .select().single();

    if (error) {
      console.error('Erro ao salvar no RAG:', error);
      alert(`Erro ao salvar ensinamento: ${error.message}`);
    } else {
      // Gatilho do webhook de embedding
      fetch(`${WEBHOOK_BASE}/webhook/rag-disponibilidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          body: { record: ragData, type: 'INSERT' }
        }])
      }).catch(err => console.error('Erro no Webhook:', err));

      setTaughtMessageIds(prev => [...prev, idRef]);
      setShowTeachingModal(false);
      setTeachingData({ objection: '', answer: '', messageId: '' });
      addToast('IA ensinada com sucesso!', 'success');
    }
    setIsLoading(false);
  };

  const fetchDashboardData = async () => {
    const { data: messages, error: mError } = await supabase
      .from('z_ia_chat_messages')
      .select('phone, user_message, bot_message, created_at')
      .eq('tenant_id', selectedClienteId);

    const { data: statuses, error: sError } = await supabase
      .from('z_ia_dados_cliente')
      .select('telefone, agenda_check')
      .eq('tenant_id', selectedClienteId);

    if (mError || sError) return;
    const phones = new Set(messages.map(m => m.phone));
    const respondidas = new Set(messages.filter(m => m.user_message).map(m => m.phone));
    const iniciadas = new Set(messages.filter(m => m.bot_message).map(m => m.phone));
    const agendamentos = statuses?.filter(s => s.agenda_check).length || 0;

    const daily: any = {};
    messages.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString();
      if (!daily[date]) daily[date] = { date, iniciadas: 0, respondidas: 0 };
      if (m.bot_message) daily[date].iniciadas++;
      if (m.user_message) daily[date].respondidas++;
    });

    setDashboardData({
      totalConversas: phones.size,
      taxaResposta: iniciadas.size > 0 ? (respondidas.size / iniciadas.size) * 100 : 0,
      agendamentos,
      chartData: Object.values(daily).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    });
  };

  const checkInstancesStatus = async () => {
    try {
      const response = await evolutionFetch('/instance/fetchInstances');
      const rawData = await response.json();
      const data = Array.isArray(rawData) ? rawData : (rawData.instances || []);
      const statuses: Record<string, 'conectado' | 'desconectado'> = {};
      const profiles: Record<string, string> = {};

      clientes.forEach(client => {
        if (!client.instance_name) return;
        const instance = data.find((i: any) => i.name === client.instance_name || i.instanceName === client.instance_name);
        const state = (instance?.connectionStatus || instance?.status || instance?.instance?.state || "").toLowerCase();
        const isConnected = state === 'open' || state === 'connected' || state === 'conectado';
        statuses[client.id] = isConnected ? 'conectado' : 'desconectado';
        if (isConnected && instance?.profilePictureUrl) profiles[client.id] = instance.profilePictureUrl;
      });
      setInstanceStatuses(statuses);
      setInstanceProfiles(profiles);
    } catch (err) {
      console.error(err);
    }
  };

  const checkInstanceStatus = async (clientId: string, instanceName: string) => {
    if (!instanceName) return;
    try {
      const res = await evolutionFetch(`/instance/connectionState/${instanceName}`);
      const data = await res.json();
      const state = (data.instance?.state || data.state || "").toLowerCase();
      const isConnected = state === 'open' || state === 'connected' || state === 'conectado';
      setInstanceStatuses(prev => ({ ...prev, [clientId]: isConnected ? 'conectado' : 'desconectado' }));
    } catch (err) { console.error(err); }
  };

  const saveAISettings = async (isNotificar = false) => {
    if (!selectedClienteId) return;
    if (isNotificar) setIsSavingNotificar(true); else setIsSavingAI(true);
    const dbPayload = {
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
    };
    const { error } = await supabase.from('z_bd_configuracoes_ia').upsert(dbPayload, { onConflict: 'cliente_id' });
    if (isNotificar) setIsSavingNotificar(false); else setIsSavingAI(false);
    if (!error) {
      addToast("Salvo com sucesso!", 'success');
      if (!isNotificar) { setShowSuccessAI(true); setTimeout(() => setShowSuccessAI(false), 3000); }
    }
  };

  const fetchAISettings = async () => {
    if (!selectedClienteId) return;
    const { data } = await supabase.from('z_bd_configuracoes_ia').select('*').eq('cliente_id', selectedClienteId).single();
    if (data) {
      setAiSettings({
        nomeAgente: data.nome_agente || '', nomeEmpresa: data.nome_empresa || '',
        saudacao: data.saudacao || '', objetivo: data.objetivo || 'Agendar ReuniÃ£o',
        tipoConversao: data.tipo_conversao || 'Videochamada', papelHumano: data.papel_humano || '',
        restricoes: data.restricoes || [], perguntasQualificacao: data.perguntas_qualificacao || [],
        notificarEm: data.notificar_em || '', googleCalendarName: data.google_calendar_name || ''
      });
    }
  };

  const disconnectInstance = async () => {
    if (!selectedCliente?.instance_name) return;
    setIsDisconnecting(true);
    try {
      const response = await fetch(`${WEBHOOK_BASE}/webhook/desconecta-instancia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance: selectedCliente.instance_name })
      });
      if (response.ok) {
        addToast("DesconexÃ£o enviada!", "success");
        setTimeout(() => {
          checkInstanceStatus(selectedClienteId, selectedCliente.instance_name!);
          setIsDisconnecting(false);
        }, 3000);
      } else { setIsDisconnecting(false); }
    } catch (err) { setIsDisconnecting(false); }
  };

  const fetchGroups = async () => {
    if (!selectedCliente?.instance_name) return;
    setIsFetchingGroups(true);
    setShowGroups(true);
    try {
      const data = await evolutionFetch(`group/fetchAllGroups/${selectedCliente.instance_name}?getParticipants=false`);
      setAvailableGroups(Array.isArray(data) ? data : []);
    } catch (err) { setIsFetchingGroups(false); } finally { setIsFetchingGroups(false); }
  };

  // --- INTERNAL SANDBOX LOGIC (Mirrors n8n "ajuste prompt" node) ---
  const buildFullSystemPrompt = (ragContext: string | N8nRagDecision) => {
    if (typeof ragContext !== 'string') {
      return buildN8nSandboxPrompt({
        settings: aiSettings,
        ragDecision: ragContext,
        sandboxTenantId: selectedClienteId
      });
    }

    const normalizarTexto = (valor: string) => {
      return String(valor || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toUpperCase();
    };

    // Dados dinÃ¢micos simulando o nÃ³ do n8n
    const objetivo = aiSettings.objetivo;
    const tipoConversao = aiSettings.tipoConversao;
    const googleCalendarName = aiSettings.googleCalendarName || 'primary';
    const nomeCliente = 'Sandbox Interna';
    const telefoneCliente = `sandbox:${selectedClienteId || 'treinamento'}`;
    const idSupabase = selectedClienteId || '';

    // Datas/Horas (AmÃ©rica/Fortaleza)
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit', hour12: false });
    const horaAtual = formatter.format(agora);
    const dataHoje = agora.toISOString().split('T')[0];
    const dataHojeFormatada = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza' }).format(agora);

    // ISOs para agendamento
    const isoAgora = agora.toISOString().replace('Z', '-03:00');
    const isoFimDia = new Date(agora.setHours(23, 59, 59)).toISOString().replace('Z', '-03:00');

    const objetivoNormalizado = normalizarTexto(objetivo);
    const tipoConversaoNormalizado = normalizarTexto(tipoConversao);

    // --- BLOCOS DE OBJETIVOS ---
    const OBJETIVO_AGENDAMENTO = `## OBJETIVO: AGENDAMENTO

### PROTOCOLO DE AGENDAMENTO

Seu objetivo Ã© conduzir o cliente para um agendamento.

VocÃª deve:
1. Entender rapidamente o interesse do cliente.
2. Usar os dados que jÃ¡ possui: Nome (${nomeCliente}) e Telefone (${telefoneCliente}).
3. Consultar disponibilidade na agenda antes de sugerir horÃ¡rios.
4. Oferecer no mÃ¡ximo 2 opÃ§Ãµes de horÃ¡rio por vez.
5. Confirmar a escolha do cliente antes de criar o evento.
6. SÃ³ confirmar o agendamento depois que a ferramenta retornar sucesso ou EventId.

Regras:
- VocÃª jÃ¡ possui o telefone do cliente (${telefoneCliente}), NUNCA pergunte novamente.
- Este atendimento Ã© uma sandbox interna; mantenha o telefone exatamente como "${telefoneCliente}" e nÃ£o substitua por nÃºmero real, nÃºmero genÃ©rico ou telefone da empresa.
- NUNCA peÃ§a nenhum tipo de identificador, cÃ³digo de confirmaÃ§Ã£o ou senha ao cliente.
- vocÃª deve ter a iniciativa de dizer os horÃ¡rios disponiveis de agendamento, e nÃ£o esperar do cliente que ele escolha sem antes dar as opÃ§Ãµes
- Nunca invente horÃ¡rios.
- Nunca agende no passado.
- Nunca confirme agendamento sem usar a ferramenta de calendÃ¡rio.
- Nunca ofereÃ§a mais de 2 horÃ¡rios por mensagem.
- Se o cliente pedir outro horÃ¡rio, consulte novamente a agenda.
- Se houver restriÃ§Ã£o de dia ou horÃ¡rio, respeite as restriÃ§Ãµes listadas abaixo.

---

## ETAPA 1: VERIFICAR DISPONIBILIDADE

Quando o cliente quiser agendar:

1. CHAME a tool listar_eventos via agendamentos
   - Calendar: "${googleCalendarName}"
   - After: ${isoAgora} (hora atual se for hoje)
   - Before: ${isoFimDia} (fim do dia)
   - Para outros dias: inÃ­cio e fim daquele dia especÃ­fico

2. Se retornar [] (array vazio) = calendÃ¡rio livre, todos os horÃ¡rios disponÃ­veis.

3. Calcule os slots livres:
   - HorÃ¡rio permitido: 7h30 atÃ© 20h.
   - Remova horÃ¡rios ocupados.
   - Considere buffer de 30 minutos antes de evento jÃ¡ existente.
   - Nunca ofereÃ§a horÃ¡rio passado.

4. OfereÃ§a EXATAMENTE 2 opÃ§Ãµes:
"Prefere Ã s Xh ou Ã s Yh?"

Regras crÃ­ticas:
- PROIBIDO sugerir horÃ¡rios sem chamar listar_eventos.
- PROIBIDO sugerir horas passadas.
- Agora sÃ£o ${horaAtual}.

---

## ETAPA 2: CLIENTE ESCOLHE

Aguarde a escolha do cliente.

Depois que ele escolher, confirme de forma curta:

"Ã“timo, vou confirmar Ã s Xh!"

---

## ETAPA 3: CRIAR EVENTO

ApÃ³s confirmaÃ§Ã£o do cliente, como:
- sim
- pode
- confirma
- ok
- esse
- isso
- fechado

CHAME criar_evento via agendamentos com:

- Calendar: "${googleCalendarName}"
- Start: "${dataHoje}T[HORA_ESCOLHIDA]:00-03:00"
- End: Start + 1 hora
- Summary: "${tipoConversao} - ${nomeCliente}"
- Description: "telefone: ${telefoneCliente} \\n [adicione aqui um resumo do atendimento realizado]"

Depois:
1. AGUARDE o EventId retornado pela tool.
2. CHAME confirmar_status_agendado via agendamentos para mudar o status do cliente no banco de dados.
3. Use id do supabase : ${idSupabase}

SÃ³ depois de receber sucesso nas duas ferramentas:
- EventId do calendÃ¡rio
- confirmaÃ§Ã£o do banco de dados

Responda exatamente:

"${tipoConversao} agendado! ðŸ˜Š ${dataHojeFormatada} Ã s [hora]. Consigo tirar alguma dÃºvida atÃ© lÃ¡?"

Regras crÃ­ticas:
- PROIBIDO dizer "${tipoConversao} agendado" sem EventId da tool.
- PROIBIDO inventar que o evento foi criado.
- PROIBIDO usar data diferente de ${dataHoje} para hoje.
- PROIBIDO confirmar o agendamento se confirmar_status_agendado retornar erro ou nÃ£o for chamada.
- NUNCA peÃ§a cÃ³digo ou identificador de confirmaÃ§Ã£o.

---

# FERRAMENTAS DE AGENDAMENTO

## agendamentos MCP Client

Tools disponÃ­veis:

- listar_eventos: consulta eventos usando Calendar, After e Before em ISO 8601 com -03:00.
- criar_evento: cria evento usando Calendar, Start, End, Summary e Description.
- reagendar: atualiza evento usando eventId, start e end.
- deletar_evento: cancela evento usando eventId.

Exemplo para HOJE ${dataHoje}:

- After: "${isoAgora}"
- Before: "${isoFimDia}"
- Start Ã s 14h: "${dataHoje}T14:00:00-03:00"
- End Ã s 15h: "${dataHoje}T15:00:00-03:00"`;

    const OBJETIVO_VENDA_DIRETA = `## OBJETIVO: VENDA DIRETA

### PROTOCOLO DE VENDA DIRETA

Seu objetivo Ã© conduzir o cliente para uma compra.

VocÃª deve:
1. Entender qual produto, serviÃ§o ou plano o cliente deseja.
2. Confirmar se existe informaÃ§Ã£o suficiente no contexto/base de conhecimento.
3. Explicar o benefÃ­cio principal de forma curta.
4. Informar preÃ§o, condiÃ§Ã£o ou forma de pagamento apenas se isso estiver disponÃ­vel no contexto.
5. Conduzir para o tipo de conversÃ£o escolhido: ${tipoConversao}.

Regras:
- NÃ£o invente preÃ§o.
- NÃ£o ofereÃ§a desconto nÃ£o autorizado.
- NÃ£o prometa prazo de entrega sem informaÃ§Ã£o.
- NÃ£o diga que o pagamento foi aprovado sem confirmaÃ§Ã£o.
- Se o cliente tiver dÃºvida, responda de forma curta e volte para o fechamento.

Frase base:
"Perfeito. Pelo que vocÃª me falou, essa opÃ§Ã£o faz sentido pra vocÃª. Posso seguir com ${tipoConversao}?"

---

# FERRAMENTAS DE VENDA E PAGAMENTO

Use ferramentas de venda/pagamento quando precisar:
- consultar produto
- consultar estoque
- gerar checkout
- registrar pedido
- validar pagamento

Regras:
- Confirme produto ou serviÃ§o antes.
- NÃ£o invente link.
- NÃ£o invente Pix.
- NÃ£o confirme pagamento sem validaÃ§Ã£o.
- NÃ£o prometa entrega sem contexto.`;

    const OBJETIVO_QUALIFICACAO_PROFUNDA = `## OBJETIVO: QUALIFICAÃ‡ÃƒO PROFUNDA

### PROTOCOLO DE QUALIFICAÃ‡ÃƒO PROFUNDA

Seu objetivo Ã© coletar informaÃ§Ãµes importantes antes de encaminhar o cliente.

VocÃª deve:
1. Fazer uma pergunta por vez.
2. Priorizar perguntas obrigatÃ³rias.
3. NÃ£o transformar a conversa em interrogatÃ³rio.
4. Validar respostas vagas.
5. Ao final, resumir brevemente o perfil do cliente.
6. Encaminhar para o prÃ³ximo passo definido em ${tipoConversao}.

Regras:
- Nunca pule perguntas obrigatÃ³rias.
- Nunca faÃ§a vÃ¡rias perguntas longas na mesma mensagem.
- Nunca encerre a qualificaÃ§Ã£o se ainda faltar dado obrigatÃ³rio.
- Se o cliente nÃ£o quiser responder uma pergunta opcional, siga o fluxo.
- Se o cliente nÃ£o quiser responder uma pergunta obrigatÃ³ria, explique de forma simples por que ela Ã© necessÃ¡ria.

Frase base:
"Pra eu te direcionar melhor, preciso entender sÃ³ mais um ponto: {{PERGUNTA_FALTANTE}}"`;

    const OBJETIVO_SUPORTE_TECNICO = `## OBJETIVO: SUPORTE TÃ‰CNICO

### PROTOCOLO DE SUPORTE TÃ‰CNICO

Seu objetivo Ã© entender o problema, tentar resolver com base nas informaÃ§Ãµes disponÃ­veis e escalar quando necessÃ¡rio.

VocÃª deve:
1. Entender o problema com perguntas curtas.
2. Consultar a base de conhecimento/contexto antes de orientar.
3. Passar instruÃ§Ãµes simples, uma etapa por vez.
4. Confirmar se o cliente conseguiu resolver.
5. Se nÃ£o resolver apÃ³s 2 tentativas, encaminhar para ${tipoConversao}.

Regras:
- NÃ£o invente soluÃ§Ã£o tÃ©cnica.
- NÃ£o peÃ§a dados sensÃ­veis desnecessÃ¡rios.
- NÃ£o prometa prazo de resoluÃ§Ã£o sem informaÃ§Ã£o.
- NÃ£o diga que um humano jÃ¡ assumiu se isso nÃ£o foi acionado.
- Se for erro crÃ­tico, encaminhe para suporte humano.

Frase base:
"Entendi. Vou te orientar pelo caminho mais seguro. Primeiro, me confirma uma coisa: {{PERGUNTA_DIAGNOSTICO}}"

---

# FERRAMENTAS DE SUPORTE

Use ferramentas de suporte quando precisar:
- consultar base de conhecimento
- abrir ticket
- consultar ticket
- encaminhar para suporte humano

Regras:
- Primeiro entenda o problema.
- Depois consulte a base ou abra ticket.
- Se nÃ£o houver soluÃ§Ã£o segura, encaminhe para suporte humano.
- NÃ£o invente procedimento tÃ©cnico.`;

    // --- BLOCOS DE CONVERSÃƒO ---
    const TIPO_VIDEOCHAMADA = `## TIPO: VIDEOCHAMADA

A conversÃ£o deve ser uma videochamada.

Regras:
- A IA nÃ£o realiza a videochamada.
- A IA agenda ou encaminha para uma videochamada com ${aiSettings.papelHumano}.
- Informe que o link serÃ¡ enviado ou disponibilizado conforme o fluxo configurado.
- Se houver agenda, use a ferramenta de calendÃ¡rio.
- Confirme data e horÃ¡rio antes de criar o evento.

Frase base:
"Posso te colocar em uma videochamada rÃ¡pida com ${aiSettings.papelHumano}? Assim ele te explica certinho e tira suas dÃºvidas."`;

    const TIPO_VISITA_PRESENCIAL = `## TIPO: VISITA PRESENCIAL

A conversÃ£o deve ser uma visita presencial.

Regras:
- Confirme interesse, melhor dia e horÃ¡rio.
- Se houver endereÃ§o no contexto, informe de forma curta.
- Se nÃ£o houver endereÃ§o, diga que a equipe confirma os detalhes.
- Nunca invente localizaÃ§Ã£o.
- Se houver agenda, consulte disponibilidade antes de confirmar.

Frase base:
"Podemos agendar uma visita presencial pra vocÃª conhecer melhor. Qual perÃ­odo fica melhor pra vocÃª: manhÃ£ ou tarde?"`;

    const TIPO_AGENDAMENTO_DE_SERVICO = `## TIPO: AGENDAMENTO DE SERVIÃ‡O

A conversÃ£o deve ser o agendamento de um ou mais serviÃ§os.

O agente deve apresentar os serviÃ§os disponÃ­veis que recebeu da RAG de produtos, entender qual ou quais serviÃ§os o cliente deseja realizar e conduzir para o agendamento usando as ferramentas de calendÃ¡rio.

Regras:
- VocÃª jÃ¡ possui o telefone do cliente (${telefoneCliente}), NÃƒO pergunte novamente.
- Este atendimento Ã© uma sandbox interna; mantenha o telefone exatamente como "${telefoneCliente}" e nÃ£o substitua por nÃºmero real, nÃºmero genÃ©rico ou telefone da empresa.
- NUNCA peÃ§a nenhum tipo de identificador ou cÃ³digo de confirmaÃ§Ã£o.
- Apresente os serviÃ§os disponÃ­veis de forma curta e natural.
- Se houver lista de serviÃ§os no contexto/base de conhecimento, use somente essa lista.
- NÃ£o invente serviÃ§os que nÃ£o estejam no contexto.
- Pergunte qual ou quais serviÃ§os o cliente deseja agendar.
- Se o cliente jÃ¡ demonstrar interesse em um serviÃ§o especÃ­fico, nÃ£o reapresente toda a lista.
- Confirme o serviÃ§o escolhido antes de consultar horÃ¡rios.
- Se o cliente escolher mais de um serviÃ§o, registre todos no resumo do atendimento.
- Se houver duraÃ§Ã£o diferente por serviÃ§o no contexto, respeite essa duraÃ§Ã£o ao criar o evento.
- Se nÃ£o houver duraÃ§Ã£o especÃ­fica, use a duraÃ§Ã£o padrÃ£o de 1 hora.
- Consulte a agenda antes de sugerir horÃ¡rios.
- OfereÃ§a no mÃ¡ximo 2 opÃ§Ãµes de horÃ¡rio por vez, oferecendo sempre as disponibilidades mais prÃ³ximas do horÃ¡rio atual.
- Confirme data, horÃ¡rio e serviÃ§o antes de criar o evento.
- SÃ³ confirme o agendamento apÃ³s sucesso da ferramenta.
- NÃ£o diga que o serviÃ§o foi agendado antes da confirmaÃ§Ã£o da ferramenta.
- NÃ£o prometa preÃ§o, prazo ou disponibilidade sem informaÃ§Ã£o no contexto.

Fluxo sugerido:
1. Apresente rapidamente os serviÃ§os disponÃ­veis.
2. Pergunte qual serviÃ§o o cliente deseja agendar.
3. Confirme o serviÃ§o escolhido.
4. Consulte disponibilidade na agenda.
5. OfereÃ§a 2 horÃ¡rios livres.
6. ApÃ³s o cliente escolher, crie o evento.
7. Confirme o agendamento somente apÃ³s retorno da ferramenta.

Frase base:
"Perfeito. Qual desses serviÃ§os vocÃª quer agendar? AÃ­ eu jÃ¡ vejo os melhores horÃ¡rios pra vocÃª."

---

# FERRAMENTAS DE AGENDAMENTO DE SERVIÃ‡O

Use as mesmas ferramentas de calendÃ¡rio usadas para visita presencial, videochamada e agendamento.

Ferramentas disponÃ­veis:
- listar_eventos
- criar_evento
- reagendar
- deletar_evento

Regras:
- Sempre chame listar_eventos antes de sugerir horÃ¡rios.
- Nunca sugira horÃ¡rio passado.
- Nunca confirme agendamento sem EventId ou confirmaÃ§Ã£o de sucesso da ferramenta.
- Ao criar o evento, inclua no summary o tipo de conversÃ£o e o nome do cliente.
- Ao criar o evento, inclua na description o telefone do cliente, o serviÃ§o escolhido e um resumo curto do atendimento.
- Se o cliente escolher vÃ¡rios serviÃ§os, liste todos na description.
- Se houver ferramenta de atualizaÃ§Ã£o de status, chame apÃ³s criar o evento.
- SÃ³ responda como agendado depois que calendÃ¡rio e status forem confirmados.

Exemplo de summary:
"Agendamento de ServiÃ§o - ${nomeCliente}"

Exemplo de description:
"telefone: ${telefoneCliente} \\n serviÃ§o(s): [SERVICOS_ESCOLHIDOS] \\n resumo: [RESUMO_DO_ATENDIMENTO]"`;

    const TIPO_CHAMADA_TELEFONICA = `## TIPO: CHAMADA TELEFÃ”NICA

A conversÃ£o deve ser uma chamada telefÃ´nica.

Regras:
- A IA nÃ£o faz a ligaÃ§Ã£o.
- A IA agenda ou encaminha para que ${aiSettings.papelHumano} faÃ§a a chamada.
- Confirme nÃºmero, dia e horÃ¡rio.
- NÃ£o diga que alguÃ©m vai ligar imediatamente, a menos que isso esteja definido no contexto.

Frase base:
"Posso deixar uma chamada alinhada com ${aiSettings.papelHumano}. Qual melhor horÃ¡rio pra vocÃª falar?"`;

    const TIPO_LINK_PAGAMENTO_CHECKOUT = `## TIPO: LINK DE PAGAMENTO / CHECKOUT

A conversÃ£o deve ser o envio de um link de pagamento ou checkout.

Regras:
- SÃ³ envie link se existir no contexto ou ferramenta.
- NÃ£o invente link.
- Antes do link, confirme produto/plano/serviÃ§o escolhido.
- Informe que o pagamento deve ser feito pelo link oficial.
- Se necessÃ¡rio, peÃ§a comprovante apenas se essa for a regra do negÃ³cio.

Frase base:
"Perfeito. Posso te mandar o link de pagamento pra vocÃª finalizar com seguranÃ§a."

---

# FERRAMENTAS DE CHECKOUT

Use ferramentas de checkout quando precisar:
- gerar link de pagamento
- registrar pedido
- validar transaÃ§Ã£o

Regras:
- SÃ³ envie link se a ferramenta retornar.
- NÃ£o invente link de checkout.
- NÃ£o confirme pagamento sem validaÃ§Ã£o.`;

    const TIPO_PIX = `## TIPO: PIX

A conversÃ£o deve ser pagamento via Pix.

Regras:
- SÃ³ informe chave Pix se ela estiver disponÃ­vel no contexto.
- Nunca invente chave Pix.
- Confirme valor, produto e condiÃ§Ã£o antes de enviar.
- Oriente o cliente a enviar comprovante se essa for a regra.
- NÃ£o confirme pagamento antes de validaÃ§Ã£o.

Frase base:
"Fechado. Posso te passar os dados do Pix e, depois do comprovante, seguimos com o prÃ³ximo passo."

---

# FERRAMENTAS DE PIX

Use ferramentas de pagamento Pix quando precisar:
- gerar cobranÃ§a Pix
- consultar status do pagamento
- validar comprovante
- registrar pedido

Regras:
- SÃ³ informe chave ou QR Code Pix se estiver no contexto ou retornar da ferramenta.
- Nunca invente chave Pix.
- NÃ£o confirme pagamento sem validaÃ§Ã£o.`;

    const TIPO_FALAR_COM_VENDEDOR = `## TIPO: FALAR COM VENDEDOR

A conversÃ£o deve ser encaminhar o cliente para um vendedor humano.

Regras:
- NÃ£o diga que o vendedor vai chamar imediatamente, a menos que o sistema faÃ§a isso.
- Colete os dados obrigatÃ³rios antes de encaminhar.
- Informe que o atendimento serÃ¡ direcionado para ${aiSettings.papelHumano}.
- NÃ£o encerre de forma seca; deixe a transiÃ§Ã£o natural.

Frase base:
"Vou te direcionar para ${aiSettings.papelHumano}, que consegue te passar os detalhes finais e te ajudar a escolher a melhor opÃ§Ã£o."`;

    const TIPO_FORMULARIO_QUALIFICACAO = `## TIPO: FORMULÃRIO DE QUALIFICAÃ‡ÃƒO

A conversÃ£o deve ser preencher ou concluir uma qualificaÃ§Ã£o.

Regras:
- FaÃ§a as perguntas uma por vez.
- Priorize obrigatÃ³rias.
- Ao final, confirme que as respostas foram registradas.
- Se existir link de formulÃ¡rio, envie apenas se estiver no contexto.
- Se nÃ£o existir link, faÃ§a a qualificaÃ§Ã£o na conversa.

Frase base:
"Vou te fazer algumas perguntinhas rÃ¡pidas pra entender melhor seu perfil e te direcionar do jeito certo."`;

    const TIPO_TRANSMISSAO_PARA_CONSULTOR = `## TIPO: TRANSMISSÃƒO PARA CONSULTOR

A conversÃ£o deve ser transmitir o atendimento para um consultor humano.

Regras:
- FaÃ§a uma breve coleta de contexto antes.
- NÃ£o diga que o consultor jÃ¡ estÃ¡ online se isso nÃ£o for garantido.
- Informe que o consultor receberÃ¡ o resumo.
- NÃ£o repita todas as perguntas se jÃ¡ foram respondidas.

Frase base:
"Perfeito. Vou passar seu caso para ${aiSettings.papelHumano} com o resumo do que vocÃª me contou."`;

    const TIPO_AGENDAMENTO_DE_TRIAGEM = `## TIPO: AGENDAMENTO DE TRIAGEM

A conversÃ£o deve ser uma triagem agendada.

Regras:
- Explique que Ã© uma conversa inicial para entender o caso.
- Consulte agenda se houver ferramenta.
- Confirme dados obrigatÃ³rios antes do agendamento.
- NÃ£o prometa soluÃ§Ã£o final na triagem.

Frase base:
"Podemos marcar uma triagem rÃ¡pida pra entender seu caso e ver o melhor caminho. Qual perÃ­odo fica melhor pra vocÃª?"`;

    const TIPO_TICKET_DE_SUPORTE = `## TIPO: TICKET DE SUPORTE

A conversÃ£o deve ser abertura de ticket de suporte.

Regras:
- Colete descriÃ§Ã£o do problema.
- Colete dados obrigatÃ³rios configurados.
- Informe que o chamado serÃ¡ registrado.
- SÃ³ diga nÃºmero de ticket se a ferramenta retornar.
- NÃ£o prometa prazo sem contexto.

Frase base:
"Vou registrar isso como chamado de suporte pra equipe acompanhar certinho."

---

# FERRAMENTAS DE TICKET

Use ferramenta de ticket quando precisar:
- abrir chamado
- registrar descriÃ§Ã£o do problema
- consultar status do chamado

Regras:
- SÃ³ diga nÃºmero de ticket se a ferramenta retornar.
- NÃ£o prometa prazo sem contexto.
- NÃ£o diga que o ticket foi aberto antes do retorno da ferramenta.`;

    const TIPO_BASE_DE_CONHECIMENTO = `## TIPO: BASE DE CONHECIMENTO

A conversÃ£o deve ser orientar o cliente usando a base de conhecimento.

Regras:
- Responda somente com base no contexto/base disponÃ­vel.
- Passe instruÃ§Ãµes curtas.
- Confirme se resolveu.
- Se nÃ£o resolver apÃ³s 2 tentativas, escale para suporte humano.
- NÃ£o invente procedimento.

Frase base:
"Vou te passar o passo a passo mais seguro com base no que tenho aqui."`;

    const TIPO_FALAR_COM_SUPORTE_HUMANO = `## TIPO: FALAR COM SUPORTE HUMANO

A conversÃ£o deve ser encaminhar para suporte humano.

Regras:
- Antes de encaminhar, colete o mÃ­nimo necessÃ¡rio sobre o problema.
- Informe que o suporte humano receberÃ¡ o contexto.
- NÃ£o diga que serÃ¡ imediato, salvo se estiver no contexto.
- Se houver ferramenta de ticket, abra o chamado.

Frase base:
"Vou encaminhar vocÃª para o suporte humano com esse resumo, pra nÃ£o precisar explicar tudo de novo."`;

    const objetivosMapa: Record<string, string> = {
      'AGENDAMENTO': OBJETIVO_AGENDAMENTO,
      'AGENDAR REUNIAO': OBJETIVO_AGENDAMENTO,
      'VENDA DIRETA': OBJETIVO_VENDA_DIRETA,
      'QUALIFICACAO PROFUNDA': OBJETIVO_QUALIFICACAO_PROFUNDA,
      'SUPORTE TECNICO': OBJETIVO_SUPORTE_TECNICO,
    };

    const tiposConversaoMapa: Record<string, string> = {
      'VIDEOCHAMADA': TIPO_VIDEOCHAMADA,
      'VISITA PRESENCIAL': TIPO_VISITA_PRESENCIAL,
      'AGENDAMENTO DE SERVICO': TIPO_AGENDAMENTO_DE_SERVICO,
      'CHAMADA TELEFONICA': TIPO_CHAMADA_TELEFONICA,
      'LINK DE PAGAMENTO / CHECKOUT': TIPO_LINK_PAGAMENTO_CHECKOUT,
      'PIX': TIPO_PIX,
      'FALAR COM VENDEDOR': TIPO_FALAR_COM_VENDEDOR,
      'FORMULARIO DE QUALIFICACAO': TIPO_FORMULARIO_QUALIFICACAO,
      'TRANSMISSAO PARA CONSULTOR': TIPO_TRANSMISSAO_PARA_CONSULTOR,
      'AGENDAMENTO DE TRIAGEM': TIPO_AGENDAMENTO_DE_TRIAGEM,
      'TICKET DE SUPORTE': TIPO_TICKET_DE_SUPORTE,
      'BASE DE CONHECIMENTO': TIPO_BASE_DE_CONHECIMENTO,
      'FALAR COM SUPORTE HUMANO': TIPO_FALAR_COM_SUPORTE_HUMANO,
    };

    const objetivoPrompt = objetivosMapa[objetivoNormalizado] || '';
    const conversaoPrompt = tiposConversaoMapa[tipoConversaoNormalizado] || '';

    return `
# IDENTIDADE
VocÃª Ã© ${aiSettings.nomeAgente}, assistente da ${aiSettings.nomeEmpresa}.
SaudaÃ§Ã£o: "${aiSettings.saudacao}"

# REGRAS DE ATENDIMENTO
${objetivoPrompt}

${conversaoPrompt}

# BASE DE CONHECIMENTO (RAG)
${ragContext || 'Nenhum dado especÃ­fico encontrado.'}

# RESTRIÃ‡Ã•ES
${aiSettings.restricoes.map(r => `âŒ ${r}`).join('\n')}

# ESTILO
- Estilo WhatsApp (curto, emojis moderados).
- MÃ¡ximo 2 parÃ¡grafos.
- Uma pergunta por vez.
- Nunca invente informaÃ§Ãµes.
    `.trim();
  };

  const fetchRagContext = async (query: string): Promise<N8nRagDecision> => {
    try {
      // Busca simplificada direta no Supabase para sandbox
      const { data } = await supabase
        .from('z_atendimento_conhecimento')
        .select('content')
        .eq('metadata->>tenant_id', selectedClienteId)
        .textSearch('content', query.split(' ').join(' | '))
        .limit(14);

      return buildLocalRagDecision({
        userMessage: query,
        ragContext: data?.map(d => d.content).join('\n---\n') || '',
        perguntasQualificacao: aiSettings.perguntasQualificacao
      });
    } catch {
      return buildLocalRagDecision({
        userMessage: query,
        ragContext: '',
        perguntasQualificacao: aiSettings.perguntasQualificacao
      });
    }
  };

  const sendTrainingMessage = async () => {
    if (!trainingInput.trim() || !selectedClienteId) return;

    const msgContent = trainingInput;
    setTrainingInput('');
    setIsTrainingLoading(true);

    const userMsg = { id: Date.now().toString(), user_message: msgContent, created_at: new Date().toISOString() };
    setTrainingMessages(prev => [...prev, userMsg].slice(-20));

    try {
      const ragContext = await fetchRagContext(msgContent);
      const systemPrompt = buildFullSystemPrompt(ragContext);
      setCurrentSystemPrompt(systemPrompt);

      let aiResponseText = "";

      // 3. Chamada para a API INTERNA (Proxy Seguro)
      const response = await fetch('/api/chat-treinamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          history: trainingMessages.slice(-10),
          userMessage: msgContent
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('âŒ Erro na Sandbox:', data.error);
        throw new Error(data.error || "Erro na sandbox interna");
      }
      aiResponseText = data.output || "";

      // LÃ³gica de FragmentaÃ§Ã£o (Picote)
      const blocks = aiResponseText.split(/(?<=[.?!])\s+/).map((b: string) => b.trim()).filter((b: string) => b.length > 2);
      const finalBlocks = blocks.length > 0 ? blocks : [aiResponseText];

      for (let i = 0; i < finalBlocks.length; i++) {
        const delay = Math.min(Math.max(finalBlocks[i].length * 25, 800), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
        const botMsg = { id: Date.now().toString() + i, bot_message: finalBlocks[i], created_at: new Date().toISOString() };
        setTrainingMessages(prev => [...prev, botMsg].slice(-20));
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Erro na sandbox", "warning");
    } finally {
      setIsTrainingLoading(false);
    }
  };

  const clearTrainingChat = () => {
    if (!window.confirm("Limpar histÃ³rico da sandbox?")) return;
    setTrainingMessages([]);
    addToast("Sandbox limpa!", "success");
  };

  const saveProduct = async () => {
    if (!formState.nome) return alert("Nome obrigatÃ³rio");
    setIsUploading(true);
    let finalImageUrl = formState.imagemUrl || null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${selectedClienteId}/${fileName}`;
      const { error } = await supabase.storage.from('produtos_cliente').upload(filePath, imageFile);
      if (!error) {
        const { data: publicUrlData } = supabase.storage.from('produtos_cliente').getPublicUrl(filePath);
        finalImageUrl = publicUrlData.publicUrl;
      }
    }
    const dbPayload = {
      tenant_id: selectedClienteId, nome: formState.nome,
      descricao: formState.descricao || '', preco: formState.preco || 0,
      estoque: formState.tipo === 'servico' ? 0 : (formState.estoque || 0),
      imagem_url: finalImageUrl,
      tipo: formState.tipo || 'produto'
    };

    let savedProduct: any;
    if (editingId) {
      const { data } = await supabase.from('z_bd_produtos').update(dbPayload).eq('id', editingId).select().single();
      savedProduct = data;
    } else {
      const { data } = await supabase.from('z_bd_produtos').insert([dbPayload]).select().single();
      savedProduct = data;
    }

    if (savedProduct) {
      // SINCRONIZAÃ‡ÃƒO RAG
      await supabase.from('z_atendimento_conhecimento')
        .delete().filter('metadata->>id_ref', 'eq', savedProduct.id.toString());

      const label = savedProduct.tipo === 'servico' ? 'ServiÃ§o' : 'Produto';
      const ragContent = `${label}: ${savedProduct.nome} | DescriÃ§Ã£o: ${savedProduct.descricao} | PreÃ§o: R$${savedProduct.preco}${savedProduct.tipo === 'servico' ? ' | Disponibilidade: Sob Consulta (ServiÃ§o)' : ` | Estoque: ${savedProduct.estoque}`}`;
      const ragMetadata = {
        id_ref: savedProduct.id.toString(),
        tenant_id: selectedClienteId,
        source: `z_bd_produtos_${savedProduct.id}`,
        tipo: savedProduct.tipo || 'produto'
      };

      const { data: ragData, error: rError } = await supabase.from('z_atendimento_conhecimento')
        .insert([{
          content: ragContent,
          metadata: ragMetadata
        }]).select().single();

      if (!rError && ragData) {
        fetch(`${WEBHOOK_BASE}/webhook/rag-disponibilidades`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{
            body: { record: ragData, type: editingId ? 'UPDATE' : 'INSERT' }
          }])
        }).catch(err => console.error('Erro Webhook RAG:', err));
      }
    }

    setIsUploading(false);
    setIsModalOpen(false);
    fetchProdutos();
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este produto? Isso tambÃ©m removerÃ¡ o conhecimento da IA.")) return;

    setIsLoading(true);
    try {
      // 1. Deletar do RAG para evitar lixo semÃ¢ntico
      await supabase.from('z_atendimento_conhecimento')
        .delete().filter('metadata->>id_ref', 'eq', id.toString());

      // 2. Notificar Webhook RAG da remoÃ§Ã£o
      fetch(`${WEBHOOK_BASE}/webhook/rag-disponibilidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          body: { record: { id_ref: id }, type: 'DELETE' }
        }])
      }).catch(err => console.error('Erro Webhook RAG Delete:', err));

      // 3. Deletar o produto fÃ­sico
      const { error } = await supabase.from('z_bd_produtos').delete().eq('id', id);

      if (error) throw error;

      addToast("Produto excluÃ­do com sucesso!", "success");
      fetchProdutos();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir produto.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveClient = async () => {
    if (!clientForm.nome) return alert("Nome obrigatÃ³rio");
    const instanceName = `${userEmail}-${clientForm.nome.replace(/\s+/g, '_').toLowerCase()}`;
    const newId = 'cust_' + Date.now().toString(36);
    const { error } = await supabase.from('z_bd_atendimento_clientes').insert([{ ...clientForm, id: newId, instance_name: instanceName, user_id: userEmail }]);
    if (!error) {
      await supabase.from('z_bd_configuracoes_ia').insert([{ cliente_id: newId }]);
      fetch(`${WEBHOOK_BASE}/webhook/gerar-instancia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance: instanceName })
      });
      setClientForm({ nome: '', email: '', telefone: '' });
      setIsClientModalOpen(false);
      fetchClientes();
    }
  };

  const deleteClient = async (e: React.MouseEvent, clientId: string, clientName: string) => {
    e.stopPropagation();
    if (window.confirm(`Excluir cliente "${clientName}"?`)) {
      await supabase.from('z_bd_atendimento_clientes').delete().eq('id', clientId);
      fetchClientes();
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    setScrapedProducts([]);
    try {
      const response = await fetch(`${WEBHOOK_BASE}/webhook/scrape-produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl, tenant_id: selectedClienteId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Servidor respondeu com erro ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const rawProducts = Array.isArray(data) ? data : (data.produtos || []);

      if (rawProducts.length === 0) {
        alert("Nenhum produto encontrado neste link. O site pode estar bloqueando o acesso ou o formato Ã© incompatÃ­vel.");
        return;
      }

      const mapped = rawProducts.map((p: any) => ({
        nome: p.nome || p.title || 'Produto sem nome',
        preco: p.preco || p.price || 0,
        descricao: p.descricao || p.description || '',
        imagemUrl: p.imagemUrl || p.imagem || p.foto || p.image || '',
        selected: true
      }));

      setScrapedProducts(mapped);
    } catch (err: any) {
      console.error('Erro no Scrape:', err);
      alert(`Erro na importaÃ§Ã£o: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const importSelectedProducts = async () => {
    const productsToImport = scrapedProducts.filter(p => p.selected);
    if (productsToImport.length === 0) return;

    setIsScraping(true);
    const inserts = productsToImport.map(p => ({
      tenant_id: selectedClienteId,
      nome: p.nome,
      preco: parseFloat(p.preco) || 0,
      descricao: p.descricao || '',
      imagem_url: p.imagemUrl || '',
      estoque: 10
    }));

    const { data: newProducts, error: pError } = await supabase.from('z_bd_produtos').insert(inserts).select();

    if (!pError && newProducts) {
      // Sincronizar cada produto novo com a RAG
      for (const prod of newProducts) {
        const ragContent = `Produto: ${prod.nome} | DescriÃ§Ã£o: ${prod.descricao} | PreÃ§o: R$${prod.preco} | Estoque: ${prod.estoque}`;
        const ragMetadata = {
          id_ref: prod.id.toString(),
          tenant_id: selectedClienteId,
          source: `import_scrape_${prod.id}`,
          tipo: 'produto'
        };

        const { data: ragData } = await supabase.from('z_atendimento_conhecimento')
          .insert([{ content: ragContent, metadata: ragMetadata }]).select().single();

        if (ragData) {
          fetch(`${WEBHOOK_BASE}/webhook/rag-disponibilidades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ body: { record: ragData, type: 'INSERT' } }])
          }).catch(e => console.error(e));
        }
      }

      setIsScrapeModalOpen(false);
      fetchProdutos();
      addToast(`${newProducts.length} produtos importados e sincronizados!`, 'success');
    } else {
      alert("Erro ao importar produtos.");
    }
    setIsScraping(false);
  };

  // --- RENDERERS ---
  const renderConversasView = () => {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1>Monitor de Chat</h1>
            <p className="subtitle">GestÃ£o de conversas em tempo real</p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="view-toggle">
              <button className={`toggle-btn ${conversasSubView === 'chat' ? 'active' : ''}`} onClick={() => setConversasSubView('chat')}><MessageSquare size={16} /> Chat</button>
              <button className={`toggle-btn ${conversasSubView === 'dashboard' ? 'active' : ''}`} onClick={() => setConversasSubView('dashboard')}><LayoutDashboard size={16} /> Dashboard</button>
            </div>
            <button className="btn-outline" onClick={() => setView('client-hub')}>â† Voltar ao Hub</button>
          </div>
        </div>

        {conversasSubView === 'dashboard' ? renderDashboardView() : (
          <div className="chat-monitor-container">
            <div className="glass-panel chat-sidebar">
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <input type="text" placeholder="Buscar contato..." className="search-input" value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
              </div>
              <div className="chat-list">
                {isLoadingChat ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
                ) : contacts.filter(c => !contactSearch || c.nomewpp.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)).map(c => (
                  <div key={c.phone} className={`contact-item ${selectedPhone === c.phone ? 'active' : ''}`} onClick={() => setSelectedPhone(c.phone)}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                      {c.nomewpp.charAt(0).toUpperCase()}
                    </div>
                    <div className="contact-info"><h4><span>{c.nomewpp}</span><span style={{ fontSize: '0.65rem' }}>{c.time}</span></h4><p>{c.last_msg}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel chat-area">
              {selectedPhone ? (
                <>
                  <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                        {contacts.find(c => c.phone === selectedPhone)?.nomewpp.charAt(0).toUpperCase()}
                      </div>
                      <div><h3>{contacts.find(c => c.phone === selectedPhone)?.nomewpp}</h3><p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedPhone}</p></div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span className={`badge-ia ${clientStatus?.atendimento_ia}`}>{clientStatus?.atendimento_ia === 'atendendo' ? 'ðŸ¤– IA Ativa' : 'ðŸ‘¤ IA Pausada'}</span>
                      <button className="btn-outline" onClick={toggleIAPause}>Alternar</button>
                    </div>
                  </div>
                  <div className="chat-history">
                    {messages.map(m => (
                      <Fragment key={m.id}>
                        {m.user_message && (
                          <div className={`message-bubble message-user group ${taughtMessageIds.includes(m.id) ? 'ensinado-rag' : ''}`} style={{ position: 'relative' }}>
                            {m.user_message}
                            <span className="message-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {!taughtMessageIds.includes(m.id) && (
                              <button className="teach-btn" onClick={() => {
                                setTeachingData({ objection: m.user_message!, answer: '', messageId: m.id });
                                setShowTeachingModal(true);
                              }}><Zap size={14} /></button>
                            )}
                          </div>
                        )}
                        {m.bot_message && (
                          <div className="message-bubble message-bot">
                            {m.bot_message}
                            <span className="message-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </Fragment>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="chat-input-area">
                    <input type="text" value={manualMsg} onChange={e => setManualMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendManualMessage()} placeholder="Mensagem manual..." />
                    <button className="btn-primary" onClick={sendManualMessage}><MessageSquare size={18} /></button>
                  </div>
                </>
              ) : <div className="chat-empty"><p>Selecione uma conversa</p></div>}
            </div>
          </div>
        )}

        {showTeachingModal && (
          <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header"><h2>ðŸ§  Ensinar IA</h2><button onClick={() => setShowTeachingModal(false)}><X /></button></div>
              <div className="form-group">
                <label>ObjeÃ§Ã£o do Cliente</label>
                <textarea rows={3} value={teachingData.objection} onChange={e => setTeachingData({...teachingData, objection: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Resposta Ideal</label>
                <textarea rows={4} value={teachingData.answer} onChange={e => setTeachingData({...teachingData, answer: e.target.value})} placeholder="Como a IA deve responder?" />
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setShowTeachingModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={saveTeaching} disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar no RAG'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConfigView = () => {
    const status = instanceStatuses[selectedClienteId] || 'desconectado';

    return (
      <div className="main-content" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1>ConfiguraÃ§Ãµes do Cliente</h1>
            <p className="subtitle">Gerencie conexÃµes e parÃ¢metros da IA</p>
          </div>
          <button className="btn-outline" onClick={() => setView('client-hub')}>â† Voltar ao Hub</button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Coluna da Esquerda: Status da InstÃ¢ncia */}
          <div style={{ width: '380px', flexShrink: 0 }}>
            <div className="glass-panel metric-card" style={{
              border: `1px solid ${status === 'conectado' ? '#10b981' : '#f59e0b'}`,
              height: 'auto',
              marginBottom: '1rem'
            }}>
              <div className="metric-label">Status da InstÃ¢ncia</div>
              <div className="metric-value" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '1.8rem',
                color: status === 'conectado' ? '#10b981' : '#f59e0b',
                marginTop: '0.5rem'
              }}>
                {status === 'conectado' && instanceProfiles[selectedClienteId] ? (
                  <img
                    src={instanceProfiles[selectedClienteId]}
                    alt="WhatsApp Profile"
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981'
                    }}
                  />
                ) : (
                   status === 'conectado' ? <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></div>
                )}
                <span style={{ fontWeight: 700 }}>
                  {status === 'conectado' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>InstÃ¢ncia: <strong>{selectedCliente?.instance_name}</strong></p>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                {status === 'conectado' ? (
                  <>
                    <button
                      className="btn-outline"
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        borderColor: linkCopied ? 'var(--success)' : 'var(--border-color)',
                        color: linkCopied ? 'var(--success)' : 'var(--text-primary)'
                      }}
                      onClick={() => {
                        const link = `${window.location.origin}/qrcodegen/${selectedCliente?.instance_name}`;
                        navigator.clipboard.writeText(link);
                        setLinkCopied(true);
                        addToast("Link copiado!", "success");
                        setTimeout(() => setLinkCopied(false), 3000);
                      }}
                    >
                      {linkCopied ? <><CheckCircle2 size={16} /> Copiado</> : <><Copy size={16} /> Link</>}
                    </button>
                    <button
                      className="btn-outline"
                      onClick={disconnectInstance}
                      disabled={isDisconnecting}
                      style={{
                        flex: 1.5, borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        opacity: isDisconnecting ? 0.6 : 1
                      }}
                    >
                      {isDisconnecting ? <span className="spinner"></span> : <><LogOut size={16} /> Desconectar</>}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-outline" onClick={() => checkInstanceStatus(selectedClienteId, selectedCliente?.instance_name!)} style={{ flex: 1 }}>ðŸ”„ Atualizar</button>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (qrCode) setQrCode(null);
                        else {
                          setIsGeneratingQr(true);
                          fetch(`${WEBHOOK_BASE}/webhook/atualizar-qr-code`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ instance: selectedCliente?.instance_name })
                          }).then(async res => {
                            const contentType = res.headers.get("content-type");
                            if (contentType && (contentType.includes("image") || contentType.includes("octet-stream"))) {
                              const blob = await res.blob();
                              setQrCode(URL.createObjectURL(blob));
                              setQrTimeLeft(30);
                            }
                          }).finally(() => setIsGeneratingQr(false));
                        }
                      }}
                      disabled={isGeneratingQr}
                      style={{ flex: 1.5 }}
                    >
                      {isGeneratingQr ? <span className="spinner"></span> : (qrCode ? 'Fechar QR' : 'Gerar QR Code')}
                    </button>
                  </>
                )}
              </div>

              {qrCode && (
                <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ padding: '12px', background: 'white', borderRadius: '16px', border: '2px solid var(--accent-color)', margin: '0 auto', maxWidth: '300px' }}>
                    <img src={qrCode} alt="QR" style={{ display: 'block', width: '100%', borderRadius: '8px' }} />
                  </div>
                </div>
              )}
            </div>

            {/* NotificaÃ§Ã£o de ConversÃµes */}
            <div className="glass-panel metric-card" style={{ marginTop: '1.5rem', height: 'auto' }}>
              <div className="metric-label" style={{ marginBottom: '1rem' }}>Avisar conversÃµes em:</div>
              <input
                type="text"
                value={aiSettings.notificarEm}
                onChange={e => setAiSettings({...aiSettings, notificarEm: e.target.value})}
                placeholder="NÃºmero ou ID de Grupo"
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn-outline" onClick={() => showGroups ? setShowGroups(false) : fetchGroups()} style={{ flex: 1 }} disabled={isFetchingGroups}>
                  {isFetchingGroups ? <span className="spinner" style={{ width: '14px', height: '14px' }}></span> : (showGroups ? 'Fechar' : 'Buscar Grupos')}
                </button>
                <button className="btn-primary" onClick={() => saveAISettings(true)} disabled={isSavingNotificar} style={{ flex: 1 }}>
                  {isSavingNotificar ? <span className="spinner"></span> : 'Salvar'}
                </button>
              </div>
              {showGroups && (
                <div style={{ marginTop: '1rem', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.5rem' }}>
                  {availableGroups.map((g: any) => (
                    <div key={g.id} className="contact-item" style={{ padding: '0.5rem' }} onClick={() => { setAiSettings({...aiSettings, notificarEm: g.id}); setShowGroups(false); }}>
                      <div style={{ fontSize: '0.8rem', color: 'white' }}>{g.subject || g.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ajuste de Atendimento */}
          <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>{showTrainingChat ? 'ðŸ’¬ Chat de Treinamento' : 'ðŸ§  ConfiguraÃ§Ãµes da IA'}</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className={showTrainingChat ? "btn-outline" : "btn-primary"}
                  onClick={() => setShowTrainingChat(!showTrainingChat)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {showTrainingChat ? <><X size={16} /> Fechar Chat</> : <><MessageSquare size={16} /> Abrir Chat de Treinamento</>}
                </button>
                {!showTrainingChat && (
                  <button className="btn-primary" onClick={() => saveAISettings()} disabled={isSavingAI || showSuccessAI}>
                    {isSavingAI ? <span className="spinner"></span> : showSuccessAI ? 'Salvo!' : 'Salvar Ajustes'}
                  </button>
                )}
              </div>
            </div>

            {showTrainingChat ? (
              <div style={{ height: '600px', maxHeight: '600px', display: 'flex', marginBottom: '2rem', width: '100%' }}>
                <div className="chat-area" style={{ height: '600px', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div className="chat-header" style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>S</div>
                      <div>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Sandbox Interna</h3>
                        <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.6 }}>Testando: {aiSettings.nomeAgente}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', borderColor: showPromptPreview ? 'var(--accent-color)' : '' }} onClick={() => setShowPromptPreview(!showPromptPreview)}>
                        {showPromptPreview ? 'Esconder Prompt' : 'Ver Prompt'}
                      </button>
                      <button className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }} onClick={clearTrainingChat}>Limpar</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderTop: '1px solid var(--border-color)' }}>
                    {/* LADO ESQUERDO: CHAT */}
                    <div className="chat-history" style={{
                      flex: 1,
                      padding: '1.5rem',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem',
                      background: 'rgba(0,0,0,0.1)',
                      height: '100%'
                    }}>
                      {trainingMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.5 }}>
                          <Zap size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                          <p>Esta Ã© uma simulaÃ§Ã£o interna segura.</p>
                          <p style={{ fontSize: '0.8rem' }}>A IA pode acessar ferramentas reais agora.</p>
                        </div>
                      )}
                      {trainingMessages.map(m => (
                        <Fragment key={m.id}>
                          {m.user_message && (
                            <div className="message-bubble message-user" style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                              {m.user_message}
                              <span className="message-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                          {m.bot_message && (
                            <div className="message-bubble message-bot" style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
                              {m.bot_message}
                              <span className="message-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </Fragment>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* LADO DIREITO: PROMPT */}
                    {showPromptPreview && (
                      <div style={{
                        width: '380px',
                        background: 'rgba(0,0,0,0.4)',
                        borderLeft: '1px solid var(--border-color)',
                        padding: '1.5rem',
                        overflowY: 'auto',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        height: '100%',
                        color: '#a5b4fc'
                      }}>
                        <h4 style={{ margin: '0 0 1rem 0', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                          <Zap size={14} /> System Prompt Gerado
                        </h4>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                          {currentSystemPrompt || "Envie uma mensagem para visualizar o prompt..."}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="chat-input-area" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
                    <input
                      type="text"
                      value={trainingInput}
                      onChange={e => setTrainingInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendTrainingMessage()}
                      placeholder="Digite sua mensagem de teste..."
                      style={{ flex: 1 }}
                      disabled={isTrainingLoading}
                    />
                    <button className="btn-primary" onClick={sendTrainingMessage} disabled={isTrainingLoading || !trainingInput.trim()}>
                      {isTrainingLoading ? <span className="spinner"></span> : <MessageSquare size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Nome do Agente</label>
                  <input type="text" value={aiSettings.nomeAgente} onChange={e => setAiSettings({...aiSettings, nomeAgente: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Nome da Empresa</label>
                  <input type="text" value={aiSettings.nomeEmpresa} onChange={e => setAiSettings({...aiSettings, nomeEmpresa: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>SaudaÃ§Ã£o</label>
                  <textarea rows={2} value={aiSettings.saudacao} onChange={e => setAiSettings({...aiSettings, saudacao: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Objetivo</label>
                  <select value={aiSettings.objetivo} onChange={e => setAiSettings({...aiSettings, objetivo: e.target.value})}>
                    <option value="Agendamento">Agendamento</option>
                    <option value="Venda Direta">Venda Direta</option>
                    <option value="Suporte TÃ©cnico">Suporte TÃ©cnico</option>
                    <option value="QualificaÃ§Ã£o Profunda">QualificaÃ§Ã£o Profunda</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo de ConversÃ£o</label>
                  <select
                    value={aiSettings.tipoConversao}
                    onChange={e => setAiSettings({...aiSettings, tipoConversao: e.target.value})}
                  >
                    {(conversaoOptions[aiSettings.objetivo] || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Papel do Humano</label>
                  <input
                    type="text"
                    value={aiSettings.papelHumano}
                    onChange={e => setAiSettings({...aiSettings, papelHumano: e.target.value})}
                    placeholder="Ex: Consultor Especialista"
                  />
                </div>

                {aiSettings.objetivo === "Agendamento" && (
                  <div style={{ gridColumn: 'span 2', background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-color)' }}>Passos para conectar sua agenda:</h4>
                    <ol style={{ paddingLeft: '1.2rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0' }}>
                      <li>Compartilhe sua agenda Google com: <strong>ismael.matias7622@gmail.com</strong></li>
                      <li>Informe ao admin que compartilhou a agenda.</li>
                      <li>ApÃ³s a confirmaÃ§Ã£o do admin, siga para o passo 4.</li>
                      <li>
                        Clique em "3 pontinhos" (<MoreVertical size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />) ao lado do nome da agenda, em seguida clique em <strong>"ConfiguraÃ§Ãµes e compart."</strong>
                        <div style={{ marginTop: '0.25rem' }}>
                          <button type="button" onClick={() => setPreviewImage('/anexo3.png')} style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}>
                            veja a imagem do dado esperado clicando aqui
                          </button>
                        </div>
                      </li>
                      <li>
                        No canto esquerdo, abaixo do nome da agenda, clique em <strong>"Integrar agenda"</strong>
                        <div style={{ marginTop: '0.25rem' }}>
                          <button type="button" onClick={() => setPreviewImage('/anexo4.png')} style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}>
                            veja a imagem do dado esperado clicando aqui
                          </button>
                        </div>
                      </li>
                      <li>
                        Copie no campo abaixo o <strong>ID da agenda</strong> (primeiro campo que aparece ao entrar na tela "Integrar agenda")
                        <div style={{ marginTop: '0.25rem' }}>
                          <button type="button" onClick={() => setPreviewImage('/anexo2.png')} style={{ background: 'none', border: 'none', color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}>
                            veja a imagem do dado esperado clicando aqui
                          </button>
                        </div>
                      </li>
                    </ol>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>ID da Agenda Google</label>
                      <input type="text" value={aiSettings.googleCalendarName} onChange={e => setAiSettings({...aiSettings, googleCalendarName: e.target.value})} placeholder="Ex: c_abc123@group.calendar.google.com" />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>O que a IA NÃƒO deve fazer (RestriÃ§Ãµes)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Ex: NÃ£o dar descontos sem autorizaÃ§Ã£o"
                      value={novaRestricao}
                      onChange={e => setNovaRestricao(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && novaRestricao.trim()) {
                          setAiSettings(p => ({...p, restricoes: [...p.restricoes, novaRestricao.trim()]}));
                          setNovaRestricao('');
                        }
                      }}
                    />
                    <button className="btn-primary" onClick={() => {
                      if (novaRestricao.trim()) {
                        setAiSettings(p => ({...p, restricoes: [...p.restricoes, novaRestricao.trim()]}));
                        setNovaRestricao('');
                      }
                    }}>Add</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {aiSettings.restricoes.map((res, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>
                          <strong style={{ color: 'var(--accent-color)', marginRight: '8px' }}>{idx + 1}.</strong> {res}
                        </span>
                        <button
                          onClick={() => setAiSettings(p => ({...p, restricoes: p.restricoes.filter((_, i) => i !== idx)}))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QualificaÃ§Ã£o de Leads */}
                <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '1.5rem' }}>
                  <label>QualificaÃ§Ã£o de Leads (Perguntas que a IA deve fazer)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Ex: Qual sua disponibilidade de investimento?"
                      value={novaPergunta}
                      onChange={e => setNovaPergunta(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter' && novaPergunta.trim()) {
                          setAiSettings(p => ({...p, perguntasQualificacao: [...p.perguntasQualificacao, { text: novaPergunta.trim(), required: false }]}));
                          setNovaPergunta('');
                        }
                      }}
                    />
                    <button className="btn-primary" onClick={() => {
                      if (novaPergunta.trim()) {
                        setAiSettings(p => ({...p, perguntasQualificacao: [...p.perguntasQualificacao, { text: novaPergunta.trim(), required: false }]}));
                        setNovaPergunta('');
                      }
                    }}>Add</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {aiSettings.perguntasQualificacao.map((per, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: per.required ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        border: per.required ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-color)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>Q{idx + 1}</span>
                          <span style={{ fontSize: '0.9rem' }}>{per.text}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <button
                            className={per.required ? 'btn-primary' : 'btn-outline'}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', textTransform: 'uppercase' }}
                            onClick={() => {
                              const newPerguntas = [...aiSettings.perguntasQualificacao];
                              newPerguntas[idx].required = !newPerguntas[idx].required;
                              setAiSettings({...aiSettings, perguntasQualificacao: newPerguntas});
                            }}
                          >
                            {per.required ? 'ObrigatÃ³ria' : 'Opcional'}
                          </button>
                          <button
                            onClick={() => setAiSettings(p => ({...p, perguntasQualificacao: p.perguntasQualificacao.filter((_, i) => i !== idx)}))}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Preview de Imagem */}
        {previewImage && (
          <div className="modal-overlay" onClick={() => setPreviewImage(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '90vh', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <button onClick={() => setPreviewImage(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 80px)', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDashboardView = () => {
    if (!dashboardData) return <div className="spinner"></div>;
    return (
      <div style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="metrics-grid">
          <div className="glass-panel metric-card"><div className="metric-label">Leads</div><div className="metric-value">{dashboardData.totalConversas}</div></div>
          <div className="glass-panel metric-card"><div className="metric-label">Taxa Resposta</div><div className="metric-value">{dashboardData.taxaResposta.toFixed(1)}%</div></div>
          <div className="glass-panel metric-card"><div className="metric-label">Agendamentos</div><div className="metric-value">{dashboardData.agendamentos}</div></div>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem', height: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Volume de Conversas</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid var(--border-color)' }} />
              <Area type="monotone" dataKey="iniciadas" stroke="var(--accent-color)" fill="var(--accent-color)" fillOpacity={0.1} />
              <Area type="monotone" dataKey="respondidas" stroke="var(--success)" fill="var(--success)" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <aside className="sidebar">
      <div onClick={() => setView('home')}><h2>â† Home</h2></div>
      {clientes.map(cli => (
        <div key={cli.id} className={`menu-item ${selectedClienteId === cli.id ? 'active' : ''}`} onClick={() => setSelectedClienteId(cli.id)}>{cli.nome}</div>
      ))}
    </aside>
  );

  // --- MAIN RETURN ---
  if (isLoadingAuth) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}><div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--accent-color)' }}></div></div>;
  if (!isLoggedIn) return <Auth onLoginSuccess={(email) => { setUserEmail(email); setIsLoggedIn(true); }} />;

  if (view === 'home') return (
    <div className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.8s ease-out' }}>
      <header className="header-actions" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>OlÃ¡, {userEmail.split('@')[0]}!</h1>
          <p className="subtitle" style={{ fontSize: '1.1rem', opacity: 0.8 }}>Centro de comando Multi-Tenant â€¢ Gerencie seus clientes e IAs</p>
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <button className="btn-outline" style={{ padding: '0.8rem 1.5rem' }} onClick={() => supabase.auth.signOut()}>Sair</button>
          <button className="btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }} onClick={() => setIsClientModalOpen(true)}>
            <Plus size={20} style={{ marginRight: '8px' }} /> Novo Cliente
          </button>
        </div>
      </header>

      <div className="grid-cards">
        {isLoadingClientes ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel client-card skeleton-loading" style={{ height: '280px' }}></div>
        )) : (
          clientes.map(cli => {
            const status = instanceStatuses[cli.id] || 'desconectado';
            const profile = instanceProfiles[cli.id];
            return (
              <div key={cli.id} className="glass-panel client-card" onClick={() => { setSelectedClienteId(cli.id); setView('client-hub'); }}>
                <button onClick={(e) => deleteClient(e, cli.id, cli.nome)} className="delete-client-btn" title="Excluir Cliente">
                  <Trash2 size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    {profile ? (
                      <img src={profile} alt={cli.nome} style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.5rem' }}>
                        {cli.nome[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%',
                      background: status === 'conectado' ? '#10b981' : '#f59e0b',
                      border: '3px solid #18181b',
                      boxShadow: status === 'conectado' ? '0 0 10px #10b981' : 'none'
                    }}></div>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{cli.nome}</h3>
                    <div style={{ fontSize: '0.85rem', color: status === 'conectado' ? '#10b981' : '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                      {status === 'conectado' ? 'InstÃ¢ncia Ativa' : 'Desconectado'}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}><Mail size={14} /> {cli.email || 'Sem email'}</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}><Phone size={14} /> {cli.telefone || 'Sem telefone'}</p>
                </div>

                <div className="manage-tag" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                  Gerenciar Painel <ArrowRight size={16} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {isClientModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '480px', padding: '2.5rem' }}>
            <div className="modal-header" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Novo Cliente</h2>
              <button onClick={() => setIsClientModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label>Nome da Empresa / Cliente</label>
              <input type="text" placeholder="Ex: ImobiliÃ¡ria Silva" value={clientForm.nome} onChange={e => setClientForm({...clientForm, nome: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email de Contato</label>
              <input type="email" placeholder="contato@empresa.com" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Telefone WhatsApp</label>
              <input type="text" placeholder="5511999999999" value={clientForm.telefone} onChange={e => setClientForm({...clientForm, telefone: e.target.value})} />
            </div>
            <div className="modal-footer" style={{ marginTop: '2.5rem', gap: '1rem' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setIsClientModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1.5 }} onClick={saveClient} disabled={isLoading}>{isLoading ? 'Criando...' : 'Criar InstÃ¢ncia'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (view === 'client-hub') return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', animation: 'slideUp 0.6s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <button className="btn-outline" onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} /> Voltar aos Clientes
        </button>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>{selectedCliente?.nome}</h1>
          <p className="subtitle" style={{ margin: 0 }}>Hub de GestÃ£o</p>
        </div>
      </div>

      <div className="client-hub-container">
        <div className="hub-sidebar">
          <div className="glass-panel client-card" style={{
            height: 'auto',
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(24, 24, 27, 0.7) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
               {instanceProfiles[selectedClienteId] ? (
                <img src={instanceProfiles[selectedClienteId]} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '12px' }} />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} /></div>
              )}
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Resumo</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: instanceStatuses[selectedClienteId] === 'conectado' ? '#10b981' : '#f59e0b' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></div>
                  {instanceStatuses[selectedClienteId] === 'conectado' ? 'WhatsApp Conectado' : 'WhatsApp Offline'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p><strong>ID:</strong> {selectedClienteId}</p>
              <p><strong>InstÃ¢ncia:</strong> {selectedCliente?.instance_name}</p>
              <p><strong>Email:</strong> {selectedCliente?.email}</p>
            </div>
          </div>
        </div>

        <div className="hub-menu">
          <button className="hub-option-btn" onClick={() => setView('config')} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
              <Settings size={32} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>ConfiguraÃ§Ãµes da IA</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.6 }}>Ajuste a personalidade, objetivos e conexÃ£o WhatsApp</div>
            </div>
            <ArrowRight size={24} style={{ marginLeft: 'auto', opacity: 0.3 }} />
          </button>

          <button className="hub-option-btn" onClick={() => setView('conversas')} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <MessageSquare size={32} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>Monitor de Chat</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.6 }}>Acompanhe conversas em tempo real e treine sua IA</div>
            </div>
            <ArrowRight size={24} style={{ marginLeft: 'auto', opacity: 0.3 }} />
          </button>

          <button className="hub-option-btn" onClick={() => setView('inventory')} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Package size={32} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>Estoque & RAG</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 400, opacity: 0.6 }}>Cadastre produtos e alimente a base de conhecimento</div>
            </div>
            <ArrowRight size={24} style={{ marginLeft: 'auto', opacity: 0.3 }} />
          </button>
        </div>
      </div>
    </div>
  );

  if (view === 'inventory') return (
    <div className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.5s ease' }}>
      <header className="header-actions" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Estoque: {selectedCliente?.nome}</h1>
          <p className="subtitle">Painel de Controle e Sincronia com RAG</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline" onClick={() => setIsScrapeModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} /> Importar do Site
          </button>
          <button className="btn-primary" onClick={() => { setEditingId(null); setFormState({nome:'',descricao:'',preco:0,estoque:0,tipo:'produto'}); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Novo Produto
          </button>
          <button className="btn-outline" onClick={() => setView('client-hub')}>Voltar ao Menu</button>
        </div>
      </header>

      <div className="glass-panel table-container" style={{ padding: '0' }}>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Tipo</th>
              <th>DescriÃ§Ã£o</th>
              <th>PreÃ§o (R$)</th>
              <th>Estoque</th>
              <th style={{ textAlign: 'center' }}>AÃ§Ãµes</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                  Nenhum produto cadastrado.
                </td>
              </tr>
            ) : (
              produtos.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      {p.imagemUrl ? (
                        <img src={p.imagemUrl} alt={p.nome} className="product-image" />
                      ) : (
                        <div className="product-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                          <Package size={20} opacity={0.3} />
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{p.nome}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: p.tipo === 'servico' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                      color: p.tipo === 'servico' ? '#818cf8' : '#34d399',
                      border: `1px solid ${p.tipo === 'servico' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}`
                    }}>
                      {p.tipo === 'servico' ? <Settings size={12} /> : <Package size={12} />}
                      {p.tipo === 'servico' ? 'ServiÃ§o' : 'Produto'}
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.descricao || 'â€”'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco)}
                    </span>
                  </td>
                  <td>
                    {p.tipo === 'servico' ? (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', opacity: 0.5 }}>â€”</span>
                    ) : (
                      <div className={`stock-badge ${p.estoque > 5 ? 'stock-high' : p.estoque > 0 ? 'stock-low' : 'stock-out'}`}>
                        {p.estoque} Unid.
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        className="btn-outline"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => { setEditingId(p.id); setFormState(p); setIsModalOpen(true); }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => deleteProduct(p.id)}
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '550px', padding: '2.5rem' }}>
            <div className="modal-header" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem' }}>{editingId ? 'Editar' : 'Novo'} Produto</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Nome do Produto</label>
                <input type="text" value={formState.nome} onChange={e => setFormState({...formState, nome: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>DescriÃ§Ã£o (serÃ¡ usada na RAG)</label>
                <textarea rows={3} value={formState.descricao} onChange={e => setFormState({...formState, descricao: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Tipo de Item</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    className={formState.tipo === 'produto' ? 'btn-primary' : 'btn-outline'}
                    style={{ flex: 1, padding: '0.6rem' }}
                    onClick={() => setFormState({...formState, tipo: 'produto'})}
                  >
                    ðŸ“¦ Produto (Tem Estoque)
                  </button>
                  <button
                    className={formState.tipo === 'servico' ? 'btn-primary' : 'btn-outline'}
                    style={{ flex: 1, padding: '0.6rem' }}
                    onClick={() => setFormState({...formState, tipo: 'servico', estoque: 0})}
                  >
                    ðŸ› ï¸ ServiÃ§o (Sem Estoque)
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>PreÃ§o (R$)</label>
                <input type="number" value={formState.preco} onChange={e => setFormState({...formState, preco: parseFloat(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Estoque {formState.tipo === 'servico' && '(N/A)'}</label>
                <input
                  type="number"
                  value={formState.estoque}
                  disabled={formState.tipo === 'servico'}
                  onChange={e => setFormState({...formState, estoque: parseInt(e.target.value)})}
                  style={{ opacity: formState.tipo === 'servico' ? 0.5 : 1 }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Imagem do Produto</label>
                <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} style={{ border: '1px dashed var(--border-color)', padding: '2rem', textAlign: 'center' }} />
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '2.5rem', gap: '1rem' }}>
               <button className="btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
               <button className="btn-primary" style={{ flex: 2 }} onClick={saveProduct} disabled={isUploading}>{isUploading ? 'Processando RAG...' : 'Salvar Produto'}</button>
            </div>
          </div>
        </div>
      )}

      {isScrapeModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '900px', width: '90%' }}>
            <div className="modal-header">
              <h2>ðŸŒ Importar do Site</h2>
              <button onClick={() => setIsScrapeModalOpen(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <input type="text" style={{ flex: 1 }} value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://loja-exemplo.com/produtos" />
              <button className="btn-primary" onClick={handleScrape} disabled={isScraping}>{isScraping ? 'Analisando...' : 'Buscar Produtos'}</button>
            </div>

            <div className="grid-cards" style={{ maxHeight: '400px', overflowY: 'auto', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', padding: '1rem' }}>
              {scrapedProducts.map((p, i) => (
                <div key={i} className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border-color)', position: 'relative' }}>
                  <input type="checkbox" style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px' }} checked={p.selected} onChange={() => {
                    const newScraped = [...scrapedProducts];
                    newScraped[i].selected = !newScraped[i].selected;
                    setScrapedProducts(newScraped);
                  }} />
                  <div style={{ height: '100px', background: '#111', borderRadius: '8px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                    {p.imagemUrl && <img src={p.imagemUrl} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>R$ {p.preco}</div>
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem' }}>
              <button className="btn-outline" onClick={() => setIsScrapeModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={importSelectedProducts} disabled={!scrapedProducts.some(p => p.selected)}>
                Importar {scrapedProducts.filter(p=>p.selected).length} itens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="layout-wrapper">
      <Sidebar />
      {view === 'conversas' ? renderConversasView() : view === 'config' ? renderConfigView() : <div>View nÃ£o encontrada</div>}

      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className={`glass-panel toast ${t.type}`} style={{
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            borderLeft: `4px solid ${t.type === 'success' ? '#10b981' : '#f59e0b'}`,
            animation: 'slideIn 0.3s ease-out'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
