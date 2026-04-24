import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  LayoutDashboard, MessageSquare, Users, Calendar, TrendingUp,
  Settings, Plus, Search, Trash2, ExternalLink, LogOut, Send,
  CheckCircle2, AlertCircle, ChevronRight, Globe, RefreshCw,
  QrCode, Copy, Shield, Zap, Smartphone, HelpCircle, X
} from 'lucide-react';

// --- COMPONENTE DA PÁGINA EXTERNA DE QR CODE ---
const QRCodeGenPage = ({ instanceName }: { instanceName: string }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const fetchQRCode = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      const response = await fetch("https://webhook.storyallday.com/webhook/atualizar-qr-code", {
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
          Instância: <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{instanceName}</span>
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
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Rápido</p>
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
            Começar Conexão
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
                <p style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 500 }}>Vá em Configurações &gt; Aparelhos</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>3</div>
                <p style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 500 }}>Escaneie este código QR</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <RefreshCw size={16} className="spin-slow" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>O código expira em {timeLeft} segundos</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <button className="btn-outline" style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)' }} onClick={() => window.open('https://storyallday.com', '_blank')}>
          <HelpCircle size={20} /> Precisa de suporte técnico?
        </button>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.8 }}>
          <Shield size={14} color="#10b981" /> Protocolo de segurança ponta-a-ponta Evolution API
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
};

type Cliente = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  instance_name?: string;
  created_at?: string;
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
};

// Aqui vamos simular que os clientes vêm do banco também, ou manter no Mock por enquanto
const mockClientes: Cliente[] = [
  { id: 'cli1', nome: 'Floricultura da Maria' },
  { id: 'cli2', nome: 'Moto Peças São João' },
  { id: 'cli3', nome: 'Tech Store' },
];

export default function App() {
  // Detecção de Rota Externa para QR Code (Deve ser o primeiro check)
  const isQRCodeGen = window.location.pathname.startsWith('/qrcodegen/');
  const qrInstanceFromUrl = isQRCodeGen ? window.location.pathname.split('/').pop() : null;

  if (isQRCodeGen && qrInstanceFromUrl) {
    return <QRCodeGenPage instanceName={decodeURIComponent(qrInstanceFromUrl)} />;
  }

  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [view, setView] = useState<'home' | 'client-hub' | 'inventory' | 'conversas' | 'config'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clientes State
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formState, setFormState] = useState<Partial<Produto>>({
    nome: '', descricao: '', preco: 0, estoque: 0
  });

  // Chat Monitor State
  const [contacts, setContacts] = useState<{ phone: string, nomewpp: string, last_msg: string, time: string }[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [clientStatus, setClientStatus] = useState<ClientStatus | null>(null);
  const [manualMsg, setManualMsg] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [conversasSubView, setConversasSubView] = useState<'chat' | 'dashboard'>('chat');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Estados para Scraping
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([]);
  const [selectedScrapedIndices, setSelectedScrapedIndices] = useState<number[]>([]);
  const [instanceStatuses, setInstanceStatuses] = useState<Record<string, 'conectado' | 'desconectado'>>({});
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(30);

  // AI Settings State
  const [aiSettings, setAiSettings] = useState({
    nomeAgente: '',
    nomeEmpresa: '',
    saudacao: '',
    objetivo: 'Gerar Leads',
    tipoConversao: 'Videochamada',
    papelHumano: '',
    restricoes: [] as string[]
  });
  const [novaRestricao, setNovaRestricao] = useState('');
  const [isSavingAI, setIsSavingAI] = useState(false);

  const [clientForm, setClientForm] = useState({
    telefone: ''
  });

  const selectedCliente = useMemo(() => 
    clientes.find(c => c.id === selectedClienteId), 
  [clientes, selectedClienteId]);

  useEffect(() => {
    if (isLoggedIn) fetchClientes();
  }, [isLoggedIn]);

  useEffect(() => {
    if (view === 'inventory' && selectedClienteId) {
      fetchProdutos();
    }
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

  // Background Check para Instâncias
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(() => {
      checkInstancesStatus(true); // true = silent check para notificações
    }, 60000 * 5); // A cada 5 minutos

    checkInstancesStatus(true);
    return () => clearInterval(interval);
  }, [isLoggedIn, clientes]);

  useEffect(() => {
    if (view === 'conversas' && selectedPhone) {
      fetchMessages();
      fetchClientStatus();
      
      // Real-time subscription
      const channel = supabase
        .channel(`chat-${selectedPhone}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'Z_ia_chat_messages', filter: `phone=eq.${selectedPhone}` },
          (payload) => {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
          }
        )
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedPhone, view]);

  // Timer para QR Code na aba Admin
  useEffect(() => {
    let timer: any;
    if (qrCode && qrTimeLeft > 0 && view === 'config') {
      timer = setInterval(() => setQrTimeLeft(prev => prev - 1), 1000);
    } else if (qrTimeLeft === 0) {
      setQrCode(null);
    }
    return () => clearInterval(timer);
  }, [qrCode, qrTimeLeft, view]);

  const fetchClientes = async () => {
    if (!userEmail) return;
    setIsLoadingClientes(true);
    const { data, error } = await supabase
      .from('z_bd_atendimento_clientes')
      .select('*')
      .eq('user_id', userEmail) // Filtro multi-usuário: busca apenas clientes deste usuário
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      alert('Erro ao carregar clientes do banco: ' + error.message);
      setIsLoadingClientes(false);
      return;
    }
    setClientes(data || []);
    setIsLoadingClientes(false);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isModalOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            // Se colar uma imagem, definimos ela no state
            setImageFile(file);
          }
          break;
        }
      }
    };
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isModalOpen]);

  // Timer para QR Code na aba Admin
  useEffect(() => {
    let timer: any;
    if (qrCode && qrTimeLeft > 0 && view === 'config') {
      timer = setInterval(() => setQrTimeLeft(prev => prev - 1), 1000);
    } else if (qrTimeLeft === 0) {
      setQrCode(null);
    }
    return () => clearInterval(timer);
  }, [qrCode, qrTimeLeft, view]);

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from('z_atendimento_produtos')
      .select('*')
      .eq('tenant_id', selectedClienteId);
    
    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return;
    }
    
    if (data) {
      const formatted: Produto[] = data.map(dbItem => ({
        id: dbItem.id,
        clienteId: dbItem.tenant_id,
        nome: dbItem.nome,
        descricao: dbItem.descricao,
        preco: Number(dbItem.preco),
        estoque: Number(dbItem.estoque),
        imagemUrl: dbItem.imagem_url
      }));
      setProdutos(formatted);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Chat Functions
  const fetchContacts = async () => {
    setIsLoadingChat(true);
    // Busca as últimas mensagens agrupadas por telefone para este tenant
    const { data, error } = await supabase
      .from('Z_ia_chat_messages')
      .select('phone, nomewpp, user_message, bot_message, created_at')
      .eq('tenant_id', selectedClienteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro contatos:', error);
      setIsLoadingChat(false);
      return;
    }

    // Agrupamento manual para pegar a última de cada um
    const unique: any = {};
    data?.forEach(m => {
      if (!unique[m.phone]) {
        unique[m.phone] = {
          phone: m.phone,
          nomewpp: m.nomewpp || 'Cliente',
          last_msg: m.user_message || m.bot_message || '...',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
    });
    setContacts(Object.values(unique));
    setIsLoadingChat(false);
  };

  const fetchMessages = async () => {
    if (!selectedPhone) return;
    const { data, error } = await supabase
      .from('Z_ia_chat_messages')
      .select('*')
      .eq('phone', selectedPhone)
      .eq('tenant_id', selectedClienteId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const fetchClientStatus = async () => {
    if (!selectedPhone) return;
    const { data, error } = await supabase
      .from('Z_ia_dados_cliente')
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
      .from('Z_ia_dados_cliente')
      .upsert({ 
        telefone: selectedPhone, 
        atendimento_ia: newStatus,
        tenant_id: selectedClienteId,
        updated_at: new Date().toISOString()
      });

    if (!error) setClientStatus({ ...clientStatus, atendimento_ia: newStatus });
  };

  const sendManualMessage = async () => {
    if (!manualMsg || !selectedPhone) return;
    
    // 1. Salva no banco (o webhook do n8n faria o envio real)
    const { error } = await supabase
      .from('Z_ia_chat_messages')
      .insert([{
        tenant_id: selectedClienteId,
        phone: selectedPhone,
        bot_message: manualMsg,
        nomewpp: contacts.find(c => c.phone === selectedPhone)?.nomewpp
      }]);

    if (!error) {
      setManualMsg('');
      // 2. Pausa a IA automaticamente ao intervir
      if (clientStatus?.atendimento_ia !== 'pause') toggleIAPause();
    }
  };

  const fetchDashboardData = async () => {
    // 1. Busca todas as mensagens para este tenant
    const { data: messages, error: mError } = await supabase
      .from('Z_ia_chat_messages')
      .select('phone, user_message, bot_message, created_at')
      .eq('tenant_id', selectedClienteId);

    // 2. Busca status dos clientes
    const { data: statuses, error: sError } = await supabase
      .from('Z_ia_dados_cliente')
      .select('telefone, agenda_check')
      .eq('tenant_id', selectedClienteId);

    if (mError || sError) return;

    // Processamento de métricas
    const phones = new Set(messages.map(m => m.phone));
    const respondidas = new Set(messages.filter(m => m.user_message).map(m => m.phone));
    const iniciadas = new Set(messages.filter(m => m.bot_message).map(m => m.phone));
    const agendamentos = statuses?.filter(s => s.agenda_check).length || 0;

    // Dados para o gráfico (volume diário)
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

  const checkInstancesStatus = async (silent = false) => {
    try {
      const evolutionUrl = "https://api.storyallday.com"; 
      const apiKey = "42702EAD4D0C42E8B9C894B3519E2B30"; 

      const response = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
        headers: { "apikey": apiKey }
      });
      const data = await response.json();
      
      const statuses: Record<string, 'conectado' | 'desconectado'> = {};
      const disconnectedClients: string[] = [];

      clientes.forEach(client => {
        if (!client.instance_name) return;
        const instance = data.find((i: any) => i.name === client.instance_name);
        const isConnected = instance?.connectionStatus === 'open';
        statuses[client.id] = isConnected ? 'conectado' : 'desconectado';

        if (!isConnected && silent) {
          disconnectedClients.push(client.nome);
        }
      });

      setInstanceStatuses(statuses);

      if (disconnectedClients.length > 0) {
        disconnectedClients.forEach(name => {
          addToast(`${name} está com o número desconectado!`, 'warning');
        });
      }
    } catch (err) {
      console.error("Erro ao checar instâncias:", err);
    }
  };

  const addToast = (message: string, type: 'warning' | 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const copyQRCodeLink = () => {
    if (!selectedCliente) return;
    const link = `${window.location.origin}/qrcodegen/${selectedCliente.instance_name}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    addToast("Link copiado!", "success");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const toggleQRCode = () => {
    if (qrCode) {
      setQrCode(null);
    } else {
      generateQRCode();
    }
  };

  const generateQRCode = async () => {
    if (!selectedCliente?.instance_name) return alert("Instância não configurada.");
    
    setIsGeneratingQr(true);
    setQrCode(null);

    try {
      const response = await fetch("https://webhook.storyallday.com/webhook/atualizar-qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instance: selectedCliente.instance_name })
      });
      
      const contentType = response.headers.get("content-type");

      if (contentType && (contentType.includes("image") || contentType.includes("octet-stream"))) {
        const blob = await response.blob();
        // Revoga URL anterior se existir
        if (qrCode && qrCode.startsWith('blob:')) URL.revokeObjectURL(qrCode);
        
        const imageUrl = URL.createObjectURL(blob);
        setQrCode(imageUrl);
        setQrTimeLeft(30); // Reseta timer no admin
        addToast("QR Code recebido!", "success");
      } else {
        const data = await response.json();
        const code = data.qrcode || data.base64 || data.code || (typeof data === 'string' ? data : null);
        
        if (code) {
          setQrCode(code);
          setQrTimeLeft(30); // Reseta timer no admin
          addToast("QR Code gerado! Escaneie para conectar.", "success");
        } else {
          alert("Erro ao receber QR Code. Verifique o fluxo.");
        }
      }
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
      alert("Falha na requisição do QR Code.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const numericValue = parseInt(value, 10) / 100;
    setFormState({
      ...formState,
      preco: isNaN(numericValue) ? 0 : numericValue
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login: aceita qualquer email e senha 'teste12345' para facilitar seus testes multi-usuário
    if (password === 'teste12345') {
      setUserEmail(email);
      setIsLoggedIn(true);
    } else {
      alert('Senha incorreta! Use teste12345 para qualquer e-mail.');
    }
  };

  const getStockClass = (qtd: number) => {
    if (qtd === 0) return 'stock-out';
    if (qtd < 5) return 'stock-low';
    return 'stock-high';
  };

  const saveProduct = async () => {
    if (!formState.nome) return alert("O nome do produto é obrigatório!");
    
    setIsUploading(true);
    let finalImageUrl = formState.imagemUrl || null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedClienteId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos_cliente')
        .upload(filePath, imageFile);
      
      if (uploadError) {
        setIsUploading(false);
        return alert("Erro no upload da imagem: " + uploadError.message);
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('produtos_cliente')
        .getPublicUrl(filePath);
        
      finalImageUrl = publicUrlData.publicUrl;
    }

    const dbPayload = {
      tenant_id: selectedClienteId,
      nome: formState.nome,
      descricao: formState.descricao || '',
      preco: formState.preco || 0,
      estoque: formState.estoque || 0,
      imagem_url: finalImageUrl
    };

    if (editingId) {
      const { error } = await supabase.from('z_atendimento_produtos').update(dbPayload).eq('id', editingId);
      if (error) {
        setIsUploading(false);
        return alert("Erro ao editar: " + error.message);
      }
    } else {
      const { error } = await supabase.from('z_atendimento_produtos').insert([dbPayload]);
      if (error) {
        setIsUploading(false);
        return alert("Erro ao salvar: " + error.message);
      }
    }
    
    setIsUploading(false);
    setIsModalOpen(false);
    fetchProdutos();
  };

  const openNewProduct = () => {
    setEditingId(null);
    setFormState({ nome: '', descricao: '', preco: 0, estoque: 0 });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditProduct = (prod: Produto) => {
    setEditingId(prod.id);
    setFormState({ ...prod });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const saveClient = async () => {
    if (!clientForm.nome) return alert("Nome é obrigatório");
    
    const toSnakeCase = (str: string) => 
      str.toLowerCase()
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "") 
         .trim()
         .replace(/\s+/g, '_')
         .replace(/[^\w-]+/g, '')
         .replace(/--+/g, '_');

    const instanceName = `${userEmail}-${toSnakeCase(clientForm.nome)}`;
    const newId = 'cust_' + Date.now().toString(36);
    
    // 1. Salva no Banco de Dados
    const { error } = await supabase
      .from('z_bd_atendimento_clientes')
      .insert([{ 
        ...clientForm, 
        id: newId,
        instance_name: instanceName, 
        user_id: userEmail 
      }]);

    if (error) return alert("Erro ao salvar cliente: " + error.message);

    // 2. Dispara o Webhook de Instância
    try {
      await fetch("https://webhook.storyallday.com/webhook/gerar-instancia", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: instanceName
      });
      console.log("Webhook disparado com sucesso!");
    } catch (whError) {
      console.error("Erro ao disparar webhook:", whError);
    }

    setClientForm({ nome: '', email: '', telefone: '' });
    setIsClientModalOpen(false);
    fetchClientes();
  };

  const fetchAISettings = async () => {
    if (!selectedClienteId) return;
    const { data, error } = await supabase
      .from('Z_bd_configuracoes_ia')
      .select('*')
      .eq('cliente_id', selectedClienteId)
      .single();

    if (data) {
      setAiSettings({
        nomeAgente: data.nome_agente || '',
        nomeEmpresa: data.nome_empresa || '',
        saudacao: data.saudacao || '',
        objetivo: data.objetivo || 'Gerar Leads',
        tipoConversao: data.tipo_conversao || 'Videochamada',
        papelHumano: data.papel_humano || '',
        restricoes: data.restricoes || []
      });
    } else {
      // Se não existir registro, resetamos para o padrão
      setAiSettings({
        nomeAgente: '',
        nomeEmpresa: '',
        saudacao: '',
        objetivo: 'Gerar Leads',
        tipoConversao: 'Videochamada',
        papelHumano: '',
        restricoes: []
      });
    }
  };

  const saveAISettings = async () => {
    if (!selectedClienteId) return;
    setIsSavingAI(true);

    const dbPayload = {
      cliente_id: selectedClienteId,
      nome_agente: aiSettings.nomeAgente,
      nome_empresa: aiSettings.nomeEmpresa,
      saudacao: aiSettings.saudacao,
      objetivo: aiSettings.objetivo,
      tipo_conversao: aiSettings.tipoConversao,
      papel_humano: aiSettings.papelHumano,
      restricoes: aiSettings.restricoes,
      updated_at: new Date().toISOString()
    };

    // Tenta fazer um UPSERT (Inserir ou Atualizar se já existir)
    const { error } = await supabase
      .from('Z_bd_configuracoes_ia')
      .upsert(dbPayload, { onConflict: 'cliente_id' });

    setIsSavingAI(false);
    if (error) {
      addToast("Erro ao salvar configurações: " + error.message, 'warning');
    } else {
      addToast("Configurações salvas na tabela dedicada!", 'success');
    }
  };

  const addRestricao = () => {
    if (!novaRestricao.trim()) return;
    setAiSettings(prev => ({
      ...prev,
      restricoes: [...prev.restricoes, novaRestricao.trim()]
    }));
    setNovaRestricao('');
  };

  const removeRestricao = (index: number) => {
    setAiSettings(prev => ({
      ...prev,
      restricoes: prev.restricoes.filter((_, i) => i !== index)
    }));
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <form className="glass-panel login-box" onSubmit={handleLogin}>
          <h2>Acesso ao Painel</h2>
          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="teste@teste.com" 
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="teste12345" 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // Home Screen
  if (view === 'home') {
    return (
      <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header className="header-actions">
          <div>
            <h1>Olá, {userEmail.split('@')[0]}!</h1>
            <p className="subtitle">Bem-vindo ao seu centro de comando Multi-Tenant.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-outline" onClick={() => { setIsLoggedIn(false); setView('home'); }}>
              Sair
            </button>
            <button className="btn-primary" onClick={() => setIsClientModalOpen(true)}>
              + Novo Cliente
            </button>
          </div>
        </header>

        <div className="grid-cards">
          {isLoadingClientes ? (
            // Skeleton Loading State
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel client-card skeleton-loading">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))
          ) : (
            <>
              {clientes.map(cli => (
                <div 
                  key={cli.id} 
                  className="glass-panel client-card" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedClienteId(cli.id);
                    setView('client-hub');
                  }}
                >
                  <h3>{cli.nome}</h3>
                  <p>{cli.email || 'Sem e-mail'}</p>
                  <p>{cli.telefone || 'Sem telefone'}</p>
                  <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <span style={{ color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: 600 }}>GERENCIAR CLIENTE →</span>
                  </div>
                </div>
              ))}

              {clientes.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: '1 / -1' }}>
                  <div className="action-card" onClick={() => setIsClientModalOpen(true)}>
                    <h3>🚀 Comece agora</h3>
                    <p>Adicione seu primeiro cliente para gerenciar estoque e RAG.</p>
                  </div>
                  <button className="btn-outline" onClick={fetchClientes} style={{ alignSelf: 'center' }}>
                    🔄 Atualizar Banco (Caso tenha acabado de criar as tabelas)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {isClientModalOpen && (
          <div className="modal-overlay">
            <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h2>Adicionar Cliente</h2>
                <button className="btn-outline" onClick={() => setIsClientModalOpen(false)}>X</button>
              </div>
              <div className="form-group">
                <label>Nome do Cliente / Empresa</label>
                <input 
                  type="text" 
                  value={clientForm.nome} 
                  onChange={e => setClientForm({...clientForm, nome: e.target.value})} 
                  placeholder="Ex: Floricultura da Maria" 
                />
              </div>
              <div className="form-group">
                <label>E-mail de Contato</label>
                <input 
                  type="email" 
                  value={clientForm.email} 
                  onChange={e => setClientForm({...clientForm, email: e.target.value})} 
                  placeholder="contato@empresa.com" 
                />
              </div>
              <div className="form-group">
                <label>Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  value={clientForm.telefone} 
                  onChange={e => setClientForm({...clientForm, telefone: e.target.value})} 
                  placeholder="(11) 99999-9999" 
                />
              </div>
              <div className="modal-footer">
                <button className="btn-outline" onClick={() => setIsClientModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={saveClient}>Criar Cliente</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Client Hub Screen
  if (view === 'client-hub') {
    const selectedCliente = clientes.find(c => c.id === selectedClienteId);
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <button className="btn-outline" style={{ alignSelf: 'flex-start', marginBottom: '2rem' }} onClick={() => setView('home')}>
          ← Voltar para Todos os Clientes
        </button>
        
        <div className="client-hub-container">
          <div className="hub-sidebar">
            <div className="glass-panel client-card" style={{ transform: 'none', cursor: 'default', border: '1px solid var(--accent-color)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏢</div>
              <h3>{selectedCliente?.nome}</h3>
              <p>{selectedCliente?.email}</p>
              <p>{selectedCliente?.telefone}</p>
              <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                CLIENTE SELECIONADO
              </div>
            </div>
          </div>

          <div className="hub-menu">
            <button className="hub-option-btn" onClick={() => setView('config')}>
              <div className="icon-box">⚙️</div>
              <div>
                <h4>Configuração</h4>
                <p>Ajuste dados do perfil, instâncias e conexões.</p>
              </div>
            </button>
            <button className="hub-option-btn" onClick={() => setView('conversas')}>
              <div className="icon-box">💬</div>
              <div>
                <h4>Conversas</h4>
                <p>Histórico de chats e atendimentos da IA.</p>
              </div>
            </button>
            <button className="hub-option-btn" onClick={() => setView('inventory')}>
              <div className="icon-box">📦</div>
              <div>
                <h4>Produtos</h4>
                <p>Gerencie o estoque e sincronize com o RAG.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const produtosFiltrados = produtos.filter(p => p.clienteId === selectedClienteId);
  const clienteAtual = clientes.find(c => c.id === selectedClienteId);

  const renderConversasView = () => {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1>Monitor de Chat</h1>
            <p className="subtitle">Gestão de conversas em tempo real</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${conversasSubView === 'chat' ? 'active' : ''}`}
                onClick={() => setConversasSubView('chat')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} /> Chat
                </div>
              </button>
              <button 
                className={`toggle-btn ${conversasSubView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setConversasSubView('dashboard')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LayoutDashboard size={16} /> Dashboard
                </div>
              </button>
            </div>
            <button className="btn-outline" onClick={() => setView('client-hub')}>← Voltar ao Hub</button>
          </div>
        </div>

        {conversasSubView === 'dashboard' ? renderDashboardView() : (
          <div className="chat-monitor-container">
            {/* Sidebar de Contatos */}
          <div className="glass-panel chat-sidebar">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <input type="text" placeholder="Buscar contato..." className="search-input" style={{ background: 'rgba(0,0,0,0.2)' }} />
            </div>
            <div className="chat-list">
              {isLoadingChat ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner"></span></div>
              ) : contacts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma conversa.</div>
              ) : (
                contacts.map(c => (
                  <div 
                    key={c.phone} 
                    className={`contact-item ${selectedPhone === c.phone ? 'active' : ''}`}
                    onClick={() => setSelectedPhone(c.phone)}
                  >
                    <div className="contact-info">
                      <h4>
                        {c.nomewpp}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.time}</span>
                      </h4>
                      <p>{c.last_msg}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Área de Chat */}
          <div className="glass-panel chat-area">
            {selectedPhone ? (
              <>
                <div className="chat-header">
                  <div>
                    <h3 style={{ margin: 0 }}>{contacts.find(c => c.phone === selectedPhone)?.nomewpp}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedPhone}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className={`badge-ia ${clientStatus?.atendimento_ia}`}>
                      {clientStatus?.atendimento_ia === 'atendendo' ? '🤖 IA Ativa' : '👤 IA Pausada'}
                    </span>
                    <button className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={toggleIAPause}>
                      {clientStatus?.atendimento_ia === 'atendendo' ? 'Pausar IA' : 'Retomar IA'}
                    </button>
                  </div>
                </div>

                <div className="chat-history">
                  {messages.map(m => (
                    <div key={m.id} className={`message-bubble ${m.bot_message ? 'message-bot' : 'message-user'}`}>
                      {m.user_message || m.bot_message}
                      <span className="message-time">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  <div id="chat-end"></div>
                </div>

                <div className="chat-input-area">
                  <input 
                    type="text" 
                    placeholder="Digite uma mensagem manual (Isso pausará a IA)..." 
                    value={manualMsg}
                    onChange={e => setManualMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendManualMessage()}
                  />
                  <button className="btn-primary" onClick={sendManualMessage}>Enviar</button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Selecione uma conversa para começar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

  const renderConfigView = () => {
    const status = instanceStatuses[selectedClienteId!] || 'desconectado';
    
    return (
      <div className="main-content" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1>Configurações do Cliente</h1>
            <p className="subtitle">Gerencie conexões e parâmetros da IA</p>
          </div>
          <button className="btn-outline" onClick={() => setView('client-hub')}>← Voltar ao Hub</button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Coluna da Esquerda: Status da Instância */}
          <div style={{ width: '380px', flexShrink: 0 }}>
            <div className="glass-panel metric-card" style={{ 
              border: `1px solid ${status === 'conectado' ? '#10b981' : '#f59e0b'}`,
              height: 'auto',
              marginBottom: '1rem'
            }}>
              <div className="metric-label">Status da Instância</div>
              <div className="metric-value" style={{ fontSize: '1.8rem', color: status === 'conectado' ? '#10b981' : '#f59e0b' }}>
                {status === 'conectado' ? '🟢 Conectado' : '🔴 Desconectado'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Instância: <strong>{selectedCliente?.instance_name}</strong></p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  className="btn-outline" 
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    borderColor: linkCopied ? 'var(--success)' : 'var(--border-color)',
                    color: linkCopied ? 'var(--success)' : 'var(--text-primary)'
                  }} 
                  onClick={copyQRCodeLink}
                >
                  {linkCopied ? <><CheckCircle2 size={16} /> Copiado</> : <><Copy size={16} /> Link</>}
                </button>
                
                <button 
                  className="btn-primary" 
                  style={{ 
                    flex: 1.5, 
                    background: qrCode ? 'rgba(255,255,255,0.05)' : 'var(--accent-color)',
                    color: qrCode ? 'var(--text-primary)' : 'white',
                    border: qrCode ? '1px solid var(--border-color)' : 'none',
                    boxShadow: qrCode ? 'none' : '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
                  }} 
                  onClick={toggleQRCode} 
                  disabled={isGeneratingQr}
                >
                  {isGeneratingQr ? <span className="spinner"></span> : (
                    qrCode ? <><X size={16} style={{marginRight: '8px'}} /> Fechar</> : <><QrCode size={16} style={{marginRight: '8px'}} /> Gerar QR Code</>
                  )}
                </button>
              </div>

              {qrCode && (
                <div style={{ marginTop: '1.5rem', width: '100%', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: 'white', 
                    borderRadius: '16px', 
                    display: 'block',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
                    border: '2px solid var(--accent-color)',
                    margin: '0 auto',
                    maxWidth: '300px'
                  }}>
                    <img 
                      src={qrCode} 
                      alt="WhatsApp QR Code" 
                      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.5rem', borderRadius: '8px', marginTop: '1rem', maxWidth: '200px', margin: '1rem auto' }}>
                    <RefreshCw size={14} className="spin-slow" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Expira em {qrTimeLeft}s</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna da Direita: Ajuste de Atendimento */}
          <div className="glass-panel" style={{ flex: 1, padding: '2rem', animation: 'fadeIn 0.7s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Zap color="var(--accent-color)" size={24} />
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Ajuste de Atendimento (IA)</h2>
              </div>
              <button 
                className="btn-primary" 
                onClick={saveAISettings} 
                disabled={isSavingAI}
                style={{ padding: '0.6rem 2rem' }}
              >
                {isSavingAI ? <span className="spinner"></span> : 'Salvar Ajustes'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group">
                <label>1. Nome do Agente</label>
                <input 
                  type="text" 
                  value={aiSettings.nomeAgente}
                  onChange={e => setAiSettings({...aiSettings, nomeAgente: e.target.value})}
                  placeholder="Ex: Clarice, João, Atendente Virtual"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Como a IA se apresentará ao cliente</p>
              </div>

              <div className="form-group">
                <label>2. Nome da Empresa (IA)</label>
                <input 
                  type="text" 
                  value={aiSettings.nomeEmpresa}
                  onChange={e => setAiSettings({...aiSettings, nomeEmpresa: e.target.value})}
                  placeholder="Ex: Floricultura da Maria, Tech Store"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Como a IA mencionará a empresa</p>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>3. Saudação Padrão</label>
                <textarea 
                  rows={3}
                  value={aiSettings.saudacao}
                  onChange={e => setAiSettings({...aiSettings, saudacao: e.target.value})}
                  placeholder="Olá {nome}! Tudo bem? Sou a {{NOME_AGENTE}} da {{NOME_EMPRESA}}..."
                />
              </div>

              <div className="form-group">
                <label>4. Objetivo do Agente</label>
                <select 
                  value={aiSettings.objetivo}
                  onChange={e => setAiSettings({...aiSettings, objetivo: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid var(--border-color)' }}
                >
                  <option value="Gerar Leads">Gerar Leads</option>
                  <option value="Agendar Reunião">Agendar Reunião</option>
                  <option value="Venda Direta">Venda Direta</option>
                  <option value="Suporte Técnico">Suporte Técnico</option>
                  <option value="Qualificação Profunda">Qualificação Profunda</option>
                </select>
              </div>

              <div className="form-group">
                <label>5. Tipo de Conversão</label>
                <select 
                  value={aiSettings.tipoConversao}
                  onChange={e => setAiSettings({...aiSettings, tipoConversao: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid var(--border-color)' }}
                >
                  <option value="Videochamada">Videochamada</option>
                  <option value="Visita Presencial">Visita Presencial</option>
                  <option value="Ligação Telefônica">Ligação Telefônica</option>
                  <option value="Agendamento Calendly">Agendamento Calendly</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>6. Função/Papel do Humano</label>
                <input 
                  type="text" 
                  value={aiSettings.papelHumano}
                  onChange={e => setAiSettings({...aiSettings, papelHumano: e.target.value})}
                  placeholder="Ex: Gerente de Vendas, Corretor, Consultor"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>A quem a IA deve encaminhar o lead</p>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>7. Restrições (O que a IA NÃO deve fazer)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    type="text" 
                    value={novaRestricao}
                    onChange={e => setNovaRestricao(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addRestricao()}
                    placeholder="Adicione uma restrição e pressione Enter"
                    style={{ flex: 1 }}
                  />
                  <button className="btn-outline" onClick={addRestricao} style={{ padding: '0.75rem 1.5rem' }}>Adicionar</button>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {aiSettings.restricoes.map((res, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#f87171', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        animation: 'scaleUp 0.2s ease'
                      }}
                    >
                      <span>❌ {res}</span>
                      <X 
                        size={14} 
                        style={{ cursor: 'pointer', opacity: 0.7 }} 
                        onClick={() => removeRestricao(idx)}
                      />
                    </div>
                  ))}
                  {aiSettings.restricoes.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma restrição adicionada.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardView = () => {
    if (!dashboardData) return <div style={{ textAlign: 'center', padding: '5rem' }}><span className="spinner"></span> Carregando métricas...</div>;

    return (
      <div style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="metrics-grid">
          <div className="glass-panel metric-card">
            <div className="metric-label">Total de Leads</div>
            <div className="metric-value">{dashboardData.totalConversas}</div>
            <div style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} /> Ativos no período
            </div>
          </div>
          <div className="glass-panel metric-card">
            <div className="metric-label">Taxa de Resposta</div>
            <div className="metric-value">{dashboardData.taxaResposta.toFixed(1)}%</div>
            <div style={{ color: 'var(--accent-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} /> Engajamento IA
            </div>
          </div>
          <div className="glass-panel metric-card">
            <div className="metric-label">Agendamentos</div>
            <div className="metric-value">{dashboardData.agendamentos}</div>
            <div style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Convertidos
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '2rem', color: 'white' }}>Volume de Conversas (Iniciadas vs Respondidas)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.chartData}>
                <defs>
                  <linearGradient id="colorIniciadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRespondidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: '#18181b', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="iniciadas" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorIniciadas)" name="IA Iniciou" />
                <Area type="monotone" dataKey="respondidas" stroke="var(--success)" fillOpacity={1} fill="url(#colorRespondidas)" name="Cliente Respondeu" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const Sidebar = () => {
    return (
      <aside className="sidebar">
        <div style={{ marginBottom: '2rem', cursor: 'pointer' }} onClick={() => setView('home')}>
          <h2 style={{ fontSize: '1.2rem', color: 'white' }}>← Voltar ao Menu</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Outros Clientes
          </div>
          {clientes.map(cli => (
            <div 
              key={cli.id} 
              className={`menu-item ${selectedClienteId === cli.id ? 'active' : ''}`}
              onClick={() => setSelectedClienteId(cli.id)}
            >
              {cli.nome}
            </div>
          ))}
        </div>
      </aside>
    );
  };

  if (view === 'conversas') {
    return (
      <div className="layout-wrapper">
        <Sidebar />
        {renderConversasView()}
      </div>
    );
  }

  if (view === 'config') {
    return (
      <div className="layout-wrapper">
        <Sidebar />
        {renderConfigView()}
      </div>
    );
  }


  const handleScrape = async () => {
    if (!scrapeUrl) return alert("Insira uma URL válida.");
    setIsScraping(true);
    setScrapedProducts([]);
    
    try {
      // Aqui chamamos o seu webhook de scraping no n8n
      const response = await fetch("https://webhook.storyallday.com/webhook/scrape-produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl, tenant_id: selectedClienteId })
      });
      
      const data = await response.json();
      
      // O formato esperado do n8n é uma lista de objetos: { nome, preco, imagem, descricao }
      if (Array.isArray(data)) {
        setScrapedProducts(data);
        setSelectedScrapedIndices(data.map((_, i) => i)); // Seleciona todos por padrão
      } else if (data.produtos) {
        setScrapedProducts(data.produtos);
        setSelectedScrapedIndices(data.produtos.map((_, i) => i));
      } else {
        alert("Nenhum produto encontrado ou erro no formato dos dados.");
      }
    } catch (err) {
      console.error("Erro ao fazer scrape:", err);
      alert("Erro na conexão com o serviço de scraping.");
    } finally {
      setIsScraping(false);
    }
  };

  const importSelectedProducts = async () => {
    if (selectedScrapedIndices.length === 0) return alert("Selecione ao menos um produto.");
    setIsScraping(true);
    
    try {
      const productsToImport = scrapedProducts.filter((_, i) => selectedScrapedIndices.includes(i));
      
      const inserts = productsToImport.map(p => ({
        tenant_id: selectedClienteId,
        nome: p.nome,
        preco: parseFloat(p.preco) || 0,
        descricao: p.descricao || '',
        imagemUrl: p.imagem || p.foto || p.imagemUrl || '',
        estoque: 10, // Valor padrão
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('z_atendimento_produtos').insert(inserts);
      
      if (error) throw error;
      
      addToast(`${inserts.length} produtos importados com sucesso!`, "success");
      setIsScrapeModalOpen(false);
      fetchProdutos();
    } catch (err: any) {
      alert("Erro ao importar: " + err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const renderScrapeModal = () => (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Globe color="var(--accent-color)" />
            <h2 style={{ margin: 0 }}>Importar de URL</h2>
          </div>
          <button className="btn-outline" onClick={() => setIsScrapeModalOpen(false)}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label>URL do Site/Página de Produtos</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input 
              type="url" 
              value={scrapeUrl}
              onChange={e => setScrapeUrl(e.target.value)}
              placeholder="https://exemplo.com/produtos"
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={handleScrape} disabled={isScraping}>
              {isScraping ? <span className="spinner"></span> : 'Analisar Site'}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Nossa IA irá navegar no site e extrair nomes, preços e fotos automaticamente.
          </p>
        </div>

        {scrapedProducts.length > 0 && (
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem', fontWeight: 600 }}>Produtos encontrados ({scrapedProducts.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {scrapedProducts.map((p, i) => (
                <div key={i} className="glass-panel" style={{ 
                  padding: '0.75rem', 
                  display: 'flex', 
                  gap: '1rem', 
                  border: selectedScrapedIndices.includes(i) ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  position: 'relative'
                }} onClick={() => {
                  if (selectedScrapedIndices.includes(i)) {
                    setSelectedScrapedIndices(prev => prev.filter(idx => idx !== i));
                  } else {
                    setSelectedScrapedIndices(prev => [...prev, i]);
                  }
                }}>
                  <input 
                    type="checkbox" 
                    checked={selectedScrapedIndices.includes(i)} 
                    onChange={() => {}} 
                    style={{ position: 'absolute', top: '10px', right: '10px' }}
                  />
                  <img 
                    src={p.imagem || p.foto || p.imagemUrl || 'https://via.placeholder.com/100'} 
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.2 }}>{p.nome}</div>
                    <div style={{ color: 'var(--accent-color)', fontWeight: 700, marginTop: '0.25rem' }}>R$ {p.preco}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {p.descricao}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scrapedProducts.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" style={{ padding: '0.75rem 2.5rem' }} onClick={importSelectedProducts} disabled={isScraping}>
              {isScraping ? <span className="spinner"></span> : `Importar ${selectedScrapedIndices.length} Produtos`}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="layout-wrapper">
      <Sidebar />

      {/* Notificações (Toasts) */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className={`glass-panel toast-item ${t.type}`} style={{ 
            padding: '1rem 1.5rem', 
            borderLeft: `4px solid ${t.type === 'warning' ? 'var(--warning)' : 'var(--success)'}`,
            background: 'rgba(24, 24, 27, 0.95)',
            animation: 'slideInRight 0.3s ease',
            minWidth: '280px'
          }}>
            <div style={{ fontWeight: 600, color: 'white' }}>Atenção!</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.message}</div>
          </div>
        ))}
      </div>

      {isScrapeModalOpen && renderScrapeModal()}

      <main className="main-content">
        <header className="header-actions">
          <div>
            <h1>Estoque: {clienteAtual?.nome}</h1>
            <p className="subtitle">Painel de Controle e Sincronia com RAG</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-outline" onClick={() => setIsScrapeModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={16} /> 
              Importar do Site
            </button>
            <button className="btn-primary" onClick={openNewProduct}>
              <span style={{ marginRight: '8px' }}>+</span> 
              Novo Produto
            </button>
          </div>
        </header>

        <div className="glass-panel table-container">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Descrição</th>
                <th>Preço (R$)</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                    Nenhum produto cadastrado para este cliente.
                  </td>
                </tr>
              )}
              {produtosFiltrados.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      <img className="product-image" src={p.imagemUrl || `https://via.placeholder.com/150/1e1e1e/FFFFFF?text=${p.nome.charAt(0)}`} alt={p.nome} />
                      <strong>{p.nome}</strong>
                    </div>
                  </td>
                  <td>{p.descricao}</td>
                  <td>R$ {p.preco.toFixed(2)}</td>
                  <td>
                    <span className={`stock-badge ${getStockClass(p.estoque)}`}>
                      {p.estoque} Unid.
                    </span>
                  </td>
                  <td>
                    <button className="btn-outline" onClick={() => openEditProduct(p)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal / Formulário */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
              <button className="btn-outline" onClick={() => setIsModalOpen(false)}>X</button>
            </div>

            <div className="form-group row">
              <div>
                <label>Nome do Produto</label>
                <input 
                  type="text" 
                  value={formState.nome} 
                  onChange={e => setFormState({...formState, nome: e.target.value})} 
                  placeholder="Ex: Pneu Aro 13" 
                />
              </div>
              <div>
                <label>Upload Imagem Supabase</label>
                <div className="upload-area" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => document.getElementById('file-upload')?.click()}>
                  {imageFile ? imageFile.name : (formState.imagemUrl ? 'Imagem atual salva. Clique para alterar.' : '⬇️ Clique para anexar Imagem')}
                  <input 
                    id="file-upload"
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }} 
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Descrição rica (Muitos detalhes ajudam o RAG LangChain)</label>
              <textarea 
                rows={3} 
                value={formState.descricao} 
                onChange={e => setFormState({...formState, descricao: e.target.value})} 
                placeholder="Detalhe o produto para que a IA tenha excelente contexto semântico..."
              />
            </div>

            <div className="form-group row">
              <div>
                <label>Preço</label>
                <input 
                  type="text" 
                  value={formatCurrency(formState.preco || 0)} 
                  onChange={handlePriceChange} 
                />
              </div>
              <div>
                <label>Qtd. no Estoque</label>
                <input 
                  type="number" 
                  value={formState.estoque} 
                  onChange={e => setFormState({...formState, estoque: parseInt(e.target.value) || 0})} 
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsModalOpen(false)} disabled={isUploading}>Cancelar</button>
              <button className="btn-primary" onClick={saveProduct} disabled={isUploading} style={{ display: 'flex', alignItems: 'center' }}>
                {isUploading ? (
                  <>
                    <span className="spinner"></span>
                    Enviando imagem...
                  </>
                ) : 'Salvar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
