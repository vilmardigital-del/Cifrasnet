import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Plus, 
  Minus, 
  Volume2, 
  VolumeX, 
  X, 
  SlidersHorizontal, 
  Activity,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { MetronomeEngine } from '../utils/metronomeEngine';
import { SoundType } from '../types';

interface MetronomeWidgetProps {
  initialBpm?: number;
  initialTimeSignature?: string;
  onClose?: () => void;
  stageModeDark: boolean;
  isFloatingOverlay?: boolean;
  onToggleFloating?: () => void;
}

export const MetronomeWidget: React.FC<MetronomeWidgetProps> = ({
  initialBpm = 120,
  initialTimeSignature = '4/4',
  onClose,
  stageModeDark,
  isFloatingOverlay = false,
  onToggleFloating,
}) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [timeSignature, setTimeSignature] = useState(initialTimeSignature);
  const [soundType, setSoundType] = useState<SoundType>('click');
  const [accentFirstBeat, setAccentFirstBeat] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(-1);

  // Tap Tempo State
  const tapTimesRef = useRef<number[]>([]);

  // Metronome Engine Ref
  const engineRef = useRef<MetronomeEngine | null>(null);

  useEffect(() => {
    const engine = new MetronomeEngine();
    engineRef.current = engine;

    engine.setBpm(bpm);
    engine.setTimeSignature(timeSignature);
    engine.setSoundType(soundType);
    engine.setAccentFirstBeat(accentFirstBeat);
    engine.setVolume(volume);

    engine.setOnBeatCallback((beatIdx) => {
      setActiveBeat(beatIdx);
    });

    return () => {
      engine.stop();
    };
  }, []);

  // Update engine properties
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBpm(bpm);
    }
  }, [bpm]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTimeSignature(timeSignature);
    }
  }, [timeSignature]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSoundType(soundType);
    }
  }, [soundType]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setAccentFirstBeat(accentFirstBeat);
    }
  }, [accentFirstBeat]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVolume(volume);
    }
  }, [volume]);

  const togglePlay = () => {
    if (!engineRef.current) return;
    const playing = engineRef.current.toggle();
    setIsPlaying(playing);
    if (!playing) setActiveBeat(-1);
  };

  const handleBpmChange = (newBpm: number) => {
    const val = Math.max(30, Math.min(280, newBpm));
    setBpm(val);
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const times = tapTimesRef.current;
    
    // Reset if last tap was over 2 seconds ago
    if (times.length > 0 && now - times[times.length - 1] > 2000) {
      times.length = 0;
    }

    times.push(now);

    if (times.length >= 2) {
      // Calculate average interval
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 30 && calculatedBpm <= 280) {
        setBpm(calculatedBpm);
      }
    }

    // Keep last 6 taps
    if (times.length > 6) times.shift();
  };

  const totalBeats = parseInt(timeSignature.split('/')[0], 10) || 4;

  const content = (
    <div className={`flex flex-col gap-5 ${isFloatingOverlay ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">Metrônomo Profissional</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Ajuste de Tempo & Compasso</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onToggleFloating && (
            <button
              onClick={onToggleFloating}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title={isFloatingOverlay ? 'Modo Expandido' : 'Modo Flutuante'}
            >
              {isFloatingOverlay ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BPM Big Display & Editable Input */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <input
            type="number"
            min="30"
            max="280"
            value={bpm}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                handleBpmChange(val);
              } else {
                setBpm(0 as any);
              }
            }}
            onBlur={() => {
              if (!bpm || bpm < 30) handleBpmChange(30);
              else if (bpm > 280) handleBpmChange(280);
            }}
            className="w-32 text-center text-5xl font-black font-mono tracking-tighter text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl border-2 border-amber-500/30 focus:border-amber-500 outline-none p-1 transition-all"
            title="Digite o BPM desejado diretamente aqui"
          />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">BPM</span>
        </div>

        {/* BPM Quick Adjustment Buttons */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => handleBpmChange(bpm - 5)}
            className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            -5
          </button>
          <button
            onClick={() => handleBpmChange(bpm - 1)}
            className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="30"
            max="280"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-36 accent-amber-500 cursor-pointer"
          />

          <button
            onClick={() => handleBpmChange(bpm + 1)}
            className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleBpmChange(bpm + 5)}
            className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            +5
          </button>
        </div>

        {/* Tap Tempo */}
        <button
          onClick={handleTapTempo}
          className="px-4 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs border border-amber-500/20 transition-colors active:scale-95"
        >
          TAP TEMPO (Marcar Ritmo)
        </button>
      </div>

      {/* Visual Beat Indicator Dots */}
      <div className="flex items-center justify-center gap-3 my-2 py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
        {Array.from({ length: totalBeats }).map((_, idx) => {
          const isActive = activeBeat === idx;
          const isAccent = idx === 0;

          return (
            <div
              key={idx}
              className={`flex flex-col items-center gap-1 transition-all duration-75 ${
                isActive ? 'scale-125' : 'scale-100'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center font-bold text-[10px] ${
                  isActive
                    ? isAccent
                      ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-lg shadow-amber-500/50'
                      : 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/50'
                    : 'bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-400'
                }`}
              >
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls: Compasso / Sound Preset / Play Button */}
      <div className="grid grid-cols-2 gap-3">
        {/* Time Signature */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Compasso
          </label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
              stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
            }`}
          >
            <option value="2/4">2/4 (Binário)</option>
            <option value="3/4">3/4 (Ternário / Valsa)</option>
            <option value="4/4">4/4 (Quaternário / Pop / Rock)</option>
            <option value="6/8">6/8 (Sextenário)</option>
            <option value="12/8">12/8 (Blues)</option>
          </select>
        </div>

        {/* Sound Type */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Som do Click
          </label>
          <select
            value={soundType}
            onChange={(e) => setSoundType(e.target.value as SoundType)}
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
              stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
            }`}
          >
            <option value="click">Clique Acústico</option>
            <option value="woodblock">Woodblock (Madeira)</option>
            <option value="beep">Beep Eletrônico</option>
            <option value="cowbell">Cowbell (Samba/Pop)</option>
          </select>
        </div>
      </div>

      {/* Main Play / Stop Button */}
      <button
        onClick={togglePlay}
        className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
          isPlaying
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
            : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/30'
        }`}
      >
        {isPlaying ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span>Parar Metrônomo</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>Iniciar Metrônomo</span>
          </>
        )}
      </button>
    </div>
  );

  if (isFloatingOverlay) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 w-80 rounded-3xl shadow-2xl border backdrop-blur-md ${
        stageModeDark ? 'bg-zinc-900/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-zinc-200 text-zinc-900'
      }`}>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl shadow-2xl border ${
          stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {content}
      </div>
    </div>
  );
};
