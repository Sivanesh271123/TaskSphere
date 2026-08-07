import { useEffect, useRef } from 'react';

export default function useFocusTrap(isActive, onClose) {
  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    // Save the element that triggered the modal
    triggerRef.current = document.activeElement;

    const focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    
    let focusableElements = [];
    let firstTabStop = null;
    let lastTabStop = null;

    const setupFocus = () => {
      if (modalRef.current) {
        focusableElements = Array.from(modalRef.current.querySelectorAll(focusableElementsString));
        if (focusableElements.length > 0) {
          firstTabStop = focusableElements[0];
          lastTabStop = focusableElements[focusableElements.length - 1];
          // Focus the first element (or autofocus element if we handled it, but this covers basics)
          // setTimeout allows the DOM to render if there are transitions
          setTimeout(() => {
            const autoFocusEl = modalRef.current.querySelector('[autofocus]');
            if (autoFocusEl) {
              autoFocusEl.focus();
            } else {
              firstTabStop.focus();
            }
          }, 50);
        }
      }
    };

    setupFocus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstTabStop) {
            e.preventDefault();
            lastTabStop.focus();
          }
        } else {
          if (document.activeElement === lastTabStop) {
            e.preventDefault();
            firstTabStop.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isActive, onClose]);

  return modalRef;
}
