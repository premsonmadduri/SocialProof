import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Download, Loader2, Share2, X } from 'lucide-react';
import { CAMPAIGN_TITLE_TELUGU } from '../firebase';
import { shareSupportCard } from '../utils/shareCard';

interface ThankYouModalProps {
  isOpen: boolean;
  supportersCount: number;
  onClose: () => void;
}

type ShareFeedback = 'idle' | 'generating' | 'shared' | 'downloaded' | 'error';

export function ThankYouModal({
  isOpen,
  supportersCount,
  onClose,
}: ThankYouModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [shareState, setShareState] = useState<ShareFeedback>('idle');

  useEffect(() => {
    if (!isOpen) {
      setShareState('idle');
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleShareCard = async () => {
    if (shareState === 'generating') return;
    setShareState('generating');

    const result = await shareSupportCard(supportersCount);

    if (result === 'shared') {
      setShareState('shared');
      window.setTimeout(() => setShareState('idle'), 2600);
    } else if (result === 'downloaded') {
      setShareState('downloaded');
      window.setTimeout(() => setShareState('idle'), 3200);
    } else if (result === 'cancelled') {
      setShareState('idle');
    } else {
      setShareState('error');
      window.setTimeout(() => setShareState('idle'), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="thanks-modal-title"
        >
          {/* Subtle Apple-style dimmed glass backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
          />

          {/* Classic frosted glass confirmation dialog */}
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.94, y: 12 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 8 }
            }
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="glass-modal relative z-10 w-full max-w-[390px] overflow-hidden rounded-[28px] p-7 text-center sm:p-8"
          >
            {/* Minimal close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close thank you popup"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-[#6E6E73] transition-colors hover:bg-black/[0.08] hover:text-[#1D1D1F] focus-visible:outline-2 focus-visible:outline-[#0071E3] cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Clean Apple confirmation checkmark circle */}
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0.72, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24, delay: 0.04 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0071E3]/[0.1] text-[#0071E3]"
            >
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={prefersReducedMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.38, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.svg>
            </motion.div>

            {/* Classic Telugu & English gratitude copy */}
            <h2
              id="thanks-modal-title"
              lang="te"
              className="mt-5 font-telugu text-[28px] font-bold tracking-tight text-[#1D1D1F]"
            >
              ధన్యవాదాలు!
            </h2>
            <p className="mt-1 font-display text-[15px] font-medium text-[#6E6E73]">
              Thank you for joining our community
            </p>
            <p
              lang="te"
              className="mt-3.5 font-telugu text-[15px] leading-relaxed text-[#424245]"
            >
              <span className="font-semibold text-[#1D1D1F]">
                {CAMPAIGN_TITLE_TELUGU}
              </span>{' '}
              గారికి మీ మద్దతు తెలిపినందుకు హృదయపూర్వక ధన్యవాదాలు.
            </p>

            {/* Minimal hairline live total */}
            <div className="mt-6 border-t border-black/[0.08] pt-5">
              <p className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[#6E6E73]">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>Community members</span>
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-[-0.03em] text-[#1D1D1F] tabular-nums">
                {supportersCount.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Clean Apple-style rounded-full actions */}
            <div className="mt-6 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleShareCard}
                disabled={shareState === 'generating'}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-[#F5F5F7] px-4 py-2.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-[#E8E8ED] active:scale-[0.98] disabled:opacity-70 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0071E3] whitespace-nowrap"
              >
                {shareState === 'generating' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#0071E3]" aria-hidden="true" />
                    <span>Preparing...</span>
                  </>
                )}
                {shareState === 'shared' && (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    <span>Shared</span>
                  </>
                )}
                {shareState === 'downloaded' && (
                  <>
                    <Download className="h-4 w-4 text-[#0071E3]" aria-hidden="true" />
                    <span>Card Saved</span>
                  </>
                )}
                {(shareState === 'idle' || shareState === 'error') && (
                  <>
                    <Share2 className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                    <span>Share</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[#0071E3] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0077ED] active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3] whitespace-nowrap"
              >
                Done
              </button>
            </div>

            {shareState === 'downloaded' && (
              <p className="mt-3 text-xs font-medium text-[#6E6E73]">
                Card downloaded &amp; link copied — ready to share anywhere.
              </p>
            )}
            {shareState === 'error' && (
              <p className="mt-3 text-xs font-medium text-[#D70015]">
                Could not prepare the share card. Please try again.
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
