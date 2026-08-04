import React, { useState } from 'react';
import { X, Plus, FileText, Check, Globe, Loader2, ExternalLink } from 'lucide-react';
import { Song, Difficulty } from '../types';
import { extractChordsFromText } from '../utils/chordTransposer';
import { parseCifraClubHtml } from '../utils/cifraClubScraper';

interface ImportSongModalProps {
  onSaveSong: (song: Song) => void;
  onClose: () => void;
  stageModeDark: boolean;
}

export const ImportSongModal: React.FC<ImportSongModalProps> = ({
  onSaveSong,
  onClose,
  stageModeDark,
}) => {
  const [cifraUrl, setCifraUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('C');
  const [difficulty, setDifficulty] = useState<Difficulty>('Fácil');
  const [genre, setGenre] = useState('MPB');
  const [bpm, setBpm] = useState(120);
  const [chordsText, setChordsText] = useState('');

  const handleFetchCifraUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetQuery = cifraUrl.trim();
    if (!targetQuery) return;

    setIsFetchingUrl(true);
    setUrlError(null);

    let songData: any = null;

    // 1. Primary Attempt: Server API
    try {
      const res = await fetch('/api/search-chords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.song) {
          songData = data.song;
        }
      }
    } catch (err) {
      console.warn('API /api/search-chords failed, trying client fallback...', err);
    }

    // 2. Secondary Attempt: Client-side CORS Proxy Fallback for Cifra Club links
    if (!songData && (targetQuery.includes('cifraclub.com.br') || targetQuery.startsWith('http'))) {
      try {
        let cleanLink = targetQuery;
        if (!cleanLink.startsWith('http')) cleanLink = 'https://' + cleanLink;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanLink)}`;
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          const html = await proxyRes.text();
          const scraped = parseCifraClubHtml(html, cleanLink);
          if (scraped) {
            songData = scraped;
          }
        }
      } catch (proxyErr) {
        console.warn('Client proxy fallback failed:', proxyErr);
      }
    }

    if (songData) {
      setTitle(songData.title || '');
      setArtist(songData.artist || '');
      setKey(songData.originalKey || 'C');
      setGenre(songData.genre || 'Nacional');
      if (songData.recommendedBpm) {
        setBpm(songData.recommendedBpm);
      }
      setChordsText(songData.chordsText || '');
      setCifraUrl('');
      setUrlError(null);
    } else {
      setUrlError('Não foi possível encontrar essa cifra. Verifique o link ou nome digitado.');
    }

    setIsFetchingUrl(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !chordsText.trim()) return;

    const chordsUsed = extractChordsFromText(chordsText);

    const newSong: Song = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      artist: artist.trim(),
      originalKey: key.toUpperCase().trim() || 'C',
      difficulty,
      genre,
      timeSignature: '4/4',
      recommendedBpm: Number(bpm) || 120,
      chordsText,
      chordsUsed,
      savedOfflineAt: new Date().toISOString(),
    };

    onSaveSong(newSong);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border relative overflow-hidden ${
          stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">Criar ou Importar Cifra</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {/* Quick URL Import Box */}
          <div className={`p-4 rounded-2xl border ${
            stageModeDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-amber-50/60 border-amber-200/80'
          }`}>
            <label className="block text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Buscar Cifra ou Importar Link</span>
            </label>
            <form onSubmit={handleFetchCifraUrl} className="flex gap-2">
              <input
                type="text"
                value={cifraUrl}
                onChange={(e) => setCifraUrl(e.target.value)}
                placeholder="Cole o link do Cifra Club ou digite o nome da música..."
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                  stageModeDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                }`}
              />
              <button
                type="submit"
                disabled={isFetchingUrl || !cifraUrl.trim()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                {isFetchingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>Importar</span>
              </button>
              <a
                href="https://www.cifraclub.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shrink-0 ${
                  stageModeDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                    : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300'
                }`}
                title="Abrir o site do Cifra Club em uma nova aba"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                <span>Cifra Club</span>
              </a>
            </form>
            {urlError && (
              <p className="text-[11px] font-semibold text-rose-500 mt-2">{urlError}</p>
            )}
          </div>

          {/* Manual / Auto-filled Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Nome da Música *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Como Nossos Pais"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Artista / Banda *
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ex: Elis Regina"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Tom Original
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Ex: C, G, Am"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Gênero
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ex: MPB, Rock"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  BPM
                </label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                    stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                Texto da Cifra (Cole do Cifra Club ou digite em formato [Acorde] ou linhas de acordes)
              </label>
              <textarea
                rows={9}
                value={chordsText}
                onChange={(e) => setChordsText(e.target.value)}
                placeholder={`[Intro] C  G  Am  F

[Primeira Parte]
C                    G
Minha história é bem simples de contar...`}
                className={`w-full p-3 rounded-xl text-xs font-mono border outline-none ${
                  stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Cifra no Meu Perfil</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
