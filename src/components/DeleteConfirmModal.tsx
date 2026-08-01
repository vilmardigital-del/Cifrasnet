import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  itemTitle: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  stageModeDark: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  itemTitle,
  description = 'Esta ação não poderá ser desfeita. A cifra será removida de suas listas e salvamentos.',
  onConfirm,
  onCancel,
  stageModeDark,
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border relative overflow-hidden ${
          stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg tracking-tight">{title}</h3>
            <p className="text-xs text-rose-500 font-bold truncate max-w-[240px]">
              "{itemTitle}"
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sim, Apagar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
