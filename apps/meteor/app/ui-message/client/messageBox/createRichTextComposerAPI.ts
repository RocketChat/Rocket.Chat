import type { Options } from '@rocket.chat/message-parser';
import { Accounts } from 'meteor/accounts-base';

import { createComposerAPI } from './createComposerAPI';
import { escapeHTML } from './messageParser';
import { resolveComposerBox } from './messageStateHandler';
import { getSelectionRange, setSelectionRange } from './selectionRange';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';

export const createRichTextComposerAPI = (
	input: HTMLDivElement,
	storageID: string,
	quoteChainLimit: number,
	parseOptions: Options,
): ComposerAPI => {
	// @ts-expect-error - TODO: Find a way to handle both types
	const composerAPI = createComposerAPI(input, storageID, quoteChainLimit, parseOptions);
	const triggerEvent = (input: HTMLElement, evt: string): void => {
		const event = new Event(evt, { bubbles: true });
		// TODO: Remove this hack for react to trigger onChange
		const tracker = (input as any)._valueTracker;
		if (tracker) {
			tracker.setValue(new Date().toString());
		}
		input.dispatchEvent(event);
	};

	const persist = withDebouncing({ wait: 300 })(() => {
		// Store the value entirely as HTML with the DOM structure intact
		if (input.innerHTML !== '<br>') {
			Accounts.storageLocation.setItem(storageID, input.innerHTML);
			return;
		}

		Accounts.storageLocation.removeItem(storageID);
	});

	input.addEventListener('input', (event: Event) => {
		resolveComposerBox(event, parseOptions);
	});

	const setText = (
		text: string,
		{
			selection,
			skipFocus,
		}: {
			selection?:
				| { readonly start?: number; readonly end?: number }
				| ((previous: { readonly start: number; readonly end: number }) => { readonly start?: number; readonly end?: number });
			skipFocus?: boolean;
		} = {},
	): void => {
		!skipFocus && focus();

		// Use innerHTML to set the value in RichTextComposer instead of innerText
		// Here, text is the variable holding the text to be inserted to the composer
		const { selectionStart, selectionEnd } = getSelectionRange(input);
		const textAreaTxt = input.innerHTML;

		if (typeof selection === 'function') {
			selection = selection({ start: selectionStart, end: selectionEnd });
		}

		if (selection) {
			if (!document.execCommand?.('insertText', false, text)) {
				input.innerHTML = escapeHTML(textAreaTxt.substring(0, selectionStart) + text + textAreaTxt.substring(selectionStart));
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

	const replyWith = async (text: string): Promise<void> => {
		if (input) {
			input.innerText = text;
			input.focus();
		}
	};

	const release = (): void => {
		input.removeEventListener('input', persist);
		input.removeEventListener('input', (event: Event) => {
			resolveComposerBox(event, parseOptions);
		});
		composerAPI.stopFormatterTracker.stop();
	};

	const wrapSelection = (pattern: string): void => {
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
				composerAPI.insertText(selectedText);

				/* Get current selection range */
				const { selectionStart } = getSelectionRange(input);

				if (!document.execCommand?.('insertText', false, selectedText)) {
					input.innerText = initText.slice(0, initText.length - startPattern.length) + selectedText + finalText.slice(endPattern.length);
				}

				const newStart = selectionStart - startPattern.length;
				const newEnd = newStart + selectedText.length;

				setSelectionRange(input, newStart, newEnd);

				triggerEvent(input, 'input');
				triggerEvent(input, 'change');

				focus();
				return;
			}
		}

		// Explictly set the selection range and send focus back to the editor again
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
	};

	const insertNewLine = (): void => composerAPI.insertText('\n');

	setText(Accounts.storageLocation.getItem(storageID) ?? '', {
		skipFocus: true,
	});

	// Gets the text that is connected to the cursor and replaces it with the given text
	const replaceText = (text: string, selection: { readonly start: number; readonly end: number }): void => {
		const { selectionStart, selectionEnd } = getSelectionRange(input);

		// Selects the text that is connected to the cursor
		setSelectionRange(input, selection.start ?? 0, selection.end ?? text.length);
		const textAreaTxt = input.innerText;

		if (!document.execCommand?.('insertText', false, text)) {
			input.innerText = textAreaTxt.substring(0, selection.start) + text + textAreaTxt.substring(selection.end);
		}

		focus();

		// Check if the text starts and ends with a colon symbol (:) - Used for emoji detection
		const emoji = /^:.*:$/.test(text.trim());

		let newStart;
		let newEnd;

		// selectionStart is the current cursor position whereas
		// selection.start is cursor starting position from where replaceText takes into consideration
		// if emoji is true then increment cursor position by 1
		// else increment by the length of the text
		if (emoji) {
			newStart = selection.start + 1;
			newEnd = selection.start + 1;
		} else {
			newStart = selectionStart + text.length;
			newEnd = selectionStart + text.length;
		}

		if (selectionStart !== selectionEnd) {
			setSelectionRange(input, selectionStart, selectionStart);
		} else {
			setSelectionRange(input, newStart, newEnd);
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');
	};

	return {
		...composerAPI,
		replaceText,
		insertNewLine,
		blur: () => input.blur(),

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
		release,
		wrapSelection,
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
		setText,
		focus,
		replyWith,
	};
};
