import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import { getMessageUrlRegex } from '../../../../lib/getMessageUrlRegex';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';
import type { FormattingButton } from './messageBoxFormatting';
import { formattingButtons } from './messageBoxFormatting';

export const createComposerAPI = (input: HTMLTextAreaElement, storageID: string): ComposerAPI => {
	const triggerEvent = (input: HTMLTextAreaElement, evt: string): void => {
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
		citedUrlsUpdate: void;
		editing: void;
		recording: void;
		recordingVideo: void;
		formatting: void;
		mircophoneDenied: void;
	}>();

	let _quotedMessages: IMessage[] = [];

	const persist = withDebouncing({ wait: 300 })(() => {
		if (input.value) {
			Meteor._localStorage.setItem(storageID, input.value);
			return;
		}

		Meteor._localStorage.removeItem(storageID);
	});

	let _citedUrls: string[] = [];

	const findCitedUrls = withDebouncing({ wait: 30 })(() => {
		const newCitedUrls = [...new Set(input.value.match(getMessageUrlRegex()) ?? [])];

		if (!_.isEqual(_citedUrls, newCitedUrls)) {
			_citedUrls = newCitedUrls;
			emitter.emit('citedUrlsUpdate');
		}

		return newCitedUrls;
	});

	const notifyQuotedMessagesUpdate = (): void => {
		emitter.emit('quotedMessagesUpdate');
	};

	input.addEventListener('input', persist);
	input.addEventListener('input', findCitedUrls);

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
			input.value = text;
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

	const urls = {
		get: () => {
			return _citedUrls;
		},
		subscribe: (callback: () => void) => emitter.on('citedUrlsUpdate', callback),
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
		stopFormatterTracker.stop();
	};

	const wrapSelection = (pattern: string): void => {
		const { selectionEnd = input.value.length, selectionStart = 0 } = input;
		const initText = input.value.slice(0, selectionStart);
		const selectedText = input.value.slice(selectionStart, selectionEnd);
		const finalText = input.value.slice(selectionEnd, input.value.length);

		focus();

		const startPattern = pattern.slice(0, pattern.indexOf('{{text}}'));
		const startPatternFound = [...startPattern].reverse().every((char, index) => input.value.slice(selectionStart - index - 1, 1) === char);

		if (startPatternFound) {
			const endPattern = pattern.slice(pattern.indexOf('{{text}}') + '{{text}}'.length);
			const endPatternFound = [...endPattern].every((char, index) => input.value.slice(selectionEnd + index, 1) === char);

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
				return;
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
	};

	const insertNewLine = (): void => insertText('\n');

	setText(Meteor._localStorage.getItem(storageID) ?? '', {
		skipFocus: true,
	});

	// Gets the text that is connected to the cursor and replaces it with the given text
	const replaceText = (text: string, selection: { readonly start: number; readonly end: number }): void => {
		const { selectionStart, selectionEnd } = input;

		// Selects the text that is connected to the cursor
		input.setSelectionRange(selection.start ?? 0, selection.end ?? text.length);
		const textAreaTxt = input.value;

		if (!document.execCommand?.('insertText', false, text)) {
			input.value = textAreaTxt.substring(0, selection.start) + text + textAreaTxt.substring(selection.end);
		}

		input.selectionStart = selectionStart + text.length;
		input.selectionEnd = selectionStart + text.length;
		if (selectionStart !== selectionEnd) {
			input.selectionStart = selectionStart;
		}

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');

		focus();
	};

	return {
		replaceText,
		insertNewLine,
		blur: () => input.blur(),

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
		release,
		wrapSelection,
		get text(): string {
			return input.value;
		},
		get selection(): { start: number; end: number } {
			return {
				start: input.selectionStart,
				end: input.selectionEnd,
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
		urls,
		quotedMessages,
		formatters,
		isMicrophoneDenied,
		setIsMicrophoneDenied,
	};
};
