import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, Shield, Zap, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user?.email) onLoginSuccess(data.user.email);
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.user?.email) {
          alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left-panel">
        <div className="auth-brand">
          <div className="brand-icon">
            <Shield size={32} color="white" />
          </div>
          <h1>IA Atendimento</h1>
        </div>
        
        <div className="auth-features">
          <div className="feature-item">
            <Zap size={24} color="var(--accent-color)" />
            <div>
              <h3>Automação Inteligente</h3>
              <p>Respostas rápidas e precisas 24/7 para seus clientes.</p>
            </div>
          </div>
          <div className="feature-item">
            <CheckCircle2 size={24} color="#10b981" />
            <div>
              <h3>Gestão de Inventário</h3>
              <p>Sincronize seu catálogo diretamente com o WhatsApp.</p>
            </div>
          </div>
          <div className="feature-item">
            <ArrowRight size={24} color="#6366f1" />
            <div>
              <h3>Dashboard em Tempo Real</h3>
              <p>Monitore cada interação e métrica de conversão.</p>
            </div>
          </div>
        </div>
        
        <div className="auth-footer">
          <p>© 2026 IA Atendimento. Todos os direitos reservados.</p>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <h2>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
            <p>{isLogin ? 'Entre com suas credenciais para acessar o painel' : 'Comece a escalar seu atendimento hoje mesmo'}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            <div className="form-group">
              <label><Mail size={16} /> E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><Lock size={16} /> Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? (
                <Loader2 className="spinner" size={20} />
              ) : (
                <>{isLogin ? <LogIn size={20} /> : <UserPlus size={20} />} {isLogin ? 'Entrar' : 'Cadastrar'}</>
              )}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #09090b;
        }

        .auth-left-panel {
          flex: 1;
          background: radial-gradient(circle at top right, #1e1b4b, #09090b);
          padding: 4rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
        }

        @media (max-width: 968px) {
          .auth-left-panel { display: none; }
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-icon {
          width: 56px;
          height: 56px;
          background: var(--accent-color);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .auth-brand h1 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          max-width: 440px;
        }

        .feature-item {
          display: flex;
          gap: 1.5rem;
        }

        .feature-item h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .feature-item p {
          color: #94a3b8;
          line-height: 1.6;
        }

        .auth-footer p {
          color: #4b5563;
          font-size: 0.9rem;
        }

        .auth-right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #09090b 0%, #111114 100%);
        }

        .auth-card {
          width: 100%;
          max-width: 380px;
          padding: 2.5rem;
          border-radius: 32px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .auth-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }

        .auth-header p {
          color: #94a3b8;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .form-group label {
          color: #e2e8f0;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-group input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.85rem 1rem;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus {
          border-color: var(--accent-color);
          background: rgba(255, 255, 255, 0.05);
          outline: none;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .auth-submit {
          margin-top: 1rem;
          padding: 1.1rem;
          font-weight: 700;
          font-size: 1.05rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .auth-error {
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-radius: 10px;
          font-size: 0.9rem;
          text-align: center;
        }

        .auth-toggle {
          margin-top: 2rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .auth-toggle button {
          background: none;
          border: none;
          color: var(--accent-color);
          font-weight: 700;
          cursor: pointer;
          margin-left: 0.5rem;
          text-decoration: underline;
        }

        .auth-toggle button:hover {
          color: #818cf8;
        }
      `}</style>
    </div>
  );
};
