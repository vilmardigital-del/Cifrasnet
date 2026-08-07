import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

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
    const { songTitle, artist, currentKey, vocalRange } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chave Gemini (GEMINI_API_KEY) não configurada no ambiente.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'ciframaster-app',
        },
      },
    });

    const prompt = `Como arranjador musical experiente, analise a música "${songTitle}" de "${artist}" que está no tom "${currentKey}".
Forneça sugestões de tom para a preferência do cantor: "${vocalRange}" (ex: Voz Masculina Aguda, Voz Feminina Suave, Tom Sem Pestanas para Iniciante, Tom Mais Grave).

Responda em JSON válido:
{
  "suggestedKey": "D",
  "explanation": "Explicação curta do motivo da sugestão em português",
  "easierChords": ["D", "A", "Bm", "G"],
  "capoAlternative": "Você pode usar Capo na 2ª casa no tom de C para soar em D"
}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const data = JSON.parse(response.text || '{}');
        return res.status(200).json({ success: true, suggestion: data });
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Não foi possível gerar sugestão com Gemini.');
  } catch (error: any) {
    console.error('Erro na Vercel API /api/suggest-key:', error);
    return res.status(500).json({ error: error.message || 'Erro ao sugerir tom.' });
  }
}
