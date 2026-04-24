# Arquitetura RAG Auto-Atualizável (Supabase pgvector + Banco + Frontend)

Este documento foi criado para orientar desenvolvedores e Inteligências Artificiais (como o agente Antigravity) a replicar uma arquitetura RAG (Retrieval-Augmented Generation) coesa.
Ele detalha desde a camada Frontend (UI/UX) do Cadastro de Produtos (e vínculos/insumos) até chegar no PostgreSQL e na orquestração dos Embeddings via Supabase pgvector e LangChain. A leitura atenta deste documento garante a recriação *pixel-perfect* num novo projeto.

---

## 📌 1. A Camada Frontend: Cadastro Inteligente (React / Next.js)

A construção da GUI da Tabela de Produtos deve sempre favorecer a **Experiência do Usuário (Offline-First State)** para itens complexos em forma de Mestre-Detalhe (Ex: O Produto e seus Insumos formam uma Ficha Técnica).

### 1.1 Vínculos Independentes de ID Prévio
- **Nunca force** o usuário a "Salvar o Produto 1º" para só então liberar a tela de "Adicionar Insumos/Ingredientes". E muito menos insira itens associativos diretamente no banco de dados isoladamente.
- **Como a IA deve construir o Form:** A tela abre modal com estado vazio (`editingId = null`). O usuário pode anexar Insumos e Produtos à vontade porque ficam atracados numa variável de Estado em memória (React `useState`, ex: `vinculos = []`).
- **Orquestração de Save:** Apenas no clique final de "Salvar" o fluxo ocorre no banco de forma atômica:
  1. Cria ou Atualiza a linha mãe (`produto`);
  2. Extrai o ID da resposta;
  3. `DELETE` todos os vínculos-filhos no DB com base no novo/velho ID mãe;
  4. Mapeia e dá `INSERT` bulk de toda a variável de array de `vinculos` direto na tabela ponte (`insumos`), passando o ID recém-criado na linha mãe.

### 1.2 Tratamento do Supabase Storage (Imagens do Cardápio)
Ao injetarmos imagens para o Agente ter referência, você DEVE construir uma feature de *Upload assíncrono* de imagem:
- **Bucket Spec:** Exija ou crie o bucket com nome `produtos` ativando `public: true`! O URL salvo na `tabela_negocios` tem de ser do modelo `.../public/produtos/nomegerado.png` (via `getPublicUrl`).
- **Row-Level Security p/ Buckets:** O upload do frontend quebrará se a RLS `storage.objects` não estiver mapeada. A IA DEVE gerar e fornecer a *Migration SQL* de Storage (Ver Seção 2).

---

## 📌 2. Segurança de Arquivos do Storage (Migration Necessária)

Para garantir que o passo de frontend acima funcione e não acuse `row violates row-level security policy` quando subir o Payload de Imagem, a IA deve replicar esta Migration e executá-la no ambiente antes:

```sql
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true) on conflict (id) do nothing;
-- Setup das políticas de upload e acesso
create policy "Permitir leitura publica" on storage.objects for select using (bucket_id = 'produtos');
create policy "Permitir envios" on storage.objects for insert with check (bucket_id = 'produtos');
create policy "Permitir updates" on storage.objects for update using (bucket_id = 'produtos');
create policy "Permitir deletes" on storage.objects for delete using (bucket_id = 'produtos');
```

---

## 📌 3. A Estrutura da Tabela do RAG Backend

Agora o objeto final está no Banco com Imagem atrelada. Em vez de inventar metadados, criamos uma Store Vetorial padrão da LangChain. Isso torna o modelo plug-and-play em n8n e agents python.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela puríssima seguindo a taxonomia global RAG
CREATE TABLE "RAG_Documentos" (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(1536) -- ex: p/ openai
);
```

---

## 📌 4. Sincronização e Deleção Real-Time com Triggers (Crucial)

RAGs normais falham em dados transacionais pois os itens do mundo real sofrem flutuações. Não use *CRON Jobs*.

**Regra de Ouro:**
A IA ou Webhook externo gera APENAS os embeddings. O Postgres lida com CRUD do nó textual `content`.
Os dados do RAG antigo NÃO sofrem `UPDATE`. O nó para o item mãe deve ser **DELETADO (procura exata via JSONB do metadata)** e em seguida, o seu equivalente atualizado reconstituído é gerado do zero.

Exemplo Universal de Trigger Inteligente (Aplicado a referências complexas):

```sql
CREATE OR REPLACE FUNCTION atualiza_rag_sync_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_RefId INT;
    v_TextoContexto TEXT;
    v_Metadata JSONB;
BEGIN
    -- 1. Descobre se é UPDATE, DELETE ou INSERT da tabela mãe (ou filha/ponte)
    IF TG_OP = 'DELETE' THEN v_RefId := OLD."idParaSincronia"; ELSE v_RefId := NEW."idParaSincronia"; END IF;

    -- 2. Purga completa e impiedosa do nó atômico para evitar lixo semântico (busca cross-JSONB)
    DELETE FROM "RAG_Documentos" WHERE metadata->>'id_ref' = v_RefId::text;

    -- 3. Inserir a nova versão (SE a operação não tiver sido um DELETE originário do PAI)
    IF TG_OP != 'DELETE' THEN
        -- a. Faça seus SELECTS com JOINs aqui! 
        -- Puxe o produto, estoques cruzados, nome e qtd dos Insumos da tabela ponte do FrontEnd
        -- b. Concatene com regras literais para que o LLM entenda
        v_TextoContexto := concat('A entidade X tem as propriedades: ', NEW."prop1", ' ...');
        
        -- c. Inject Jsonb estilo LangChain obrigatório ('loc', 'source', chaves livres custom)
        v_Metadata := jsonb_build_object(
            'id_ref', v_RefId,
            'source', concat('referencia_db_', v_RefId),
            'loc', jsonb_build_object('lines', jsonb_build_object('from', 1, 'to', 1)) 
        );

        -- d. Insert silencioso (embedding preenchido assincronamente por hooks n8n ou SDK)
        INSERT INTO "RAG_Documentos" (content, metadata) VALUES (v_TextoContexto, v_Metadata);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ligar à fonte
CREATE TRIGGER trg_atual_rag_produto AFTER INSERT OR UPDATE OR DELETE ON tabela_negocio FOR EACH ROW EXECUTE FUNCTION atualiza_rag_sync_fn();
```

---

## 📌 5. Script de Carga Inicial Sólida (Batch Bulk)

IAs: Sempre que criar uma base com esse mecanismo, ou reestruturar as colunas mãe, você deve entregar um laço `DO/FOR` manual para ser executado no Console. Ele limpa e povoa a `tabela de RAG` puxando todo o Banco numa rajada só e impedindo que produtos já existentes antes da feature tornem-se indetectáveis.

```sql
DO $$
DECLARE
    r_rec RECORD;
    v_TextoContexto TEXT;
    v_Metadata JSONB;
BEGIN
    FOR r_rec IN (SELECT * FROM tabela_negocio) LOOP
        -- Tratar e limpar para evitar conflitos/duplicações nativas na hora de criar do zero
        DELETE FROM "RAG_Documentos" WHERE metadata->>'id_ref' = r_rec."idDaEntidade"::text;

        v_TextoContexto := concat('Dado Histórico: ', r_rec."detalhes");
        v_Metadata := jsonb_build_object('id_ref', r_rec."idDaEntidade", 'source', concat('carga_inicial_', r_rec."idDaEntidade"), 'loc', jsonb_build_object('lines', jsonb_build_object('from', 1, 'to', 1)));

        INSERT INTO "RAG_Documentos" (content, metadata) VALUES (v_TextoContexto, v_Metadata);
    END LOOP;
END;
$$;
```
