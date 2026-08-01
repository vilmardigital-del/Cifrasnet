import React, { useState } from 'react';
import { X, Sparkles, Check, Mic, Music, Wand2 } from 'lucide-react';
import { Song, ToneSuggestions } from '../types';
import { getEasyNoBarreKey, CHROMATIC_SHARPS } from '../utils/chordTransposer';

interface ToneSuggestionsModalProps {
  song: Song;
  currentKey: string;
  onSelectKey: (newKey: string, semitoneOffset: number) => void;
  onClose: () => void;
  stageModeDark: boolean;
}

export const ToneSuggestionsModal: React.FC<ToneSuggestionsModalProps> = ({
  song,
  currentKey,
  onSelectKey,
  onClose,
  stageModeDark,
}) => {
  const [vocalRangePrompt, setVocalRangePrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [customAiSuggestion, setCustomAiSuggestion] = useState<any>(null);

  const easyKeyResult = getEasyNoBarreKey(song.originalKey);

  const handleAiSuggest = async () => {
    if (!vocalRangePrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/suggest-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: song.title,
          artist: song.artist,
          currentKey: currentKey,
          vocalRange: vocalRangePrompt,
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestion) {
        setCustomAiSuggestion(data.suggestion);
      }
    } catch (e) {
      console.error('Error calculating AI tone suggestion:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const calculateOffset = (targetKey: string): number => {
    const cleanTarget = targetKey.replace(/[^A-G#b]/g, '');
    const targetRoot = cleanTarget.replace(/m$/, '');
    const currentRoot = currentKey.replace(/m$/, '');

    let tIdx = CHROMATIC_SHARPS.indexOf(targetRoot);
    let cIdx = CHROMATIC_SHARPS.indexOf(currentRoot);

    if (tIdx === -1 || cIdx === -1) return 0;

    let diff = tIdx - cIdx;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    return diff;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border relative ${
          stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Sugestões Inteligentes de Tom</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">{song.title}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tom Atual: <span className="font-bold text-amber-500">{currentKey}</span> (Tom Original: {song.originalKey})
          </p>
        </div>

        {/* Preset Tone Options */}
        <div className="space-y-3 mb-6">
          {/* Tom Original */}
          <div 
            onClick={() => onSelectKey(song.originalKey, 0)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between hover:border-amber-500/50 ${
              currentKey === song.originalKey
                ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                : stageModeDark ? 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-sm">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold">Tom Original ({song.originalKey})</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Arranjo e afinação original do artista</p>
              </div>
            </div>
            {currentKey === song.originalKey && <Check className="w-5 h-5 text-amber-500" />}
          </div>

          {/* Voz Masculina */}
          {song.toneSuggestions?.maleVoice && (
            <div 
              onClick={() => {
                const key = song.toneSuggestions?.maleVoice?.split(' ')[0] || song.originalKey;
                onSelectKey(key, calculateOffset(key));
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between hover:border-amber-500/50 ${
                stageModeDark ? 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-sm">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Sugestão Voz Masculina</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{song.toneSuggestions.maleVoice}</p>
                </div>
              </div>
            </div>
          )}

          {/* Voz Feminina */}
          {song.toneSuggestions?.femaleVoice && (
            <div 
              onClick={() => {
                const key = song.toneSuggestions?.femaleVoice?.split(' ')[0] || song.originalKey;
                onSelectKey(key, calculateOffset(key));
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between hover:border-amber-500/50 ${
                stageModeDark ? 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold text-sm">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Sugestão Voz Feminina</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{song.toneSuggestions.femaleVoice}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tom Sem Pestanas */}
          <div 
            onClick={() => onSelectKey(easyKeyResult.suggestedKey, easyKeyResult.offset)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between hover:border-amber-500/50 ${
              stageModeDark ? 'bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold">Tom Mais Fácil ({easyKeyResult.suggestedKey})</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Acordes abertos, sem pestanas difíceis</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Custom Vocal Range Query */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
            Pedir Sugestão Personalizada de Tom com IA:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={vocalRangePrompt}
              onChange={(e) => setVocalRangePrompt(e.target.value)}
              placeholder="Ex: Sou tenor e prefiro tons mais graves..."
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
              }`}
            />
            <button
              onClick={handleAiSuggest}
              disabled={aiLoading || !vocalRangePrompt.trim()}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiLoading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>

          {customAiSuggestion && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
              <p className="font-bold mb-1">
                Tom Sugerido: {customAiSuggestion.suggestedKey}
              </p>
              <p className="text-zinc-400 text-[11px] mb-2">{customAiSuggestion.explanation}</p>
              <button
                onClick={() => {
                  const key = customAiSuggestion.suggestedKey;
                  onSelectKey(key, calculateOffset(key));
                }}
                className="w-full py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                Aplicar Tom {customAiSuggestion.suggestedKey}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
