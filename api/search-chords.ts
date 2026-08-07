import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseCifraClubHtml, slugify } from '../src/utils/cifraClubScraper';
import { extractChordsFromText } from '../src/utils/chordTransposer';
import { GoogleGenAI } from '@google/genai';

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
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  // 1. Direct fetch
  try {
    const res = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseCifraClubHtml(html, targetUrl);
      if (parsed && parsed.chordsText && parsed.chordsText.length > 20) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Direct fetch to Cifra Club failed:', e);
  }

  // 2. Proxy fetch fallback (useful if Vercel serverless IP is blocked by Cifra Club Cloudflare)
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const html = await res.text();
        const parsed = parseCifraClubHtml(html, targetUrl);
        if (parsed && parsed.chordsText && parsed.chordsText.length > 20) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Proxy fetch failed:', proxyUrl, e);
    }
  }

  return null;
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
      console.warn(`Gemini model ${modelName} failed, trying next...`, err);
    }
  }

  return null;
}

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
        return res.status(200).json({
          success: true,
          song: scraped,
          source: 'Cifra Club (Oficial)'
        });
      }
    } else {
      // Try constructing Cifra Club URL from title/artist query
      const parts = input.split(/[-–—]/).map(s => s.trim());
      let candidateUrls: string[] = [];

      if (parts.length >= 2) {
        const s1 = slugify(parts[0]);
        const s2 = slugify(parts[1]);
        if (s1 && s2) {
          candidateUrls.push(`https://www.cifraclub.com.br/${s1}/${s2}/`);
          candidateUrls.push(`https://www.cifraclub.com.br/${s2}/${s1}/`);
        }
      } else {
        const words = input.split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
          // e.g. "tempo perdido legiao urbana" -> try first word as artist or last word as artist
          const sAll = slugify(input);
          candidateUrls.push(`https://www.cifraclub.com.br/${sAll}/`);
        }
      }

      for (const candidateUrl of candidateUrls) {
        const scraped = await scrapeCifraClubUrl(candidateUrl);
        if (scraped && scraped.chordsText && scraped.chordsText.length > 30) {
          return res.status(200).json({
            success: true,
            song: scraped,
            source: 'Cifra Club (Oficial)'
          });
        }
      }
    }

    // Try generating or fetching via Gemini AI if link scraping failed or if it's a search term
    const aiSong = await generateSongWithGemini(input);

    if (aiSong) {
      return res.status(200).json({
        success: true,
        song: aiSong,
        source: 'CifraMaster AI'
      });
    }

    return res.status(404).json({
      error: 'Não foi possível carregar a cifra solicitada. Verifique o nome da música e tente novamente.'
    });
  } catch (error: any) {
    console.error('Erro na Vercel API /api/search-chords:', error);
    return res.status(500).json({
      error: error.message || 'Erro ao carregar a cifra.'
    });
  }
}

