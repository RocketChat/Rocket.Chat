import { parse, type Options } from '@rocket.chat/message-parser';
import { escapeHTML } from '@rocket.chat/tools';

import { renderComposerMarkup } from './renderComposerMarkup';
import { getSelectionRange, setSelectionRange } from './selectionRange';

// Paragraphs render with a trailing '\n' the source does not have.
const sameText = (rendered: string, source: string): boolean => rendered.replace(/\n$/, '') === source.replace(/\n$/, '');

// Parse the composer's raw text into markup and render it into the contenteditable,
// restoring the caret to the given flat-offset selection afterwards.
export const renderComposerContent = (
	target: HTMLDivElement,
	parseOptions: Options,
	{ selectionStart, selectionEnd }: { selectionStart: number; selectionEnd: number },
): void => {
	const text = target.innerText;
	const source = text === '' ? '\n' : text;

	// Parse the raw text and render the AST through the gazzodown-alt WYSIWYG components
	target.innerHTML = renderComposerMarkup(parse(source, parseOptions), source);

	// Caret offsets are flat character counts over the rendered text, so a node without a renderer
	// would both lose the user's text and shift the caret. Fall back to the raw text instead.
	if (!sameText(target.textContent ?? '', source)) {
		target.innerHTML = escapeHTML(text);
	}

	// Restore the cursor to the correct position
	setSelectionRange(target, selectionStart, selectionEnd);
};

// Resolve the Composer after the user modifies text
export const resolveComposerBox = (event: Event, parseOptions: Options) => {
	if (!event.isTrusted) return;

	const target = event.target as HTMLDivElement;

	// Get the position of the cursor after text modification
	// This is so that after parsing and rendering inside the editor
	// the cursor is restored to the correct position
	renderComposerContent(target, parseOptions, getSelectionRange(target));
};

// Rendering replaces the composer's innerHTML and re-anchors the DOM selection, and both abort an
// in-flight IME composition (dead keys, CJK input, mobile predictive text): the browser loses the
// text node its marked text was attached to, so `˜` then `a` commits as `˜a` instead of `ã`. Hold
// the render back until the composition commits.
export const createComposerRenderer = (input: HTMLDivElement, parseOptions: Options): { release: () => void } => {
	let composing = false;
	let pendingFrame: number | undefined;

	const cancelPending = (): void => {
		if (pendingFrame === undefined) {
			return;
		}
		cancelAnimationFrame(pendingFrame);
		pendingFrame = undefined;
	};

	const onInput = (event: Event): void => {
		if (!event.isTrusted) {
			return;
		}

		if (composing || (event as InputEvent).isComposing) {
			return;
		}

		// Chrome fires a composition's last `input` before `compositionend` and Firefox after it, so
		// whichever arrives first renders and drops the other's scheduled work.
		cancelPending();
		resolveComposerBox(event, parseOptions);
	};

	const onCompositionStart = (): void => {
		composing = true;
		cancelPending();
	};

	const onCompositionEnd = (): void => {
		composing = false;
		cancelPending();
		pendingFrame = requestAnimationFrame(() => {
			pendingFrame = undefined;

			// A new composition already started (fast dead-key sequences); it renders on its own end.
			if (composing) {
				return;
			}

			// The composer can be cleared between the commit and this frame (Safari sends the keydown of
			// the key that confirmed the composition, so Enter both commits and sends). Rendering '' yields
			// the renderer's trailing newline, which would leave the cleared composer non-empty.
			if (input.innerText === '') {
				return;
			}

			renderComposerContent(input, parseOptions, getSelectionRange(input));
		});
	};

	input.addEventListener('input', onInput);
	input.addEventListener('compositionstart', onCompositionStart);
	input.addEventListener('compositionend', onCompositionEnd);

	return {
		release: (): void => {
			cancelPending();
			input.removeEventListener('input', onInput);
			input.removeEventListener('compositionstart', onCompositionStart);
			input.removeEventListener('compositionend', onCompositionEnd);
		},
	};
};
