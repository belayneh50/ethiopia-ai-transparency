import { useEffect, type ReactNode, useRef } from "react";
import { createPortal } from "react-dom";

/** Shared modal shell mounted to document.body so it never renders inline.
 *  Warm cream card, deep-green headings, gold border/accent, coral warnings only. */
export function ModalShell({
  open,
  onClose,
  titleEn,
  titleAm,
  children,
  footer,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  titleEn: string;
  titleAm: string;
  children: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
}) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Lock body scroll when modal open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus close button for keyboard visibility
    setTimeout(() => closeBtnRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Trap Tab inside modal (basic)
      if (e.key === "Tab" && backdropRef.current) {
        const focusable = backdropRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusable) as HTMLElement[];
        if (list.length === 0) { e.preventDefault(); return; }
        const first = list[0]; const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus(); e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus(); e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const dialog = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || titleEn}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[460px] md:max-w-[520px] rounded-[18px] border-[2.5px] border-[#e0d4a3] bg-gradient-to-b from-[#fffdf8] to-[#f6f4ee] shadow-[0_40px_100px_rgba(10,31,26,0.32),0_16px_32px_rgba(10,31,26,0.14),inset_0_0_0_1px_rgba(255,255,255,0.7)] overflow-y-auto max-h-[90vh] px-6 py-8 md:px-10 md:py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full border-2 border-[#d6cfa5] bg-[#fdfcf8] text-[#68746f] shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:bg-[#e9c867] hover:text-[#1b3c22] hover:border-[#c9a74d] transition duration-150 grid place-items-center text-[16px] font-bold focus:outline-2 focus:outline-[#e9c867] focus:outline-offset-2 cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-[19px] font-extrabold text-[#173f35] leading-snug tracking-tight mb-1">
          <span className="block">{titleEn}</span>
          <span className="block text-[13px] font-semibold text-[#557a5a] mt-0.5">{titleAm}</span>
        </h2>

        <div className="mt-5">{children}</div>

        {footer && (
          <div className="mt-6 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}
