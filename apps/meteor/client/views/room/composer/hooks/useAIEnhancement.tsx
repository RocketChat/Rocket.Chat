import { Button } from '@rocket.chat/fuselage';
import { useCallback, useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
import type { RefObject, ReactElement } from 'react';

/*
 * Hook: useAIEnhancement
 * ----------------------
 * Adds an AI contextual menu to a content-editable message composer.
 *
 * – Shows a small popup with three AI actions (Summary, Emoji, Translation)
 *   when the user selects some text with the mouse.
 * – While an action is running, the selected text gets wrapped in a <span>
 *   with a visual pulse animation and becomes temporarily unselectable.
 * – When the (simulated) AI response resolves, the span is filled with the
 *   resulting string, character-by-character, to create a "typing" effect.
 *
 * The hook returns a React element that must be rendered by the caller so the
 * popup can appear in the DOM tree (usually overlayed via fixed positioning).
 */

const PULSE_ANIMATION_STYLE = `
@keyframes aiBackgroundPulse {
  0% { background-color: var(--pulse-color-start); }
  50% { background-color: var(--pulse-color-end); }
  100% { background-color: var(--pulse-color-start); }
}

@keyframes aiPopupAnimate {
	from {
		opacity: 0;
		transform: translate(-50%, -90%) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translate(-50%, -110%) scale(1);
	}
}
.ai-enhancement-transform {
  border-radius: 3px;
  user-select: none;
  animation: aiBackgroundPulse 1.5s ease-in-out infinite;
  padding: 1px 2px;
  margin: -1px -2px;
}

.ai-enhancement-summary {
  --pulse-color-start: rgba(255, 220, 0, 0.25);
  --pulse-color-end: rgba(255, 220, 0, 0.45);
}

.ai-enhancement-emoji {
  --pulse-color-start: rgba(0, 200, 255, 0.25);
  --pulse-color-end: rgba(0, 200, 255, 0.45);
}

.ai-enhancement-translation {
  --pulse-color-start: rgba(0, 255, 120, 0.25);
  --pulse-color-end: rgba(0, 255, 120, 0.45);
}

.ai-enhancement-popup {
  display: flex;
  gap: 0;
  background: var(--rc-color-surface, #fff);
  border: 1px solid var(--rc-color-border-light, #ccc);
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  transform: translate(-50%, -110%);
  animation: aiPopupAnimate 0.25s ease-out;
  padding: 1px;
}
.ai-enhancement-popup button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.6rem;
  border-radius: 2px;
  color: var(--rc-color-font-default, #1f2329);
  line-height: 1;
  padding: 2px;
}
.ai-enhancement-popup button:hover {
  background: var(--rc-color-primary-light, #e8f0fe);
}`;

let styleElement: HTMLStyleElement | null = null;

const ensureStylesInjected = () => {
  if (styleElement) {
    return;
  }
  styleElement = document.createElement('style');
  styleElement.innerHTML = PULSE_ANIMATION_STYLE;
  document.head.appendChild(styleElement);
};

type PopupState = { x: number; y: number } | null;

type AIAction = 'summary' | 'emoji' | 'translation';

export const useAIEnhancement = (contentRef: RefObject<HTMLDivElement>): ReactElement | null => {
  // const { t } = useTranslation();
  const [popup, setPopup] = useState<PopupState>(null);

  // Ensure CSS is available exactly once.
  useEffect(() => {
    ensureStylesInjected();
  }, []);

  const clearPopup = useCallback(() => setPopup(null), []);

  // Detect selection via mouse.
  useEffect(() => {
    const refNode = contentRef.current;
    if (!refNode) {
      return;
    }

  
      const handleMouseUp = (event: MouseEvent) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setPopup(null);
          return;
        }
        // Ensure the selection is inside the composer.
        const range = selection.getRangeAt(0);
        if (!refNode.contains(range.commonAncestorContainer)) {
          setPopup(null);
          return;
        }
        // Use event.clientX and event.clientY for cursor position
        const cursorPosition = { x: event.clientX, y: event.clientY};
        setPopup(cursorPosition);
      };

    refNode.addEventListener('mouseup', handleMouseUp);
    return () => {
      refNode.removeEventListener('mouseup', handleMouseUp);
    };
  }, [contentRef]);

  const runAIAction = useCallback(
    async (type: AIAction) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        clearPopup();
        return;
      }
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      // Wrap selected text into a span for visual feedback.
      const span = document.createElement('span');
      span.className = `ai-enhancement-transform ai-enhancement-${type}`;
      span.textContent = selectedText;

      // Replace range with span.
      range.deleteContents();
      range.insertNode(span);

      // Clear user selection and popup.
      selection.removeAllRanges();
      clearPopup();

      // Disable user interaction with the span while processing.
      span.setAttribute('contenteditable', 'false');

      // Simulate API call.
      const result = await new Promise<string>((resolve) => {
        setTimeout(() => {
          switch (type) {
            case 'summary':
              resolve(`----------- Summary -----------`);
              break;
            case 'emoji':
              resolve(`-----------😊 "${selectedText}" 🤗-----------`);
              break;
            case 'translation':
            default:
              resolve(`----------- Selected text : "${selectedText}" is translated -----------`);
          }
        }, 5000);
      });

      await new Promise<void>((resolve) => {
        const chars = result.split('');
        let idx = 0;
        span.classList.remove('ai-enhancement-transform', `ai-enhancement-${type}`);
        const interval = setInterval(() => {
          span.textContent = result.slice(0, idx + 1);
          idx += 1;
          if (idx === chars.length) {
            clearInterval(interval);
            // Re-enable editing.
            span.removeAttribute('contenteditable');
            resolve();
          }
        }, 30);
      });
    },
    [clearPopup],
  );

  if (!popup) {
    return null;
  }

  return (
    <div
      className='ai-enhancement-popup'
      style={{ position: 'fixed', top: popup.y, left: popup.x }}
      onMouseDown={(e) => e.preventDefault()} // Prevent focus loss.
    >
      <Button small onClick={() => runAIAction('summary')} icon='keyboard' data-tooltip={('AI summarize')} />
      <Button small onClick={() => runAIAction('emoji')} icon='emoji' data-tooltip={('AI emojify')} />
      <Button small onClick={() => runAIAction('translation')} icon='language' data-tooltip={('AI translate')} />
    </div>
  );
}; 