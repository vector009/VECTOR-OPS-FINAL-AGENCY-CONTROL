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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${isDestructive ? 'text-[#E2604F]' : 'text-[#E2896A]'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#EDEAE2]">{title}</h3>
              <p className="text-xs text-[#8B8D93] leading-relaxed">{description}</p>
            </div>
          </div>

          {requiredConfirmationPhrase && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-[#8B8D93]">
                Please type <span className="font-mono text-[#EDEAE2] font-semibold">{requiredConfirmationPhrase}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                placeholder={requiredConfirmationPhrase}
                className="w-full px-3 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-normal text-[#8B8D93] hover:text-[#EDEAE2] neo-raised rounded-lg transition-colors"
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
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isDestructive
                  ? 'bg-[#E2604F] hover:bg-[#EA7060] text-white'
                  : 'bg-[#E2896A] hover:bg-[#EA9679] text-[#17181B]'
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
