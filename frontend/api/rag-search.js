import { createClient } from '@supabase/supabase-js';

const embeddingModel = 'text-embedding-3-small';

async function createEmbedding(apiKey, input) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: embeddingModel,
      input
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro ao gerar embedding');
  }

  return data.data?.[0]?.embedding;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, tenantId, matchCount = 8 } = req.body || {};

  if (!query || !tenantId) {
    return res.status(400).json({ error: 'Missing query or tenantId' });
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!openAiKey || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'RAG search environment not configured' });
  }

  try {
    const queryEmbedding = await createEmbedding(openAiKey, query);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc('match_conhecimento', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter: { tenant_id: tenantId }
    });

    if (error) throw error;

    console.log('[RAG match_conhecimento]', {
      tenantId,
      query,
      matches: data?.length || 0,
      topSimilarity: data?.[0]?.similarity
    });

    return res.status(200).json({ matches: data || [] });
  } catch (error) {
    console.error('[RAG match_conhecimento] Erro:', error);
    return res.status(500).json({ error: error.message || 'Erro ao consultar RAG' });
  }
}
