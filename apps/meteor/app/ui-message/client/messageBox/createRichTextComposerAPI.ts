import type { Options } from '@rocket.chat/message-parser';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { RefObject } from 'react';

import { createComposerAPICore, triggerEvent, type SetText } from './createComposerAPICore';
import { limitQuoteChain } from './limitQuoteChain';
import { renderComposerContent, resolveComposerBox } from './messageStateHandler';
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
			// different focused element (e.g. the emoji picker search box). Fall back to editing directly
			// only when the composer text is not already the expected splice, so a successful insert keeps
			// its rendered markup instead of being flattened to innerText.
			const before = input.innerText;
			const expected = before.substring(0, selectionStart) + text + before.substring(selectionEnd);
			document.execCommand?.('insertText', false, text);
			if (input.innerText !== expected) {
				input.innerText = expected;
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

	const wrapSelection = (pattern: string): { selectionStart: number; selectionEnd: number; value: string } => {
		const { selectionStart, selectionEnd } = getSelectionRange(input);
		const cleanedInitText = input.innerText;

		// Double-clicking the last word of a line selects the trailing paragraph newline too; keep any
		// trailing newlines out of the wrapped range so the closing marker stays on the same line.
		const rawSelected = cleanedInitText.slice(selectionStart, selectionEnd);
		const selectedText = rawSelected.replace(/\n+$/, '');
		const selEnd = selectionEnd - (rawSelected.length - selectedText.length);

		const initText = cleanedInitText.slice(0, selectionStart);
		const finalText = cleanedInitText.slice(selEnd, input.innerText.length);

		focus();

		const startPattern = pattern.slice(0, pattern.indexOf('{{text}}'));
		const endPattern = pattern.slice(pattern.indexOf('{{text}}') + '{{text}}'.length);

		const startPatternFound =
			startPattern.length > 0 &&
			selectionStart >= startPattern.length &&
			cleanedInitText.slice(selectionStart - startPattern.length, selectionStart) === startPattern;
		const endPatternFound = endPattern.length > 0 && cleanedInitText.slice(selEnd, selEnd + endPattern.length) === endPattern;

		if (startPatternFound && endPatternFound) {
			const unwrapStart = selectionStart - startPattern.length;
			const unwrapEnd = unwrapStart + selectedText.length;

			setSelectionRange(input, unwrapStart, selEnd + endPattern.length);
			focus();

			if (selectedText.includes('\n') || !document.execCommand?.('insertText', false, selectedText)) {
				input.innerText = initText.slice(0, unwrapStart) + selectedText + finalText.slice(endPattern.length);
				renderComposerContent(input, parseOptions, { selectionStart: unwrapStart, selectionEnd: unwrapEnd });
			}

			focus();

			setSelectionRange(input, unwrapStart, unwrapEnd);

			triggerEvent(input, 'input');
			triggerEvent(input, 'change');

			return { selectionStart: unwrapStart, selectionEnd: unwrapEnd, value: input.innerText };
		}

		// Explicitly set the selection range and send focus back to the editor again
		// This ensures the execCommand works properly when pressing buttons instead of hotkeys
		setSelectionRange(input, selectionStart, selEnd);
		focus();

		const replacement = pattern.replace('{{text}}', selectedText);
		const newStart = selectionStart + pattern.indexOf('{{text}}');
		const newEnd = newStart + selectedText.length;

		// execCommand('insertText') mangles embedded newlines (drops them and duplicates the last
		// character across the caret), so for multi-line selections rebuild the text directly and
		// re-render the markup ourselves.
		if (replacement.includes('\n') || !document.execCommand?.('insertText', false, replacement)) {
			input.innerText = initText + replacement + finalText;
			renderComposerContent(input, parseOptions, { selectionStart: newStart, selectionEnd: newEnd });
		}

		focus();

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
		const expected = textAreaTxt.substring(0, selection.start) + text + textAreaTxt.substring(selection.end);

		document.execCommand?.('insertText', false, text);
		if (input.innerText !== expected) {
			input.innerText = expected;
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
		setText(text);
		const end = input.innerText.length;
		renderComposerContent(input, parseOptions, { selectionStart: end, selectionEnd: end });
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
			return input.innerText.substring(start, end);
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
