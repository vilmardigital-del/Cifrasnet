import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { getChordPosition } from '../utils/chordTransposer';
import { Instrument } from '../types';

interface ChordDiagramModalProps {
  chordName: string | null;
  instrument: Instrument;
  onClose: () => void;
  stageModeDark: boolean;
}

export const ChordDiagramModal: React.FC<ChordDiagramModalProps> = ({
  chordName,
  instrument,
  onClose,
  stageModeDark,
}) => {
  if (!chordName) return null;

  const position = getChordPosition(chordName, instrument);
  const frets = position.frets; // 6 strings for guitar [E, A, D, G, B, E]
  const numFrets = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border relative ${
          stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Diagrama de Acorde</span>
          <h2 className="text-3xl font-extrabold font-mono text-amber-500 my-1">{chordName}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{instrument}</p>
        </div>

        {/* Fretboard SVG Representation */}
        <div className="flex justify-center my-4">
          <svg width="200" height="220" viewBox="0 0 200 220" className="overflow-visible">
            {/* Nut Line */}
            <line x1="30" y1="30" x2="170" y2="30" stroke={stageModeDark ? '#fbbf24' : '#18181b'} strokeWidth="6" />

            {/* Fret lines (Horizontal) */}
            {[1, 2, 3, 4].map((f) => (
              <line
                key={`fret-${f}`}
                x1="30"
                y1={30 + f * 40}
                x2="170"
                y2={30 + f * 40}
                stroke={stageModeDark ? '#3f3f46' : '#d4d4d8'}
                strokeWidth="2"
              />
            ))}

            {/* Strings (Vertical) - 6 strings: E2 A2 D3 G3 B3 E4 */}
            {[0, 1, 2, 3, 4, 5].map((s) => {
              const x = 30 + s * 28;
              return (
                <g key={`string-${s}`}>
                  <line
                    x1={x}
                    y1="30"
                    x2={x}
                    y2="190"
                    stroke={stageModeDark ? '#a1a1aa' : '#71717a'}
                    strokeWidth={1 + (5 - s) * 0.4}
                  />

                  {/* Open (O) or Muted (X) at top */}
                  {frets[s] === -1 && (
                    <text x={x} y="18" textAnchor="middle" fill="#ef4444" fontSize="14" fontWeight="bold">
                      ✕
                    </text>
                  )}
                  {frets[s] === 0 && (
                    <circle cx={x} cy="18" r="5" fill="none" stroke={stageModeDark ? '#fbbf24' : '#18181b'} strokeWidth="2" />
                  )}
                </g>
              );
            })}

            {/* Finger dots */}
            {frets.map((fret, sIndex) => {
              if (fret > 0 && fret <= numFrets) {
                const cx = 30 + sIndex * 28;
                const cy = 30 + (fret - 0.5) * 40;
                return (
                  <g key={`dot-${sIndex}`}>
                    <circle cx={cx} cy={cy} r="11" fill="#f59e0b" />
                    {position.fingers && position.fingers[sIndex] > 0 && (
                      <text x={cx} y={cy + 4} textAnchor="middle" fill="#09090b" fontSize="11" fontWeight="bold">
                        {position.fingers[sIndex]}
                      </text>
                    )}
                  </g>
                );
              }
              return null;
            })}

            {/* String Labels at bottom (E A D G B E) */}
            {['E', 'A', 'D', 'G', 'B', 'e'].map((note, idx) => (
              <text
                key={`label-${idx}`}
                x={30 + idx * 28}
                y="210"
                textAnchor="middle"
                fill={stageModeDark ? '#71717a' : '#a1a1aa'}
                fontSize="11"
                fontWeight="600"
              >
                {note}
              </text>
            ))}
          </svg>
        </div>

        {/* Information note */}
        <div className="text-center mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
          <p>
            {position.barre ? `Pestana na ${position.barre}ª casa • ` : ''}
            Números indicam os dedos da mão esquerda (1 = Indicador, 4 = Mínimo)
          </p>
        </div>
      </div>
    </div>
  );
};
