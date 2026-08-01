export type Difficulty = 'Fácil' | 'Médio' | 'Avançado';

export type Instrument = 'Violão / Guitarra' | 'Ukulele' | 'Teclado';

export interface ToneSuggestions {
  maleVoice?: string;
  femaleVoice?: string;
  noBarreKey?: string;
  explanation?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  currentKey?: string;
  transpositionOffset?: number; // offset in semitones (-12 to +12)
  difficulty: Difficulty;
  genre: string;
  timeSignature: string; // e.g., '4/4', '3/4', '2/4', '6/8'
  recommendedBpm: number;
  capo?: number; // fret number, 0 = no capo
  chordsText: string;
  chordsUsed: string[];
  cifraClubUrl?: string;
  cifraClubVideoUrl?: string;
  toneSuggestions?: ToneSuggestions;
  isFavorite?: boolean;
  savedOfflineAt?: string;
  customNotes?: string;
}

export interface UserProfile {
  name: string;
  avatarUrl?: string;
  preferredInstrument: Instrument;
  stageModeDark: boolean;
  favorites: string[]; // Song IDs
  customCreatedSongs: Song[];
  history: string[]; // Recently viewed song IDs
  setlists: Setlist[];
}

export interface Setlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: string;
}

export type SoundType = 'click' | 'woodblock' | 'beep' | 'cowbell';

export interface MetronomeSettings {
  bpm: number;
  timeSignature: string; // '2/4', '3/4', '4/4', '6/8'
  accentFirstBeat: boolean;
  soundType: SoundType;
  volume: number; // 0 to 1
  isPlaying: boolean;
}

export interface ChordPosition {
  chord: string;
  frets: number[]; // e.g. [0, 2, 2, 1, 0, 0] for E
  fingers?: number[]; // e.g. [0, 2, 3, 1, 0, 0]
  baseFret?: number;
  barre?: number; // fret number if barre
}
