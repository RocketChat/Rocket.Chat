import type { Options } from '@rocket.chat/message-parser';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { RefObject } from 'react';

import { createComposerAPICore, triggerEvent, type SetText } from './createComposerAPICore';
import { limitQuoteChain } from './limitQuoteChain';
import { resolveComposerBox } from './messageStateHandler';
import { getSelectionRange, setSelectionRange } from './selectionRange';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';

export const createRichTextComposerAPI = (
	input: HTMLDivElement,
	persistDraft: (value: string) => void,
	initialDraft: string,
	quoteChainLimit: number,
	parseOptions: Options,
	composerRef: RefObject<HTMLElement | null>,
	{ rid, tmid }: { rid: string; tmid?: string },
): ComposerAPI => {
	const focus = (): void => {
		input.focus();
	};

	const setText: SetText = (text, { selection, skipFocus } = {}) => {
		!skipFocus && focus();

		const { selectionStart, selectionEnd } = getSelectionRange(input);

		if (typeof selection === 'function') {
			selection = selection({ start: selectionStart, end: selectionEnd });
		}

		if (selection) {
			// Establish the caret inside the input before execCommand. Focusing alone does not create a
			// selection range on an empty/blurred composer, so without this the insert is a silent no-op.
			setSelectionRange(input, selectionStart, selectionEnd);

			// execCommand can report success while inserting nothing (empty composer) or insert into a
			// different focused element (e.g. the emoji picker search box). Detect that the composer text
			// did not actually change and fall back to editing it directly.
			const before = input.innerText;
			const inserted = document.execCommand?.('insertText', false, text) ?? false;
			if (!inserted || input.innerText === before) {
				input.innerText = before.substring(0, selectionStart) + text + before.substring(selectionEnd);
				!skipFocus && focus();
			}
			setSelectionRange(input, selection.start ?? 0, selection.end ?? text.length);
		}

		if (!selection) {
			input.innerHTML = escapeHTML(text);
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		!skipFocus && focus();
	};

	const rerender = (event: Event): void => resolveComposerBox(event, parseOptions);

	input.addEventListener('input', rerender);

	const core = createComposerAPICore({
		input,
		composerRef,
		room: { rid, tmid },
		initialValue: initialDraft,
		save: () => persistDraft(input.innerText),
		setText,
		focus,
		prepareQuotedMessage: (message) => limitQuoteChain(message, quoteChainLimit),
	});

	const { insertText } = core;

	const wrapSelection = (pattern: string): { selectionStart: number; selectionEnd: number; value: string } => {
		const { selectionStart, selectionEnd } = getSelectionRange(input);
		// Sanitize the innerText by reducing multiple instances of linebreaks
		const cleanedInitText = input.innerText.replace(/\n{2,}/g, (match) => '\n'.repeat(match.length - 1));

		const initText = cleanedInitText.slice(0, selectionStart);
		const selectedText = cleanedInitText.slice(selectionStart, selectionEnd);
		const finalText = cleanedInitText.slice(selectionEnd, input.innerText.length);

		focus();

		const startPattern = pattern.slice(0, pattern.indexOf('{{text}}'));
		const startPatternFound = [...startPattern]
			.reverse()
			.every((char, index) => input.innerText.slice(selectionStart - index - 1, 1) === char);

		if (startPatternFound) {
			const endPattern = pattern.slice(pattern.indexOf('{{text}}') + '{{text}}'.length);
			const endPatternFound = [...endPattern].every((char, index) => input.innerText.slice(selectionEnd + index, 1) === char);

			if (endPatternFound) {
				insertText(selectedText);

				const { selectionStart: newSelStart } = getSelectionRange(input);

				if (!document.execCommand?.('insertText', false, selectedText)) {
					input.innerText = initText.slice(0, initText.length - startPattern.length) + selectedText + finalText.slice(endPattern.length);
				}

				const newStart = newSelStart - startPattern.length;
				const newEnd = newStart + selectedText.length;

				setSelectionRange(input, newStart, newEnd);

				triggerEvent(input, 'input');
				triggerEvent(input, 'change');

				focus();
				return { selectionStart: newStart, selectionEnd: newEnd, value: input.innerText };
			}
		}

		// Explicitly set the selection range and send focus back to the editor again
		// This ensures the execCommand works properly when pressing buttons instead of hotkeys
		setSelectionRange(input, selectionStart, selectionEnd);
		focus();

		if (!document.execCommand?.('insertText', false, pattern.replace('{{text}}', selectedText))) {
			input.innerText = initText + pattern.replace('{{text}}', selectedText) + finalText;
		}

		focus();

		const newStart = selectionStart + pattern.indexOf('{{text}}');
		const newEnd = newStart + selectedText.length;

		setSelectionRange(input, newStart, newEnd);

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		return { selectionStart: newStart, selectionEnd: newEnd, value: input.innerText };
	};

	// Gets the text that is connected to the cursor and replaces it with the given text
	const replaceText = (text: string, selection: { readonly start: number; readonly end: number }): void => {
		const { selectionStart, selectionEnd } = getSelectionRange(input);

		// Selects the text that is connected to the cursor, then focus so execCommand has an active target
		setSelectionRange(input, selection.start ?? 0, selection.end ?? text.length);
		focus();
		const textAreaTxt = input.innerText;

		const inserted = document.execCommand?.('insertText', false, text) ?? false;
		if (!inserted || input.innerText === textAreaTxt) {
			input.innerText = textAreaTxt.substring(0, selection.start) + text + textAreaTxt.substring(selection.end);
		}

		const newStart = selection.start + text.length;
		const newEnd = selection.start + text.length;

		if (selectionStart !== selectionEnd) {
			setSelectionRange(input, selectionStart, selectionStart);
		} else {
			setSelectionRange(input, newStart, newEnd);
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');
	};

	const replyWith = async (text: string): Promise<void> => {
		if (input) {
			input.innerText = text;
			input.focus();
		}
	};

	return {
		...core,
		release: () => {
			core.release();
			input.removeEventListener('input', rerender);
		},
		setText,
		wrapSelection,
		replaceText,
		replyWith,
		substring: (start: number, end?: number) => {
			// Sanitize the innerText by reducing multiple instances of linebreaks
			const cleanedInitText = input.innerText.replace(/\n{2,}/g, (match) => '\n'.repeat(match.length - 1));
			return cleanedInitText.substring(start, end);
		},
		getCursorPosition: () => {
			return getSelectionRange(input).selectionStart;
		},
		setCursorToEnd: () => {
			const end = input.innerText.length;
			focus();
			setSelectionRange(input, end, end);
		},
		setCursorToStart: () => {
			focus();
			setSelectionRange(input, 0, 0);
		},
		get text(): string {
			return input.innerText;
		},
		get selection(): { start: number; end: number } {
			const { selectionStart, selectionEnd } = getSelectionRange(input);
			return {
				start: selectionStart,
				end: selectionEnd,
			};
		},
	};
};
