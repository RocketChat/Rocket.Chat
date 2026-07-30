import { parse, type Options } from '@rocket.chat/message-parser';
import { escapeHTML } from '@rocket.chat/string-helpers';

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
