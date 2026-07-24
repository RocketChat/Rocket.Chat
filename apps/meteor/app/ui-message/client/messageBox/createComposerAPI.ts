import type { RefObject } from 'react';

import { createComposerAPICore, triggerEvent, type SetText } from './createComposerAPICore';
import { limitQuoteChain } from './limitQuoteChain';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';

export const createComposerAPI = (
	input: HTMLTextAreaElement,
	persistDraft: (value: string) => void,
	initialDraft: string,
	quoteChainLimit: number,
	composerRef: RefObject<HTMLElement | null>,
	{ rid, tmid }: { rid: string; tmid?: string },
): ComposerAPI => {
	const focus = (): void => {
		input.focus();
	};

	const setText: SetText = (text, { selection, skipFocus } = {}) => {
		!skipFocus && focus();

		const { selectionStart, selectionEnd } = input;
		const textAreaTxt = input.value;

		if (typeof selection === 'function') {
			selection = selection({ start: selectionStart, end: selectionEnd });
		}

		if (selection) {
			if (!document.execCommand?.('insertText', false, text)) {
				input.value = textAreaTxt.substring(0, selectionStart) + text + textAreaTxt.substring(selectionStart);
				!skipFocus && focus();
			}
			input.setSelectionRange(selection.start ?? 0, selection.end ?? text.length);
		}

		if (!selection) {
			input.value = text;
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		!skipFocus && focus();
	};

	const core = createComposerAPICore({
		input,
		composerRef,
		room: { rid, tmid },
		initialValue: initialDraft,
		save: () => persistDraft(input.value),
		setText,
		focus,
		prepareQuotedMessage: (message) => limitQuoteChain(message, quoteChainLimit),
	});

	const { insertText } = core;

	const wrapSelection = (pattern: string): { selectionStart: number; selectionEnd: number; value: string } => {
		const { selectionEnd = input.value.length, selectionStart = 0 } = input;
		const initText = input.value.slice(0, selectionStart);
		const selectedText = input.value.slice(selectionStart, selectionEnd);
		const finalText = input.value.slice(selectionEnd, input.value.length);

		focus();

		const startPattern = pattern.slice(0, pattern.indexOf('{{text}}'));
		const startPatternFound = input.value.slice(selectionStart - startPattern.length, selectionStart) === startPattern;

		if (startPatternFound) {
			const endPattern = pattern.slice(pattern.indexOf('{{text}}') + '{{text}}'.length);
			const endPatternFound = input.value.slice(selectionEnd, selectionEnd + endPattern.length) === endPattern;

			if (endPatternFound) {
				insertText(selectedText);
				input.selectionStart = selectionStart - startPattern.length;
				input.selectionEnd = selectionEnd + endPattern.length;

				if (!document.execCommand?.('insertText', false, selectedText)) {
					input.value = initText.slice(0, initText.length - startPattern.length) + selectedText + finalText.slice(endPattern.length);
				}

				input.selectionStart = selectionStart - startPattern.length;
				input.selectionEnd = input.selectionStart + selectedText.length;
				triggerEvent(input, 'input');
				triggerEvent(input, 'change');

				focus();
				return {
					selectionStart: input.selectionStart,
					selectionEnd: input.selectionEnd,
					value: input.value,
				};
			}
		}

		if (!document.execCommand?.('insertText', false, pattern.replace('{{text}}', selectedText))) {
			input.value = initText + pattern.replace('{{text}}', selectedText) + finalText;
		}

		input.selectionStart = selectionStart + pattern.indexOf('{{text}}');
		input.selectionEnd = input.selectionStart + selectedText.length;
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
