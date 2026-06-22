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
  // Lock body scroll when modal is open to prevent background scrolling
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const confirmBg = isDanger 
    ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 border-red-500/40 shadow-[0_4px_15px_rgba(239,68,68,0.4)]'
    : 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 border-blue-500/40 shadow-[0_4px_15px_rgba(59,130,246,0.35)]';

  const borderStyle = isDanger 
    ? '1px solid rgba(239, 68, 68, 0.25)' 
    : '1px solid rgba(59, 130, 246, 0.25)';
      
  const hoverGlowStart = isDanger 
    ? 'rgba(239, 68, 68, 0.35)' 
    : 'rgba(59, 130, 246, 0.35)';
      
  const hoverGlowEnd = isDanger 
    ? 'rgba(239, 68, 68, 0.05)' 
    : 'rgba(59, 130, 246, 0.05)';
      
  const innerGlow = isDanger
    ? 'inset 1.5px 1.5px 1.5px 0 rgba(239, 68, 68, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)'
    : 'inset 1.5px 1.5px 1.5px 0 rgba(59, 130, 246, 0.25), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.04)';
      
  const stackBorderColor = isDanger 
    ? 'rgba(239, 68, 68, 0.18)' 
    : 'rgba(59, 130, 246, 0.18)';
      
  const stackGlowColor = isDanger 
    ? 'rgba(239, 68, 68, 0.03)' 
    : 'rgba(59, 130, 246, 0.03)';

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
        <div 
          className="liquid-glass-stack-wrapper w-full"
          style={{
            '--stack-border-color': stackBorderColor,
            '--stack-glow-color': stackGlowColor,
          } as React.CSSProperties}
        >
          <GlassEffect 
            className="w-full rounded-[24px] relative overflow-hidden" 
            contentClassName="p-6 md:p-8 flex flex-col items-center text-center"
            style={{ 
              display: 'block',
              border: borderStyle,
              '--hover-glow-start': hoverGlowStart,
              '--hover-glow-end': hoverGlowEnd,
              '--card-inner-glow': innerGlow,
            } as React.CSSProperties}
          >
            {/* Ambient background glows */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] pointer-events-none ${
              isDanger ? 'bg-[rgba(239,68,68,0.25)]' : 'bg-[rgba(59,130,246,0.25)]'
            }`} />

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
