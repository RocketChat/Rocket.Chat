import { Button } from '@rocket.chat/fuselage';
import { useCallback, useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
import type { RefObject, ReactElement } from 'react';

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
  user-select: none;
  animation: aiBackgroundPulse 1.5s ease-in-out infinite;
  margin-left: 1px;
  margin-right: 1px;
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

.ai-enhancement-suggestion {
	position: relative;
	border-radius: 4px;
	margin: -2px -3px;
	cursor: default;
	display: inline;
	transition: all 0.2s ease-in-out;
}

.ai-enhancement-suggestion:hover {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-suggestion-summary {
	background-color: #fffbe6;
  color: rgb(5, 151, 255);
	border: 2px dashed rgb(0, 0, 0);
  margin-left: 1px;
  margin-right: 1px;
}

.ai-suggestion-emoji {
	background-color: #e6f7ff;
  color: rgb(5, 151, 255);
	border: 2px dashed rgb(0, 0, 0);
  margin-left: 1px;
  margin-right: 1px;
}

.ai-suggestion-translation {
	background-color: #f6ffed;
  color: rgb(5, 151, 255);
	border: 2px dashed rgb(0, 0, 0); 
  margin-left: 1px;
  margin-right: 1px;
}

.ai-enhancement-suggestion:hover .ai-suggestion-actions {
	display: flex;
}

.ai-suggestion-actions {
	position: absolute;
	top: -12px;
	left: -12px;
	display: none;
	gap: 4px;
	background: #fff;
	border-radius: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	padding: 3px;
	z-index: 10;
	line-height: 1;
}

.ai-suggestion-actions button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	border: none;
	cursor: pointer;
	font-size: 12px;
	color: #fff;
	transition: all 0.2s ease-in-out;
}

.ai-suggestion-actions .accept {
	background-color: #52c41a;
}
.ai-suggestion-actions .accept:hover {
	background-color: #73d13d;
}

.ai-suggestion-actions .reject {
	background-color: #f5222d;
}
.ai-suggestion-actions .reject:hover {
	background-color: #ff4d4f;
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
			const cursorPosition = { x: event.clientX, y: event.clientY };
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
			span.dataset.originalText = selectedText;

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

			await new Promise<void>((resolveTyping) => {
				const chars = result.split('');
				let idx = 0;
				span.classList.remove('ai-enhancement-transform', `ai-enhancement-${type}`);
				const interval = setInterval(() => {
					span.textContent = result.slice(0, idx + 1);
					idx += 1;
					if (idx === chars.length) {
						clearInterval(interval);
						resolveTyping();
					}
				}, 30);
			});

			const finalTransformedText = span.textContent;

			span.removeAttribute('contenteditable');
			span.className = `ai-enhancement-suggestion ai-suggestion-${type}`;

			const actions = document.createElement('div');
			actions.className = 'ai-suggestion-actions';
			actions.setAttribute('contenteditable', 'false');

			const acceptBtn = document.createElement('button');
			acceptBtn.textContent = '✓';
			acceptBtn.className = 'accept';
			acceptBtn.setAttribute('type', 'button');
			acceptBtn.onclick = () => {
				if (span.parentNode) {
					const textNode = document.createTextNode(finalTransformedText || '');
					span.parentNode.replaceChild(textNode, span);
				}
			};

			const rejectBtn = document.createElement('button');
			rejectBtn.textContent = '✗';
			rejectBtn.className = 'reject';
			rejectBtn.setAttribute('type', 'button');
			rejectBtn.onclick = () => {
				if (span.parentNode) {
					const textNode = document.createTextNode(span.dataset.originalText || '');
					span.parentNode.replaceChild(textNode, span);
				}
			};

			actions.appendChild(acceptBtn);
			actions.appendChild(rejectBtn);

			let tooltipText = '';
			switch (type) {
				case 'summary':
					tooltipText = 'AI Summary';
					break;
				case 'emoji':
					tooltipText = 'AI Emojify';
					break;
				case 'translation':
					tooltipText = 'AI Translation';
					break;
			}
			span.classList.add('with-tooltip');
			span.dataset.tooltip = tooltipText;

			span.appendChild(actions);
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
			<Button small onClick={() => runAIAction('summary')} icon='keyboard' data-tooltip='AI summarize' />
			<Button small onClick={() => runAIAction('emoji')} icon='emoji' data-tooltip='AI emojify' />
			<Button small onClick={() => runAIAction('translation')} icon='language' data-tooltip='AI translate' />
		</div>
	);
};
