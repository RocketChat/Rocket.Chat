import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Accounts } from 'meteor/accounts-base';

import type { FormattingButton } from './messageBoxFormatting';
import { formattingButtons } from './messageBoxFormatting';
import { getSelectionRange, setSelectionRange, getLineFromCursorPosition } from './selectionRange';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';

export const createRichTextComposerAPI = (input: HTMLDivElement, storageID: string): ComposerAPI => {
	const triggerEvent = (input: HTMLDivElement, evt: string): void => {
		const event = new Event(evt, { bubbles: true });
		// TODO: Remove this hack for react to trigger onChange
		const tracker = (input as any)._valueTracker;
		if (tracker) {
			tracker.setValue(new Date().toString());
		}
		input.dispatchEvent(event);
	};

	const emitter = new Emitter<{
		quotedMessagesUpdate: void;
		editing: void;
		recording: void;
		recordingVideo: void;
		formatting: void;
		mircophoneDenied: void;
	}>();

	let _quotedMessages: IMessage[] = [];

	const persist = withDebouncing({ wait: 300 })(() => {
		// Store the value entirely as HTML with the DOM structure intact
		if (input.innerHTML !== '<br>') {
			Accounts.storageLocation.setItem(storageID, input.innerHTML);
			return;
		}

		Accounts.storageLocation.removeItem(storageID);
	});

	const notifyQuotedMessagesUpdate = (): void => {
		emitter.emit('quotedMessagesUpdate');
	};

	// Tracking position of text selection range for debugging purpose
	const printSelection = (): void => {
		console.log(getSelectionRange(input));
		console.log(getLineFromCursorPosition(input, getSelectionRange(input)));
	};

	input.addEventListener('input', persist);
	document.addEventListener('selectionchange', printSelection);

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
		const { selectionStart, selectionEnd } = getSelectionRange(input);
		const textAreaTxt = input.innerHTML;

		if (typeof selection === 'function') {
			selection = selection({ start: selectionStart, end: selectionEnd });
		}

		if (selection) {
			if (!document.execCommand?.('insertText', false, text)) {
				input.innerHTML = textAreaTxt.substring(0, selectionStart) + text + textAreaTxt.substring(selectionStart);
				!skipFocus && focus();
			}
			setSelectionRange(input, selection.start ?? 0, selection.end ?? text.length);
		}

		if (!selection) {
			input.innerHTML = text;
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		!skipFocus && focus();
	};

	const insertText = (text: string): void => {
		setText(text, {
			selection: ({ start, end }) => ({
				start: start + text.length,
				end: end + text.length,
			}),
		});
	};

	const clear = (): void => {
		setText('');
	};

	const focus = (): void => {
		input.focus();
	};

	const replyWith = async (text: string): Promise<void> => {
		if (input) {
			input.innerText = text;
			input.focus();
		}
	};

	const quoteMessage = async (message: IMessage): Promise<void> => {
		_quotedMessages = [..._quotedMessages.filter((_message) => _message._id !== message._id), message];
		notifyQuotedMessagesUpdate();
		input.focus();
	};

	const dismissQuotedMessage = async (mid: IMessage['_id']): Promise<void> => {
		_quotedMessages = _quotedMessages.filter((message) => message._id !== mid);
		notifyQuotedMessagesUpdate();
	};

	const dismissAllQuotedMessages = async (): Promise<void> => {
		_quotedMessages = [];
		notifyQuotedMessagesUpdate();
	};

	const quotedMessages = {
		get: () => _quotedMessages,
		subscribe: (callback: () => void) => emitter.on('quotedMessagesUpdate', callback),
	};

	const [editing, setEditing] = (() => {
		let editing = false;

		return [
			{
				get: () => editing,
				subscribe: (callback: () => void) => emitter.on('editing', callback),
			},
			(value: boolean) => {
				editing = value;
				emitter.emit('editing');
			},
		];
	})();

	const [recording, setRecordingMode] = (() => {
		let recording = false;

		return [
			{
				get: () => recording,
				subscribe: (callback: () => void) => emitter.on('recording', callback),
			},
			(value: boolean) => {
				recording = value;
				emitter.emit('recording');
			},
		];
	})();

	const [recordingVideo, setRecordingVideo] = (() => {
		let recordingVideo = false;

		return [
			{
				get: () => recordingVideo,
				subscribe: (callback: () => void) => emitter.on('recordingVideo', callback),
			},
			(value: boolean) => {
				recordingVideo = value;
				emitter.emit('recordingVideo');
			},
		];
	})();

	const [isMicrophoneDenied, setIsMicrophoneDenied] = (() => {
		let isMicrophoneDenied = false;

		return [
			{
				get: () => isMicrophoneDenied,
				subscribe: (callback: () => void) => emitter.on('mircophoneDenied', callback),
			},
			(value: boolean) => {
				isMicrophoneDenied = value;
				emitter.emit('mircophoneDenied');
			},
		];
	})();

	const setEditingMode = (editing: boolean): void => {
		setEditing(editing);
	};

	const [formatters, stopFormatterTracker] = (() => {
		let actions: FormattingButton[] = [];

		const c = Tracker.autorun(() => {
			actions = formattingButtons.filter(({ condition }) => !condition || condition());
			emitter.emit('formatting');
		});

		return [
			{
				get: () => actions,
				subscribe: (callback: () => void) => emitter.on('formatting', callback),
			},
			c,
		];
	})();

	const release = (): void => {
		input.removeEventListener('input', persist);
		document.removeEventListener('selectionchange', printSelection);
		stopFormatterTracker.stop();
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
				insertText(selectedText);

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

	const insertNewLine = (): void => insertText('\n');

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

		// focus();

		// const newStart = selectionStart + pattern.indexOf('{{text}}');
		// const newEnd = newStart + selectedText.length;

		// const range = document.createRange();
		// const selection = window.getSelection();

		// range.setStart(input.firstChild || input, newStart);
		// range.setEnd(input.firstChild || input, newEnd);

		// selection?.removeAllRanges();
		// selection?.addRange(range);

		focus();

		const newStart = selectionStart + text.length;
		const newEnd = selectionStart + text.length;

		if (selectionStart !== selectionEnd) {
			setSelectionRange(input, selectionStart, selectionStart);
		} else {
			setSelectionRange(input, newStart, newEnd);
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');
	};

	return {
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

		editing,
		setEditingMode,
		recording,
		setRecordingMode,
		recordingVideo,
		setRecordingVideo,
		insertText,
		setText,
		clear,
		focus,
		replyWith,
		quoteMessage,
		dismissQuotedMessage,
		dismissAllQuotedMessages,
		quotedMessages,
		formatters,
		isMicrophoneDenied,
		setIsMicrophoneDenied,
	};
};
