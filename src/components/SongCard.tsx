import React from 'react';
import { Song } from '../types';
import { Heart, ExternalLink, Music, Sparkles, Trash2, Cloud, Wifi } from 'lucide-react';

interface SongCardProps {
  song: Song;
  isFavorite: boolean;
  isOfflineSaved?: boolean;
  onSelect: (song: Song) => void;
  onToggleFavorite: (songId: string, e: React.MouseEvent) => void;
  onToggleOffline?: (song: Song, e: React.MouseEvent) => void;
  onDeleteSong?: (song: Song, e: React.MouseEvent) => void;
  stageModeDark: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onDeleteSong,
  stageModeDark,
}) => {
  const isCloudAndOffline = song.id.startsWith('cifra_') || song.id.startsWith('custom_');

  return (
    <div
      onClick={() => onSelect(song)}
      className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
        stageModeDark
          ? 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 text-zinc-100 shadow-md'
          : 'bg-white border-zinc-200/80 hover:border-amber-500/50 hover:shadow-lg text-zinc-900 shadow-xs'
      }`}
    >
      <div>
        {/* Header: Title & Actions (Favorite, Delete) */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-base tracking-tight group-hover:text-amber-500 transition-colors line-clamp-1 flex-1">
            {song.title}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(song.id, e);
              }}
              className={`p-1.5 rounded-lg transition-all active:scale-75 ${
                isFavorite
                  ? 'text-rose-500 hover:text-rose-600 bg-rose-500/10'
                  : 'text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Delete Button */}
            {onDeleteSong && (
              <button
                onClick={(e) => onDeleteSong(song, e)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Apagar cifra"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Artist */}
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">{song.artist}</span>
        </p>

        {/* Tags & Key & Storage Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20">
            Tom: {song.currentKey || song.originalKey}
          </span>

          {song.capo ? (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-xs border border-indigo-500/20">
              Capo {song.capo}ª casa
            </span>
          ) : null}

          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium text-xs">
            {song.genre}
          </span>

          {isCloudAndOffline && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20 flex items-center gap-1" title="Salvo na nuvem e disponível offline">
              <Cloud className="w-3 h-3 shrink-0" />
              <Wifi className="w-3 h-3 shrink-0" />
              <span>Nuvem + Offline</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">
            {song.recommendedBpm} BPM • {song.timeSignature}
          </span>
          {song.id.startsWith('gerado_ai_') && (
            <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-500 font-bold flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> IA
            </span>
          )}
        </div>

        {song.cifraClubUrl && (
          <a
            href={song.cifraClubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-orange-500 hover:underline font-semibold"
            title="Ver no Cifra Club"
          >
            <span>Cifra Club</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
