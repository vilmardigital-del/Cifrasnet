import { ChordPosition, Instrument } from '../types';

// Chromatic scales
export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Regex to identify chords in standard notation (e.g. C, C#m7, Eb/G, F#maj7, B7(9), Cadd9, F#m7(b5))
const CHORD_REGEX = /\b([A-G][b#]?)((?:m|maj|min|dim|aug|sus[24]?|[0-9]{1,2}|add[0-9]|b[59]|#[59]|\+[59])*)(?:\/([A-G][b#]?))?\b/g;

/**
 * Transposes a single note by given semitone offset
 */
export function transposeNote(note: string, semitones: number, preferFlats = false): string {
  if (!note) return 'C';

  // Find index in sharp chromatic or flat chromatic
  let idx = CHROMATIC_SHARPS.indexOf(note);
  if (idx === -1) {
    idx = CHROMATIC_FLATS.indexOf(note);
  }
  if (idx === -1) return note;

  let newIdx = (idx + semitones) % 12;
  if (newIdx < 0) newIdx += 12;

  const scale = preferFlats ? CHROMATIC_FLATS : CHROMATIC_SHARPS;
  return scale[newIdx];
}

/**
 * Transposes a full chord name (e.g. "C#m7/G#")
 */
export function transposeChord(chordName: string, semitones: number, preferFlats = false): string {
  if (semitones === 0) return chordName;

  // Split slash chords (e.g. C/G -> C and G)
  if (chordName.includes('/')) {
    const [base, bass] = chordName.split('/');
    const transposedBase = transposeChord(base, semitones, preferFlats);
    const transposedBass = transposeNote(bass, semitones, preferFlats);
    return `${transposedBase}/${transposedBass}`;
  }

  // Find root note
  const match = chordName.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chordName;

  const [, root, suffix] = match;
  const transposedRoot = transposeNote(root, semitones, preferFlats);
  return `${transposedRoot}${suffix}`;
}

/**
 * Transposes chords inside a full cifra text.
 * Handles both inline bracket notation [C#m7] and plain chord lines above lyrics!
 */
export function transposeCifraText(text: string, semitones: number, preferFlats = false): string {
  if (!text) return '';
  if (semitones === 0) return text;

  // First, transpose bracketed chords like [C], [Am7/G]
  let result = text.replace(/\[([A-G][b#]?[^\]]*)\]/g, (_, chord) => {
    return `[${transposeChord(chord.trim(), semitones, preferFlats)}]`;
  });

  // Second, transpose plain line chords (lines that look predominantly like chord lines)
  const lines = result.split('\n');
  const transposedLines = lines.map((line) => {
    // If line is bracketed or section header like [Intro], skip or handle
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      // Check if it's a single chord bracket [C] or a section header [Intro]
      const isSingleChord = /^\[[A-G][b#]?[^\]]*\]$/.test(line.trim());
      if (!isSingleChord) return line;
    }

    // Check if line looks like a chord line (words are mostly chord symbols)
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return line;

    // Check if at least 70% of words in line match chord pattern
    const chordCount = words.filter((w) => /^([A-G][b#]?(?:m|maj|min|dim|aug|sus[24]?|[0-9]{1,2}|add[0-9]|b[59]|#[59])*(?:\/[A-G][b#]?)?)$/.test(w)).length;
    const isChordLine = chordCount / words.length >= 0.7;

    if (isChordLine) {
      // Replace chords keeping exact spacing
      return line.replace(CHORD_REGEX, (match) => {
        return transposeChord(match, semitones, preferFlats);
      });
    }

    return line;
  });

  return transposedLines.join('\n');
}

/**
 * Extracts unique chords used in cifra text
 */
export function extractChordsFromText(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();

  // Bracketed
  const bracketMatches = text.match(/\[([A-G][b#]?[^\]]*)\]/g);
  if (bracketMatches) {
    bracketMatches.forEach((m) => {
      const chord = m.replace(/[\[\]]/g, '').trim();
      if (/^[A-G][b#]/.test(chord)) found.add(chord);
    });
  }

  // Plain regex
  const matches = text.match(CHORD_REGEX);
  if (matches) {
    matches.forEach((c) => {
      // filter out words like 'A', 'E' in Portuguese lyrics if they are not in chord context
      if (c.length === 1 && !bracketMatches) return;
      found.add(c);
    });
  }

  return Array.from(found);
}

/**
 * Dictionary of standard chord fingerings for Violão (6-string standard E A D G B E)
 */
export const GUITAR_CHORDS: Record<string, ChordPosition> = {
  // Major
  'C': { chord: 'C', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'D': { chord: 'D', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'E': { chord: 'E', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'F': { chord: 'F', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
  'G': { chord: 'G', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'A': { chord: 'A', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'B': { chord: 'B', frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barre: 2 },

  // Minor
  'Cm': { chord: 'Cm', frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: 3 },
  'Dm': { chord: 'Dm', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'Em': { chord: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'Fm': { chord: 'Fm', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: 1 },
  'Gm': { chord: 'Gm', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: 3 },
  'Am': { chord: 'Am', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'Bm': { chord: 'Bm', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: 2 },

  // 7th
  'C7': { chord: 'C7', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'D7': { chord: 'D7', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'E7': { chord: 'E7', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'F7': { chord: 'F7', frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barre: 1 },
  'G7': { chord: 'G7', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'A7': { chord: 'A7', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
  'B7': { chord: 'B7', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },

  // Sharp & Flat variations
  'C#m': { chord: 'C#m', frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], barre: 4 },
  'F#m': { chord: 'F#m', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: 2 },
  'F#': { chord: 'F#', frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barre: 2 },
  'Bb': { chord: 'Bb', frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: 1 },
  'Bbm': { chord: 'Bbm', frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barre: 1 },
  'Eb': { chord: 'Eb', frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], barre: 6 },
  'Ab': { chord: 'Ab', frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barre: 4 },

  // Add9 & Slash
  'Cadd9': { chord: 'Cadd9', frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
  'G/B': { chord: 'G/B', frets: [-1, 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 2] },
  'Dsus4': { chord: 'Dsus4', frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
};

/**
 * Get fallback chord position for any chord not explicitly in database
 */
export function getChordPosition(chordName: string, instrument: Instrument = 'Violão / Guitarra'): ChordPosition {
  const clean = chordName.trim().replace(/[\[\]]/g, '');
  
  if (GUITAR_CHORDS[clean]) {
    return GUITAR_CHORDS[clean];
  }

  // Base root matching fallback
  const root = clean.match(/^([A-G][b#]?)/)?.[1] || 'C';
  const basePosition = GUITAR_CHORDS[root] || GUITAR_CHORDS['C'];

  return {
    chord: clean,
    frets: basePosition.frets,
    fingers: basePosition.fingers,
    barre: basePosition.barre,
  };
}

/**
 * Checks if a chord uses a barre / pestana
 */
export function isBarreChord(chordName: string): boolean {
  const pos = getChordPosition(chordName);
  return Boolean(pos.barre && pos.barre > 0);
}

/**
 * Calculates tone without barre chords ("Tom Sem Pestana") for easy playing
 */
export function getEasyNoBarreKey(currentKey: string): { suggestedKey: string; offset: number } {
  const safeKey = currentKey || 'C';
  const easyKeys = ['C', 'G', 'D', 'Am', 'Em'];
  let bestKey = 'C';
  let minOffset = 0;

  // Key offsets relative to current
  const root = safeKey.replace(/m$/, '');
  const isMinor = safeKey.endsWith('m');

  const idx = CHROMATIC_SHARPS.indexOf(root);
  if (idx === -1) return { suggestedKey: isMinor ? 'Am' : 'C', offset: 0 };

  const targetKeys = isMinor ? ['Am', 'Em', 'Dm'] : ['C', 'G', 'D', 'A', 'E'];
  
  for (const tKey of targetKeys) {
    const tRoot = tKey.replace(/m$/, '');
    const tIdx = CHROMATIC_SHARPS.indexOf(tRoot);
    if (tIdx !== -1) {
      let diff = tIdx - idx;
      if (diff > 6) diff -= 12;
      if (diff < -6) diff += 12;
      return { suggestedKey: tKey, offset: diff };
    }
  }

  return { suggestedKey: isMinor ? 'Am' : 'G', offset: 0 };
}
