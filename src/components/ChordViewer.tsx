import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Plus, 
  Minus, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Moon, 
  Sun, 
  SlidersHorizontal, 
  ExternalLink, 
  Video, 
  Music, 
  Wand2, 
  Type, 
  Share2,
  Check,
  BookmarkPlus,
  Download,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import { Song, Instrument, UserProfile } from '../types';
import { transposeCifraText, transposeNote, CHROMATIC_SHARPS, extractChordsFromText } from '../utils/chordTransposer';
import { ChordDiagramModal } from './ChordDiagramModal';
import { ToneSuggestionsModal } from './ToneSuggestionsModal';
import { MetronomeWidget } from './MetronomeWidget';
import { addSongToSetlist } from '../utils/storage';

interface ChordViewerProps {
  song: Song;
  isFavorite: boolean;
  isOfflineSaved: boolean;
  profile: UserProfile;
  onToggleFavorite: (songId: string, e?: React.MouseEvent) => void;
  onToggleOffline: (song: Song) => void;
  onDeleteSong: (song: Song) => void;
  onBack: () => void;
  onUpdateProfile: (p: UserProfile) => void;
  stageModeDark: boolean;
  onToggleStageMode: () => void;
}

export const ChordViewer: React.FC<ChordViewerProps> = ({
  song,
  isFavorite,
  isOfflineSaved,
  profile,
  onToggleFavorite,
  onToggleOffline,
  onDeleteSong,
  onBack,
  onUpdateProfile,
  stageModeDark,
  onToggleStageMode,
}) => {
  // Transposition offset in semitones (-12 to +12)
  const [semitones, setSemitones] = useState(0);

  // Auto-scroll states
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(3); // 1 to 10
  const [fontSize, setFontSize] = useState(20); // px (larger default for better visualization)

  // Chord Simplify Toggle
  const [isSimplified, setIsSimplified] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals & Panel Toggles
  const [showOptionsBar, setShowOptionsBar] = useState(false);
  const [selectedChordForDiagram, setSelectedChordForDiagram] = useState<string | null>(null);
  const [showToneSuggestions, setShowToneSuggestions] = useState(false);
  const [showMetronome, setShowMetronome] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSetlistDropdown, setShowSetlistDropdown] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto scroll RAF / Interval Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  // Calculate current key based on semitones offset
  const currentKey = transposeNote(song.originalKey, semitones);

  // Transposed text
  const transposedText = transposeCifraText(song.chordsText, semitones);

  // Extract unique chords present in transposed text
  const currentChordsUsed = extractChordsFromText(transposedText);

  // Auto-scroll engine
  useEffect(() => {
    if (isAutoScrolling) {
      scrollIntervalRef.current = window.setInterval(() => {
        window.scrollBy({ top: scrollSpeed * 0.5, behavior: 'smooth' });
      }, 50);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddToSetlist = (setlistId: string) => {
    const updated = addSongToSetlist(setlistId, song.id);
    onUpdateProfile(updated);
    setShowSetlistDropdown(false);
  };

  /**
   * Helper to parse and render cifra lines with clickable, highlighted chord buttons!
   */
  const renderCifraContent = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      // Section Headers like [Intro], [Refrão], [Primeira Parte]
      if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
        const isSingleChord = /^\[[A-G][b#]?[^\]]*\]$/.test(line.trim());
        if (!isSingleChord) {
          return (
            <div
              key={lineIdx}
              className="font-bold text-amber-500 text-[1.1em] mt-6 mb-2 font-mono uppercase tracking-wider border-b border-amber-500/20 pb-1"
            >
              {line}
            </div>
          );
        }
      }

      // Check if line contains inline brackets like "Eis a [C]canção [G]aqui"
      if (line.includes('[') && line.includes(']')) {
        const parts = line.split(/(\[[^\]]+\])/g);
        return (
          <div key={lineIdx} className="leading-relaxed font-mono whitespace-pre-wrap my-1">
            {parts.map((part, partIdx) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                const chordName = part.slice(1, -1).trim();
                return (
                  <button
                    key={partIdx}
                    onClick={() => setSelectedChordForDiagram(chordName)}
                    className="inline-block px-1.5 py-0.5 my-0.5 rounded-md font-bold text-amber-500 hover:bg-amber-500/20 hover:scale-105 transition-all cursor-pointer underline decoration-amber-500/50"
                  >
                    {chordName}
                  </button>
                );
              }
              return <span key={partIdx}>{part}</span>;
            })}
          </div>
        );
      }

      // Plain chord lines
      const words = line.trim().split(/\s+/).filter(Boolean);
      const isChordLine =
        words.length > 0 &&
        words.filter((w) => /^([A-G][b#]?(?:m|maj|min|dim|aug|sus[24]?|[0-9]{1,2}|add[0-9]|b[59]|#[59])*(?:\/[A-G][b#]?)?)$/.test(w)).length / words.length >= 0.7;

      if (isChordLine) {
        // Replace words matching chord pattern with clickable buttons while maintaining spacing
        const elements = [];
        let lastIdx = 0;
        const regex = /\b([A-G][b#]?(?:m|maj|min|dim|aug|sus[24]?|[0-9]{1,2}|add[0-9]|b[59]|#[59])*(?:\/[A-G][b#]?)?)\b/g;
        let match;

        while ((match = regex.exec(line)) !== null) {
          const chord = match[1];
          const start = match.index;

          if (start > lastIdx) {
            elements.push(<span key={`txt-${lastIdx}`}>{line.substring(lastIdx, start)}</span>);
          }

          elements.push(
            <button
              key={`chord-${start}`}
              onClick={() => setSelectedChordForDiagram(chord)}
              className="font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-500/20 px-1 rounded transition-all underline decoration-amber-500/30"
            >
              {chord}
            </button>
          );

          lastIdx = regex.lastIndex;
        }

        if (lastIdx < line.length) {
          elements.push(<span key={`txt-end`}>{line.substring(lastIdx)}</span>);
        }

        return (
          <div key={lineIdx} className="font-mono font-bold text-amber-500 whitespace-pre leading-snug my-0.5">
            {elements}
          </div>
        );
      }

      // Regular Lyric Line
      return (
        <div key={lineIdx} className="font-sans leading-relaxed whitespace-pre-wrap my-0.5">
          {line}
        </div>
      );
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-24 ${
      stageModeDark ? 'bg-zinc-950 text-zinc-100' : 'bg-amber-50/30 text-zinc-900'
    }`}>
      
      {/* Top Navigation Bar */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 ${
        stageModeDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-200 shadow-xs'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          {/* Title & Artist */}
          <div className="text-center truncate flex-1 px-2">
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight truncate">{song.title}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate">{song.artist}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => onToggleFavorite(song.id, e)}
              className={`p-2 rounded-xl border transition-colors ${
                isFavorite
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Setlist dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSetlistDropdown(!showSetlistDropdown)}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Adicionar ao Repertório"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>

              {showSetlistDropdown && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl p-2 shadow-2xl border z-50 ${
                  stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                }`}>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">Salvar em Repertório</p>
                  {profile.setlists.map((sl) => (
                    <button
                      key={sl.id}
                      onClick={() => handleAddToSetlist(sl.id)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-amber-500/10 hover:text-amber-500 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{sl.name}</span>
                      {sl.songIds.includes(song.id) && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Options Panel Toggle Button */}
            <button
              onClick={() => setShowOptionsBar(!showOptionsBar)}
              className={`px-3 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
                showOptionsBar
                  ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={showOptionsBar ? 'Ocultar menu de opções' : 'Exibir menu de opções e tom'}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{showOptionsBar ? 'Ocultar Opções' : 'Opções / Tom'}</span>
            </button>

            {/* Metronome Toggle Button */}
            <button
              onClick={() => setShowMetronome(!showMetronome)}
              className={`p-2 rounded-xl border transition-colors ${
                showMetronome
                  ? 'bg-amber-500 border-amber-500 text-zinc-950 font-bold'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
              }`}
              title="Abrir Metrônomo Integrado"
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Stage Mode Toggle */}
            <button
              onClick={onToggleStageMode}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={stageModeDark ? 'Modo Claro' : 'Modo Palco Escuro'}
            >
              {stageModeDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Tela Cheia"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Delete Song Button */}
            <button
              onClick={() => onDeleteSong(song)}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Apagar cifra"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Chord Workspace */}
      <div className="max-w-4xl mx-auto px-4 pt-6" ref={scrollContainerRef}>
        
        {/* Controls & Key Bar */}
        {showOptionsBar ? (
          <div className={`p-4 rounded-3xl border mb-6 shadow-sm animate-in fade-in duration-200 ${
            stageModeDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200/80'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Tone Transposition Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tom:</span>
                <button
                  onClick={() => setSemitones((prev) => prev - 1)}
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 font-extrabold transition-all"
                  title="-1 Semitom"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 font-black text-sm border border-amber-500/20 min-w-[60px] text-center">
                  {currentKey}
                  {semitones !== 0 && (
                    <span className="text-[10px] ml-1 font-semibold opacity-80">
                      ({semitones > 0 ? `+${semitones}` : semitones})
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSemitones((prev) => prev + 1)}
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 font-extrabold transition-all"
                  title="+1 Semitom"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {semitones !== 0 && (
                  <button
                    onClick={() => setSemitones(0)}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 transition-all text-xs font-bold"
                    title="Resetar Tom Original"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Tone Suggestions Modal Trigger */}
                <button
                  onClick={() => setShowToneSuggestions(true)}
                  className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-500 font-bold text-xs border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sugestões</span>
                </button>
              </div>

              {/* Quick Badges & Collapse Button */}
              <div className="flex items-center gap-2">
                {song.capo ? (
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs border border-indigo-500/20">
                    Capo {song.capo}ª casa
                  </span>
                ) : null}

                {song.cifraClubUrl && (
                  <a
                    href={song.cifraClubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 font-bold text-xs border border-orange-500/20 hover:bg-orange-500/20 transition-colors flex items-center gap-1"
                  >
                    <span>Cifra Club</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={() => setShowOptionsBar(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
                  title="Ocultar Painel de Opções"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Used Chords Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0">Acordes:</span>
              {currentChordsUsed.map((chord) => (
                <button
                  key={chord}
                  onClick={() => setSelectedChordForDiagram(chord)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-mono font-bold text-xs border border-amber-500/20 hover:bg-amber-500 hover:text-zinc-950 transition-colors shrink-0"
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Compact Minimal Header when Options Bar is hidden */
          (song.capo || currentChordsUsed.length > 0) ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 text-xs font-bold">
                {song.capo && (
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    Capo {song.capo}ª
                  </span>
                )}

                {/* Compact Chord Badges */}
                <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {currentChordsUsed.slice(0, 6).map((chord) => (
                    <button
                      key={chord}
                      onClick={() => setSelectedChordForDiagram(chord)}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 font-mono text-[11px] font-bold shrink-0"
                    >
                      {chord}
                    </button>
                  ))}
                  {currentChordsUsed.length > 6 && (
                    <span className="text-[10px] text-zinc-400">+{currentChordsUsed.length - 6}</span>
                  )}
                </div>
              </div>
            </div>
          ) : null
        )}

        {/* Cifra Sheet Body */}
        <div 
          style={{ fontSize: `${fontSize}px` }}
          className={`p-6 sm:p-8 rounded-3xl border shadow-md font-mono transition-all ${
            stageModeDark 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-amber-500/5' 
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}
        >
          {renderCifraContent(transposedText)}
        </div>

      </div>

      {/* Floating Auto-Scroll & View Controls Bar */}
      {isAutoScrolling ? (
        /* Floating Minimal Pause Button when Auto-Scrolling (Hides bottom bar for clean view) */
        <button
          onClick={() => setIsAutoScrolling(false)}
          className="fixed bottom-3 right-3 sm:right-6 z-50 px-3 py-1.5 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white shadow-lg backdrop-blur-md font-bold text-xs flex items-center gap-1.5 animate-pulse transition-all active:scale-95 border border-rose-400/30"
          title="Clique para pausar a rolagem e reexibir o menu"
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
          <span>Pausar Rolagem</span>
        </button>
      ) : (
        /* Compact Floating Controls Bar (Bottom Sticky) */
        <div className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md flex items-center gap-2.5 transition-all max-w-md ${
          stageModeDark ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-900'
        }`}>
          {/* Play AutoScroll */}
          <button
            onClick={() => setIsAutoScrolling(true)}
            className="px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-xs transition-all shrink-0"
            title="Iniciar Rolagem Automática"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span>Rolagem</span>
          </button>

          {/* Scroll Speed Adjust (+ and -) */}
          <div className="flex items-center gap-0.5 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase mr-1">Vel:</span>
            <button
              onClick={() => setScrollSpeed((prev) => Math.max(1, prev - 1))}
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-extrabold text-[11px] transition-colors"
              title="Diminuir Velocidade"
            >
              -
            </button>

            <span className="text-[10px] font-mono font-bold text-amber-500 min-w-[20px] text-center" title="Velocidade atual">
              {scrollSpeed}
            </span>

            <button
              onClick={() => setScrollSpeed((prev) => Math.min(10, prev + 1))}
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-extrabold text-[11px] transition-colors"
              title="Aumentar Velocidade"
            >
              +
            </button>
          </div>

          {/* Font Size Adjust */}
          <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-1.5">
            <button
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 font-extrabold text-[11px] transition-colors"
              title="Diminuir Fonte da Letra"
            >
              A-
            </button>

            <span className="text-[10px] font-mono font-bold text-amber-500 min-w-[24px] text-center" title="Tamanho da fonte">
              {fontSize}px
            </span>

            <button
              onClick={() => setFontSize((prev) => Math.min(38, prev + 2))}
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 font-extrabold text-[11px] transition-colors"
              title="Aumentar Fonte da Letra"
            >
              A+
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedChordForDiagram && (
        <ChordDiagramModal
          chordName={selectedChordForDiagram}
          instrument={profile.preferredInstrument}
          onClose={() => setSelectedChordForDiagram(null)}
          stageModeDark={stageModeDark}
        />
      )}

      {showToneSuggestions && (
        <ToneSuggestionsModal
          song={song}
          currentKey={currentKey}
          onSelectKey={(newKey, offset) => {
            setSemitones(offset);
            setShowToneSuggestions(false);
          }}
          onClose={() => setShowToneSuggestions(false)}
          stageModeDark={stageModeDark}
        />
      )}

      {showMetronome && (
        <MetronomeWidget
          initialBpm={song.recommendedBpm}
          initialTimeSignature={song.timeSignature}
          onClose={() => setShowMetronome(false)}
          stageModeDark={stageModeDark}
        />
      )}

    </div>
  );
};
