import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

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
  created_at?: string;
};

// Aqui vamos simular que os clientes vêm do banco também, ou manter no Mock por enquanto
const mockClientes: Cliente[] = [
  { id: 'cli1', nome: 'Floricultura da Maria' },
  { id: 'cli2', nome: 'Moto Peças São João' },
  { id: 'cli3', nome: 'Tech Store' },
];

export default function App() {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<'home' | 'client-hub' | 'inventory'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Clientes State
  const [clientes, setClientes] = useState<Cliente[]>([]);
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

  const [clientForm, setClientForm] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

  useEffect(() => {
    if (isLoggedIn) fetchClientes();
  }, [isLoggedIn]);

  useEffect(() => {
    if (view === 'inventory' && selectedClienteId) {
      fetchProdutos();
    }
  }, [selectedClienteId, view]);

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('bd_atendimento_clientes')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      alert('Erro ao carregar clientes do banco: ' + error.message);
      return;
    }
    setClientes(data || []);
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

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from('tb_produtos')
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
    if (email === 'teste@teste.com' && password === 'teste12345') {
      setIsLoggedIn(true);
    } else {
      alert('Credenciais inválidas! Use teste@teste.com / teste12345');
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
      const { error } = await supabase.from('tb_produtos').update(dbPayload).eq('id', editingId);
      if (error) {
        setIsUploading(false);
        return alert("Erro ao editar: " + error.message);
      }
    } else {
      const { error } = await supabase.from('tb_produtos').insert([dbPayload]);
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
    
    const newId = 'cust_' + Date.now().toString(36);
    const { error } = await supabase
      .from('bd_atendimento_clientes')
      .insert([{ ...clientForm, id: newId }]);

    if (error) return alert("Erro ao salvar cliente: " + error.message);

    setClientForm({ nome: '', email: '', telefone: '' });
    setIsClientModalOpen(false);
    fetchClientes();
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
            <h1>Olá, Ismael!</h1>
            <p className="subtitle">Bem-vindo ao seu centro de comando Multi-Tenant.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={() => setIsClientModalOpen(true)}>
              + Novo Cliente
            </button>
          </div>
        </header>

        <div className="grid-cards">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div className="action-card" onClick={() => setIsClientModalOpen(true)}>
                <h3>🚀 Comece agora</h3>
                <p>Adicione seu primeiro cliente para gerenciar estoque e RAG.</p>
              </div>
              <button className="btn-outline" onClick={fetchClientes} style={{ alignSelf: 'center' }}>
                🔄 Atualizar Banco (Caso tenha acabado de criar as tabelas)
              </button>
            </div>
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
            <button className="hub-option-btn" onClick={() => alert('Em breve: Configurações')}>
              <div className="icon-box">⚙️</div>
              <div>
                <h4>Configuração</h4>
                <p>Ajuste dados do perfil, APIs e preferências.</p>
              </div>
            </button>
            <button className="hub-option-btn" onClick={() => alert('Em breve: Conversas')}>
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

  return (
    <div className="layout-wrapper">
      {/* Sidebar Sidebar Múltiplos Clientes */}
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

      {/* Main Content */}
      <main className="main-content">
        <header className="header-actions">
          <div>
            <h1>Estoque: {clienteAtual?.nome}</h1>
            <p className="subtitle">Painel de Controle e Sincronia com RAG</p>
          </div>
          <button className="btn-primary" onClick={openNewProduct}>
            <span style={{ marginRight: '8px' }}>+</span> 
            Novo Produto
          </button>
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
