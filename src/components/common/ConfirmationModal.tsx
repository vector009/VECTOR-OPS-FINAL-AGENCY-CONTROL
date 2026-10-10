import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requiredConfirmationPhrase?: string; // If set, user must type this exact text to confirm
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  requiredConfirmationPhrase,
  onConfirm,
  onCancel,
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');

  if (!isOpen) return null;

  const isConfirmedPhraseValid = !requiredConfirmationPhrase || typedPhrase.trim() === requiredConfirmationPhrase;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
      onClick={onCancel}
    >
      <div 
        className="bg-[var(--card-bg)] neo-modal border border-[var(--card-border)] rounded-2xl w-full max-w-md overflow-hidden modal-sheet-enter shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${isDestructive ? 'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30' : 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
            </div>
          </div>

          {requiredConfirmationPhrase && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-[var(--text-muted)]">
                Please type <span className="font-mono text-white font-semibold">{requiredConfirmationPhrase}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                placeholder={requiredConfirmationPhrase}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-xs px-4 py-2 cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={!isConfirmedPhraseValid}
              onClick={() => {
                onConfirm();
                setTypedPhrase('');
              }}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                isDestructive
                  ? 'bg-[var(--danger)] hover:brightness-110 text-white shadow-lg'
                  : 'btn-primary'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
