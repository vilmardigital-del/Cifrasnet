import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { parseCifraClubHtml } from './src/utils/cifraClubScraper';
import { extractChordsFromText } from './src/utils/chordTransposer';

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
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const res = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    return parseCifraClubHtml(html, targetUrl);
  } catch (e) {
    console.error('Scrape Cifra Club Error:', e);
    return null;
  }
}

async function generateSongWithGemini(queryOrUrl: string) {
  const ai = getAiClient();
  if (!ai) return null;

  const prompt = `Você é o maior banco de dados e especialista em cifras de músicas brasileiras e internacionais.
O usuário solicitou a cifra para: "${queryOrUrl}".

Forneça a cifra COMPLETA, EXATA e PERFEITAMENTE FORMATADA para esta música.
Regras de formatação da cifra (chordsText):
- Use marcadores de seção entre colchetes como [Intro], [Primeira Parte], [Pré-Refrão], [Refrão], [Segunda Parte], [Solo], [Ponte], [Final].
- Mantenha os acordes alinhados acima das letras das linhas correspondentes (ou use notação com colchetes [C] [G] se for mais claro).
- Inclua a letra inteira da música sem truncar nenhuma estrofe.

Responda ESTRITAMENTE em formato JSON com o seguinte esquema:
{
  "title": "Nome Exato da Música",
  "artist": "Nome Exato do Artista ou Banda",
  "originalKey": "C",
  "difficulty": "Médio",
  "genre": "Rock Nacional",
  "recommendedBpm": 120,
  "chordsText": "Texto completo da cifra...",
  "chordsUsed": ["C", "G", "Am", "F"]
}`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (!text) continue;

      const data = JSON.parse(text);
      if (!data.title || !data.chordsText) continue;

      const slug = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const chordsUsed = Array.isArray(data.chordsUsed) && data.chordsUsed.length > 0
        ? data.chordsUsed
        : extractChordsFromText(data.chordsText);

      return {
        id: 'cifra_' + slug(data.artist) + '_' + slug(data.title) + '_' + Date.now().toString(36),
        title: data.title,
        artist: data.artist || 'Artista',
        originalKey: data.originalKey || 'C',
        currentKey: data.originalKey || 'C',
        difficulty: data.difficulty || 'Médio',
        genre: data.genre || 'Nacional',
        recommendedBpm: Number(data.recommendedBpm) || 120,
        chordsText: data.chordsText,
        chordsUsed,
        cifraClubUrl: queryOrUrl.includes('cifraclub.com.br') ? queryOrUrl : '',
        source: 'CifraMaster AI'
      };
    } catch (err) {
      console.warn(`Gemini model ${modelName} failed on server, trying next...`, err);
    }
  }

  return null;
}

// API route to retrieve chords directly from a pasted Cifra Club link or song name
app.post('/api/search-chords', async (req, res) => {
  try {
    const { query, url } = req.body;
    let input = (url || query || '').trim();

    if (!input) {
      return res.status(400).json({
        error: 'Por favor, digite o nome da música ou cole o link do Cifra Club.'
      });
    }

    const isUrl = input.includes('cifraclub.com.br') || input.startsWith('http://') || input.startsWith('https://');

    if (isUrl) {
      let targetUrl = input;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      const scraped = await scrapeCifraClubUrl(targetUrl);
      if (scraped && scraped.chordsText && scraped.chordsText.length > 30) {
        console.log(`Cifra extraída com sucesso do Cifra Club: ${scraped.artist} - ${scraped.title}`);
        return res.json({
          success: true,
          song: scraped,
          source: 'Cifra Club (Oficial)'
        });
      }
    }

    // Try generating or fetching via Gemini AI if link scraping failed or if it's a search term
    console.log(`Buscando cifra via inteligência CifraMaster para: "${input}"`);
    const aiSong = await generateSongWithGemini(input);

    if (aiSong) {
      return res.json({
        success: true,
        song: aiSong,
        source: 'CifraMaster AI'
      });
    }

    return res.status(404).json({
      error: 'Não foi possível carregar a cifra solicitada. Verifique o nome da música e tente novamente.'
    });
  } catch (error: any) {
    console.error('Erro na rota /api/search-chords:', error);
    return res.status(500).json({ error: error.message || 'Erro ao carregar a cifra.' });
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
