import type { RefObject } from 'react';

import { wrapSelectionText } from './wrapSelectionText';
import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';
import { createComposerAPICore, triggerEvent, type SetText } from '../../../../lib/createComposerAPICore';
import { limitQuoteChain } from '../../../../lib/limitQuoteChain';

export const createComposerAPI = (
	input: HTMLTextAreaElement,
	persistDraft: (value: string) => void,
	discardDraft: () => void,
	initialDraft: string,
	quoteChainLimit: number,
	composerRef: RefObject<HTMLElement | null>,
	{ rid, tmid }: { rid: string; tmid?: string },
): ComposerAPI => {
	const focus = (): void => {
		input.focus();
	};

	const setText: SetText = (text, { selection, skipFocus } = {}) => {
		if (!skipFocus) {
			focus();
		}

		const { selectionStart, selectionEnd } = input;
		const textAreaTxt = input.value;

		if (typeof selection === 'function') {
			selection = selection({ start: selectionStart, end: selectionEnd });
		}

		if (selection) {
			if (!document.execCommand?.('insertText', false, text)) {
				input.value = textAreaTxt.substring(0, selectionStart) + text + textAreaTxt.substring(selectionStart);
				if (!skipFocus) {
					focus();
				}
			}
			input.setSelectionRange(selection.start ?? 0, selection.end ?? text.length);
		}

		if (!selection) {
			input.value = text;
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		if (!skipFocus) {
			focus();
		}
	};

	const core = createComposerAPICore({
		input,
		composerRef,
		room: { rid, tmid },
		initialValue: initialDraft,
		save: () => persistDraft(input.value),
		discardDraft,
		setText,
		focus,
		prepareQuotedMessage: (message) => limitQuoteChain(message, quoteChainLimit),
	});

	const { insertText } = core;

	const wrapSelection = (pattern: string): { selectionStart: number; selectionEnd: number; value: string } => {
		const { selectionEnd = input.value.length, selectionStart = 0 } = input;
		const selectedText = input.value.slice(selectionStart, selectionEnd);
		const { text, selection, toggledOff, replacement } = wrapSelectionText(
			input.value,
			{ start: selectionStart, end: selectionEnd },
			pattern,
		);

		focus();

		if (toggledOff) {
			insertText(selectedText);
			input.selectionStart = replacement.start;
			input.selectionEnd = replacement.end;
		}

		if (!document.execCommand?.('insertText', false, replacement.text)) {
			input.value = text;
		}

		input.selectionStart = selection.start;
		input.selectionEnd = selection.end;
		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		focus();

		return {
			selectionStart: input.selectionStart,
			selectionEnd: input.selectionEnd,
			value: input.value,
		};
	};

	// Gets the text that is connected to the cursor and replaces it with the given text
	const replaceText = (text: string, selection: { readonly start: number; readonly end: number }): void => {
		// Selects the text that is connected to the cursor
		input.setSelectionRange(selection.start ?? 0, selection.end ?? text.length);
		const textAreaTxt = input.value;

		if (!document.execCommand?.('insertText', false, text)) {
			input.value = textAreaTxt.substring(0, selection.start) + text + textAreaTxt.substring(selection.end);
		}

		const cursorPosition = (selection.start ?? 0) + text.length;
		input.selectionStart = cursorPosition;
		input.selectionEnd = cursorPosition;

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		focus();
	};

	const replyWith = async (text: string): Promise<void> => {
		setText(text);
	};

	return {
		...core,
		setText,
		wrapSelection,
		replaceText,
		replyWith,
		substring: (start: number, end?: number) => {
			return input.value.substring(start, end);
		},
		getCursorPosition: () => {
			return input.selectionStart;
		},
		setCursorToEnd: () => {
			input.selectionEnd = input.value.length;
			input.selectionStart = input.selectionEnd;
			focus();
		},
		setCursorToStart: () => {
			input.selectionStart = 0;
			input.selectionEnd = input.selectionStart;
			focus();
		},
		get text(): string {
			return input.value;
		},
		get selection(): { start: number; end: number } {
			return {
				start: input.selectionStart,
				end: input.selectionEnd,
			};
		},
	};
};
