export default async function handler(req, res) {
  // Permitir apenas POST para o proxy para facilitar o envio de dados
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const { endpoint, method = 'GET', body } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint é obrigatório.' });
  }

  // Chave SEM o prefixo VITE_ (protegida no servidor)
  const apiKey = process.env.EVOLUTION_API_KEY; 
  const baseUrl = process.env.VITE_EVOLUTION_URL || "https://api.storyallday.com";

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        "apikey": apiKey || "",
        "Content-Type": "application/json"
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro no Proxy Evolution:', error);
    return res.status(500).json({ error: 'Erro ao processar requisição no Proxy Evolution' });
  }
}
