import React from 'react';
import GlassEffect from '../GlassEffect';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  type = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmBg = type === 'danger' 
    ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 border-red-500/40 shadow-[0_4px_15px_rgba(239,68,68,0.4)]'
    : 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 border-blue-500/40 shadow-[0_4px_15px_rgba(59,130,246,0.35)]';

  return (
    <div 
      className="modal-overlay" 
      onClick={onCancel}
      style={{ zIndex: 99999 }}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-[400px] px-4"
      >
        <div className="liquid-glass-stack-wrapper w-full">
          <GlassEffect 
            className="w-full rounded-[24px] p-6 relative overflow-hidden" 
            contentClassName="flex flex-col items-center text-center"
            style={{ display: 'block' }}
          >
            {/* Ambient background glows */}
            {type === 'danger' ? (
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[rgba(239,68,68,0.25)] blur-[40px] pointer-events-none" />
            ) : (
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[rgba(59,130,246,0.25)] blur-[40px] pointer-events-none" />
            )}

            {/* Icon */}
            <div className="text-3xl mb-3">
              {type === 'danger' ? '⚠️' : 'ℹ️'}
            </div>

            {/* Title */}
            <h3 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <button 
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-[0.8rem] font-bold text-[var(--text-primary)] transition-all cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button 
                onClick={onConfirm}
                className={`flex-1 py-2.5 rounded-xl border text-[0.8rem] font-extrabold text-white uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${confirmBg}`}
              >
                {confirmLabel}
              </button>
            </div>
          </GlassEffect>
        </div>
      </div>
    </div>
  );
}
