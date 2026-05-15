-- ======= SISTEMA DE NÍVEIS DE USUÁRIO ======= --

-- 1. Criar tabela de permissões de usuários
CREATE TABLE IF NOT EXISTS z_bd_usuarios_permissoes (
  email text PRIMARY KEY,
  level text NOT NULL DEFAULT 'gestor', -- 'semi-Deus' | 'gestor'
  created_at timestamptz DEFAULT now()
);

-- 2. Inserir usuário semi-Deus (Ismael)
INSERT INTO z_bd_usuarios_permissoes (email, level) 
VALUES ('ismael.matias7622@gmail.com', 'semi-Deus')
ON CONFLICT (email) DO UPDATE SET level = 'semi-Deus';

-- 3. Inserir usuários existentes como gestores
-- Pega todos os emails que já possuem clientes cadastrados e define como gestor
INSERT INTO z_bd_usuarios_permissoes (email, level)
SELECT DISTINCT user_id, 'gestor' 
FROM z_bd_atendimento_clientes 
WHERE user_id != 'ismael.matias7622@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- 4. Habilitar RLS na tabela de permissões (Leitura para todos autenticados verem seu próprio nível)
ALTER TABLE z_bd_usuarios_permissoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem suas próprias permissões" ON z_bd_usuarios_permissoes;
CREATE POLICY "Usuários veem suas próprias permissões" ON z_bd_usuarios_permissoes
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- 5. Política para o semi-Deus ver todas as permissões
DROP POLICY IF EXISTS "Semi-Deus vê todas as permissões" ON z_bd_usuarios_permissoes;
CREATE POLICY "Semi-Deus vê todas as permissões" ON z_bd_usuarios_permissoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM z_bd_usuarios_permissoes 
      WHERE email = (auth.jwt() ->> 'email') AND level = 'semi-Deus'
    )
  );
