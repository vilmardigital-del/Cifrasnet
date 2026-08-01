import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

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

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s\-]/g, '')
    .trim()
    .replace(/[\s\_]+/g, '-');
}

async function scrapeCifraClubUrl(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (res.status !== 200) return null;
    const html = await res.text();

    const preMatch = html.match(/<pre[^>]*data-chord-content=\"true\"[^>]*>([\s\S]*?)<\/pre>/i);
    if (!preMatch) return null;

    let title = 'Música Sem Título';
    let artist = 'Artista Desconhecido';

    const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleTagMatch) {
      const cleanTitle = titleTagMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');
      const parts = cleanTitle.split(' - ');
      if (parts.length >= 2) {
        title = parts[0].trim();
        artist = parts[1].trim();
      }
    }

    const chordNames = [...html.matchAll(/data-chord-name=\"([^\"]+)\"/gi)].map((m) => m[1]);
    const uniqueChords = [...new Set(chordNames)];

    let tom = 'C';
    const tomIdx = html.indexOf('Diminuir tom');
    if (tomIdx !== -1) {
      const tomSnippet = html.slice(tomIdx, tomIdx + 500);
      const tomP = tomSnippet.match(/<p[^>]*>([A-G][b#]?[m]?.*?)<\/p>/i);
      if (tomP) tom = tomP[1].trim();
    }

    let pre = preMatch[1];
    pre = pre
      .replace(/<\/div>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<b[^>]*data-chord-name=\"([^\"]+)\"[^>]*>[\s\S]*?<\/b>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');

    return {
      id: 'cifraclub_' + slugify(artist) + '_' + slugify(title),
      title,
      artist,
      originalKey: tom,
      currentKey: tom,
      difficulty: 'Médio',
      genre: 'Nacional',
      chordsText: pre.trim(),
      chordsUsed: uniqueChords,
      cifraClubUrl: url,
      source: 'Cifra Club (Oficial)',
    };
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
