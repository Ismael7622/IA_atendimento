-- ======= ESTRUTURA PARA RAG AUTO-ATUALIZÁVEL MULTI-TENANT ======= --
-- Baseado nas diretrizes do readmeRAG.md
-- Objetivo: Permitir que "Lojas de Motos" e "Floriculturas" usem o mesmo bot sem misturar dados (isolamento via tenant_id).

CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================================
-- 1. TABELAS TRANSACIONAIS (Onde o usuário controla o estoque no Frontend)
-- =========================================================================

-- Tabela principal de negócio (ex: Produtos de uma loja)
CREATE TABLE IF NOT EXISTS tb_produtos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL, -- CHAVE MULTI-TENANT: String do nome da loja/cliente vinda do outro BD.
  nome text NOT NULL,
  descricao text,
  preco numeric NOT NULL DEFAULT 0,
  estoque integer NOT NULL DEFAULT 0,
  imagem_url text, -- Integração recomendada com Supabase Storage
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela transacional de dúvidas frequentes
CREATE TABLE IF NOT EXISTS tb_duvidas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  pergunta text NOT NULL,
  resposta text NOT NULL,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Segurança de nível de linha (RLS) para proteção transacional no Supabase Pessoal
ALTER TABLE tb_produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants só acessam seus próprios produtos" ON tb_produtos
  USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'loja_id')); -- Exemplo pegando o nome da JWT

ALTER TABLE tb_duvidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenants só acessam suas próprias dúvidas" ON tb_duvidas
  USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'loja_id'));


-- =========================================================================
-- 2. TABELAS VETORIAIS (RAG) - Exigidas nas regras (Não sofrem update direto)
-- =========================================================================

-- Tabela RAG para Produtos
CREATE TABLE IF NOT EXISTS atendimento_produtos (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(1536) -- Padrão OpenAI (text-embedding-ada-002 ou 3-small)
);

-- Tabela RAG para Dúvidas
CREATE TABLE IF NOT EXISTS atendimento_duvidas (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(1536)
);

-- =========================================================================
-- 3. TRIGGERS INTELIGENTES DE SINCRONIZAÇÃO EM TEMPO REAL
-- Função: Quando um Produto sofre Inserção, Edição ou Exclusão, o nó do RAG
-- é apagado e recriado com os novos dados puros.
-- =========================================================================

CREATE OR REPLACE FUNCTION sync_atendimento_produtos_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_RefId text;
    v_TextoContexto TEXT;
    v_Metadata JSONB;
BEGIN
    -- Captura o ID da linha transacional sofrendo alteração
    IF TG_OP = 'DELETE' THEN v_RefId := OLD.id::text; ELSE v_RefId := NEW.id::text; END IF;

    -- 1. Regra de Ouro: Purga o RAG antigo (Busca cross-JSONB para não poluir embeddings)
    DELETE FROM atendimento_produtos WHERE metadata->>'id_ref' = v_RefId;

    -- 2. Se não era DELETE, recria a versão mais atualizada para a Inteligência Artificial ler
    IF TG_OP != 'DELETE' THEN
        -- Concatena de forma semântica/humana
        v_TextoContexto := concat('Produto: ', NEW.nome, '. Descrição: ', COALESCE(NEW.descricao, 'Não informada'), '. Preço: R$', NEW.preco, '. Estoque atual disponível: ', NEW.estoque, ' unidades.');
        
        -- Multi-Tenant: Salva o tenant_id no metadata para filtrar na busca e não misturar dados
        v_Metadata := jsonb_build_object(
            'id_ref', v_RefId,
            'tenant_id', NEW.tenant_id,
            'source', concat('tb_produtos_', v_RefId),
            'type', 'produto'
        );

        -- Insere sem embedding, um Worker ou n8n ou SDK irá preencher a coluna "embedding" depois.
        INSERT INTO atendimento_produtos (content, metadata) VALUES (v_TextoContexto, v_Metadata);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_produtos 
AFTER INSERT OR UPDATE OR DELETE ON tb_produtos 
FOR EACH ROW EXECUTE FUNCTION sync_atendimento_produtos_fn();


CREATE OR REPLACE FUNCTION sync_atendimento_duvidas_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_RefId text;
    v_TextoContexto TEXT;
    v_Metadata JSONB;
BEGIN
    IF TG_OP = 'DELETE' THEN v_RefId := OLD.id::text; ELSE v_RefId := NEW.id::text; END IF;

    -- Purga RAG Antigo
    DELETE FROM atendimento_duvidas WHERE metadata->>'id_ref' = v_RefId;

    IF TG_OP != 'DELETE' THEN
        v_TextoContexto := concat('Usuário pergunta: ', NEW.pergunta, ' | Resposta Oficial da Empresa: ', NEW.resposta);
        
        v_Metadata := jsonb_build_object(
            'id_ref', v_RefId,
            'tenant_id', NEW.tenant_id,
            'source', concat('tb_duvidas_', v_RefId),
            'type', 'duvida'
        );

        INSERT INTO atendimento_duvidas (content, metadata) VALUES (v_TextoContexto, v_Metadata);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_duvidas 
AFTER INSERT OR UPDATE OR DELETE ON tb_duvidas 
FOR EACH ROW EXECUTE FUNCTION sync_atendimento_duvidas_fn();

-- =========================================================================
-- 4. FUNÇÕES DE BUSCA VETORIAL ISOLADA POR TENANT (Para plugar na IA / LangChain)
-- Esta função garante que a IA busque SOMENTE os embeddings da Loja/Usuário atual.
-- Não mistura o RAG de Moto com a Floricultura.
-- =========================================================================

CREATE OR REPLACE FUNCTION buscar_produtos_rag(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_tenant_id text
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.id,
    ap.content,
    ap.metadata,
    1 - (ap.embedding <=> query_embedding) AS similarity
  FROM atendimento_produtos ap
  WHERE 
    ap.metadata->>'tenant_id' = p_tenant_id::text -- FILTRO MANDATORIO ANTI-VAZAMENTO
    AND 1 - (ap.embedding <=> query_embedding) > match_threshold
  ORDER BY ap.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
