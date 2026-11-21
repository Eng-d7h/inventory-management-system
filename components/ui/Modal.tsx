"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    // Close with the Escape key
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    // Stop the page behind the modal from scrolling
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
