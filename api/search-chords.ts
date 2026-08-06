import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseCifraClubHtml } from '../src/utils/cifraClubScraper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { query, url } = body;
    let rawUrl = (url || query || '').trim();

    if (!rawUrl) {
      return res.status(400).json({
        error: 'Por favor, informe ou cole o link da cifra do Cifra Club.'
      });
    }

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = 'https://' + rawUrl;
    }

    if (!rawUrl.includes('cifraclub.com.br')) {
      return res.status(400).json({
        error: 'Link inválido. A busca deve ser feita colando um link do Cifra Club. Exemplo: https://www.cifraclub.com.br/legiao-urbana/tempo-perdido/'
      });
    }

    // Fetch HTML from Cifra Club
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Não foi possível acessar a página do Cifra Club (Código ${response.status}). Verifique o link e tente novamente.`
      });
    }

    const html = await response.text();
    const scraped = parseCifraClubHtml(html, rawUrl);

    if (scraped) {
      return res.status(200).json({
        success: true,
        song: scraped,
        source: 'Cifra Club (Oficial)'
      });
    } else {
      return res.status(404).json({
        error: 'Não foi possível extrair a cifra desta página. Certifique-se de colar o link exato da música no Cifra Club.'
      });
    }
  } catch (error: any) {
    console.error('Erro na Vercel API /api/search-chords:', error);
    return res.status(500).json({
      error: error.message || 'Erro ao carregar e extrair a cifra do Cifra Club.'
    });
  }
}
