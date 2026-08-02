import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { parseCifraClubHtml } from './src/utils/cifraClubScraper';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI on server
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function scrapeCifraClubUrl(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    return parseCifraClubHtml(html, url);
  } catch (e) {
    console.error('Scrape Cifra Club Error:', e);
    return null;
  }
}

// API route to retrieve chords directly from a pasted Cifra Club link
app.post('/api/search-chords', async (req, res) => {
  try {
    const { query, url } = req.body;
    let rawUrl = (url || query || '').trim();

    if (!rawUrl) {
      return res.status(400).json({
        error: 'Por favor, cole o link da cifra do Cifra Club.'
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

    const scraped = await scrapeCifraClubUrl(rawUrl);
    if (scraped) {
      console.log(`Cifra extraída com sucesso do Cifra Club: ${scraped.artist} - ${scraped.title} (${rawUrl})`);
      return res.json({
        success: true,
        song: scraped,
        source: 'Cifra Club (Oficial)'
      });
    } else {
      return res.status(404).json({
        error: 'Não foi possível extrair a cifra desta página do Cifra Club. Verifique se o link está correto e completo.'
      });
    }
  } catch (error: any) {
    console.error('Erro na rota /api/search-chords:', error);
    return res.status(500).json({ error: error.message || 'Erro ao carregar a cifra do Cifra Club.' });
  }
});

// API route to calculate smart tone suggestions
app.post('/api/suggest-key', async (req, res) => {
  try {
    const { songTitle, artist, currentKey, vocalRange } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.status(500).json({ error: 'Chave Gemini não configurada.' });
    }

    const prompt = `Como arranjador musical experiente, analise a música "${songTitle}" de "${artist}" que está no tom "${currentKey}".
Forneça sugestões de tom para a preferência do cantor: "${vocalRange}" (ex: Voz Masculina Aguda, Voz Feminina Suave, Tom Sem Pestanas para Iniciante, Tom Mais Grave).

Responda em JSON válido:
{
  "suggestedKey": "D",
  "explanation": "Explicação curta do motivo da sugestão em português",
  "easierChords": ["D", "A", "Bm", "G"],
  "capoAlternative": "Você pode usar Capo na 2ª casa no tom de C para soar em D"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    return res.json({ success: true, suggestion: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server CifraMaster rodando em http://localhost:${PORT}`);
  });
}

startServer();
