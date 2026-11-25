import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Heart, Menu, Users, User, X } from 'lucide-react';
import { ScissorLogo } from './ScissorLogo';

interface NavbarProps {
  onQuickSupport: () => void;
  isSubmitting: boolean;
}

export function Navbar({ onQuickSupport, isSubmitting }: NavbarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const handleMenuSupport = () => {
    setMenuOpen(false);
    onQuickSupport();
  };

  return (
    <header className="glass-nav fixed bottom-0 inset-x-0 z-40 h-14 w-full sm:h-16">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Scissor Logo + Single-line Brand Wordmark */}
        <a
          href="#supporters"
          onClick={handleNavClick}
          className="group flex items-center gap-2.5 whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0071E3]"
        >
          <ScissorLogo className="h-8 w-8 transition-transform duration-200 group-hover:scale-[1.03]" />
          <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-[#1D1D1F] whitespace-nowrap shrink-0">
            Social Proof
          </span>
        </a>

        {/* Zone 2: Minimalist single-line typography navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#6E6E73]"
        >
          <a
            href="#supporters"
            className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#1D1D1F]"
          >
            Community
          </a>
          <a
            href="#profile"
            className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#1D1D1F]"
          >
            Profile
          </a>
        </nav>

        {/* Zone 3: Classic Minimalist Menu Icon Trigger */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="navbar-menu-panel"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#1D1D1F] transition-colors duration-150 hover:bg-black/[0.05] active:scale-[0.95] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
          >
            {menuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Frosted Glass Upward Menu Sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bottom-14 z-30 bg-black/10 backdrop-blur-[2px] sm:bottom-16"
            />
            <motion.nav
              id="navbar-menu-panel"
              aria-label="Menu"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 8, scale: 0.98 }
              }
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="glass-modal absolute bottom-[calc(100%+10px)] right-4 z-40 w-60 overflow-hidden rounded-2xl p-2 sm:right-6 lg:right-8"
            >
              <a
                href="#supporters"
                onClick={handleNavClick}
                className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.05]"
              >
                <Users className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                <span>Community</span>
              </a>
              <a
                href="#profile"
                onClick={handleNavClick}
                className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.05]"
              >
                <User className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                <span>Profile</span>
              </a>

              <div className="my-1.5 border-t border-black/[0.07]" />

              <button
                type="button"
                onClick={handleMenuSupport}
                disabled={isSubmitting}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-[#0071E3] transition-colors hover:bg-[#0071E3]/[0.08] disabled:opacity-60 cursor-pointer"
              >
                <Heart className="h-4 w-4 fill-[#0071E3] text-[#0071E3]" aria-hidden="true" />
                <span>{isSubmitting ? 'Adding Support...' : 'Add Support'}</span>
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
