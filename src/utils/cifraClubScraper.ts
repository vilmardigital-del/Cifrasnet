export interface ScrapedSong {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  currentKey: string;
  difficulty: string;
  genre: string;
  chordsText: string;
  chordsUsed: string[];
  cifraClubUrl: string;
  source: string;
}

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

export function parseCifraClubHtml(html: string, url: string): ScrapedSong | null {
  if (!html) return null;

  try {
    // 1. Extract Pre / Cifra content block
    let preContent = '';

    const preDataMatch = html.match(/<pre[^>]*data-chord-content=\"true\"[^>]*>([\s\S]*?)<\/pre>/i);
    const preClassMatch = html.match(/<pre[^>]*class=\"[^\"]*cifra[^\"]*\"[^>]*>([\s\S]*?)<\/pre>/i);
    const preGenericMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    const divCntMatch = html.match(/<div[^>]*class=\"[^\"]*cifra_cnt[^\"]*\"[^>]*>([\s\S]*?)<\/div>/i);

    if (preDataMatch && preDataMatch[1].trim()) {
      preContent = preDataMatch[1];
    } else if (preClassMatch && preClassMatch[1].trim()) {
      preContent = preClassMatch[1];
    } else if (preGenericMatch && preGenericMatch[1].trim()) {
      preContent = preGenericMatch[1];
    } else if (divCntMatch && divCntMatch[1].trim()) {
      preContent = divCntMatch[1];
    }

    if (!preContent) {
      return null;
    }

    // 2. Extract Title and Artist
    let title = 'Música Sem Título';
    let artist = 'Artista Desconhecido';

    const h1Match = html.match(/<h1[^>]*class=\"[^\"]*t1[^\"]*\"[^>]*>([\s\S]*?)<\/h1>/i);
    const h2Match = html.match(/<h2[^>]*class=\"[^\"]*t3[^\"]*\"[^>]*>([\s\S]*?)<\/h2>/i);

    if (h1Match && h1Match[1]) {
      title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }
    if (h2Match && h2Match[1]) {
      artist = h2Match[1].replace(/<[^>]+>/g, '').trim();
    }

    // Fallback title from <title> tag
    if (title === 'Música Sem Título' || artist === 'Artista Desconhecido') {
      const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleTagMatch) {
        let cleanTitleTag = titleTagMatch[1]
          .replace(/ - Cifra Club/gi, '')
          .replace(/ \| Cifra Club/gi, '')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');

        const parts = cleanTitleTag.split(/\s+[\-\|]\s+/);
        if (parts.length >= 2) {
          if (title === 'Música Sem Título') title = parts[0].trim();
          if (artist === 'Artista Desconhecido') artist = parts[1].trim();
        } else if (title === 'Música Sem Título') {
          title = cleanTitleTag.trim();
        }
      }
    }

    // Clean up HTML entities in title/artist
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ');

    artist = artist
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ');

    // 3. Extract Used Chords
    const chordNames = [...html.matchAll(/data-chord-name=\"([^\"]+)\"/gi)].map((m) => m[1]);
    let uniqueChords = [...new Set(chordNames)];

    if (uniqueChords.length === 0) {
      // Fallback: extract chords from <b> tags inside pre
      const bChordMatches = [...preContent.matchAll(/<b[^>]*>([A-G][b#]?[m]?[\w\d\/#]*?)<\/b>/gi)].map((m) => m[1].trim());
      uniqueChords = [...new Set(bChordMatches)];
    }

    // 4. Extract Key (Tom)
    let tom = 'C';
    const idTomMatch = html.match(/id=\"cifra_tom\"[^>]*>([A-G][b#]?[m]?[\w\d\/#]*?)</i);
    const tomAhrefMatch = html.match(/href=\"[^\"]*#tom=[^\"]*\"[^>]*>([A-G][b#]?[m]?[\w\d\/#]*?)</i);
    const tomDataMatch = html.match(/data-tom=\"([A-G][b#]?[m]?[\w\d\/#]*?)\"/i);

    if (idTomMatch && idTomMatch[1]) {
      tom = idTomMatch[1].trim();
    } else if (tomAhrefMatch && tomAhrefMatch[1]) {
      tom = tomAhrefMatch[1].trim();
    } else if (tomDataMatch && tomDataMatch[1]) {
      tom = tomDataMatch[1].trim();
    } else {
      const tomIdx = html.indexOf('Diminuir tom');
      if (tomIdx !== -1) {
        const tomSnippet = html.slice(tomIdx, tomIdx + 500);
        const tomP = tomSnippet.match(/<p[^>]*>([A-G][b#]?[m]?.*?)<\/p>/i);
        if (tomP) tom = tomP[1].replace(/<[^>]+>/g, '').trim();
      }
    }

    // 5. Clean up the chords text
    let cleanChords = preContent
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<b[^>]*data-chord-name=\"([^\"]+)\"[^>]*>[\s\S]*?<\/b>/gi, '$1')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // Reduce excessive blank lines
    cleanChords = cleanChords
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      id: 'cifraclub_' + slugify(artist) + '_' + slugify(title) + '_' + Date.now().toString(36),
      title: title || 'Música Importada',
      artist: artist || 'Artista',
      originalKey: tom || 'C',
      currentKey: tom || 'C',
      difficulty: 'Médio',
      genre: 'Nacional',
      chordsText: cleanChords,
      chordsUsed: uniqueChords,
      cifraClubUrl: url,
      source: 'Cifra Club (Oficial)',
    };
  } catch (err) {
    console.error('Error parsing Cifra Club HTML:', err);
    return null;
  }
}
