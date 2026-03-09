import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Accounts } from 'meteor/accounts-base';
import type { RefObject } from 'react';

import { limitQuoteChain } from './limitQuoteChain';
import type { FormattingButton } from './messageBoxFormatting';
import { formattingButtons } from './messageBoxFormatting';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';

export const createComposerAPI = (
	input: HTMLTextAreaElement,
	storageID: string,
	quoteChainLimit: number,
	composerRef: RefObject<HTMLElement>,
): ComposerAPI => {
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
		editing: void;
		recording: void;
		recordingVideo: void;
		formatting: void;
		mircophoneDenied: void;
	}>();

	let _quotedMessages: IMessage[] = [];

	const persist = withDebouncing({ wait: 300 })(() => {
		if (input.value) {
			Accounts.storageLocation.setItem(storageID, input.value);
			return;
		}

		Accounts.storageLocation.removeItem(storageID);
	});

	const notifyQuotedMessagesUpdate = (): void => {
		emitter.emit('quotedMessagesUpdate');
	};

	input.addEventListener('input', persist);

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
		_quotedMessages = [..._quotedMessages.filter((_message) => _message._id !== message._id), limitQuoteChain(message, quoteChainLimit)];
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
		stopFormatterTracker.stop();
	};

	const wrapSelection = (pattern: string): void => {
		const token = '{{text}}';
		const i = pattern.indexOf(token);
		if (i === -1) return;

		const startPattern = pattern.slice(0, i);
		const endPattern = pattern.slice(i + token.length);

		const text = input.value;
		let { selectionStart: start, selectionEnd: end } = input;

		focus();

		const before = text.slice(0, start);
		const selected = text.slice(start, end);
		const after = text.slice(end);

		const left = before.lastIndexOf(startPattern);
		const rightRelative = after.indexOf(endPattern);
		const right = rightRelative === -1 ? -1 : end + rightRelative;

		const inside =
			left !== -1 &&
			right !== -1 &&
			left + startPattern.length <= start &&
			right >= end;

		if (inside) {
			const unwrapStart = left;
			const unwrapEnd = right + endPattern.length;

			const inner = text.slice(
				left + startPattern.length,
				right
			);

			input.setSelectionRange(unwrapStart, unwrapEnd);

			if (!document.execCommand?.('insertText', false, inner)) {
				input.value =
					text.slice(0, unwrapStart) +
					inner +
					text.slice(unwrapEnd);
			}

			const pos = unwrapStart;
			input.setSelectionRange(pos, pos + inner.length);

			triggerEvent(input, 'input');
			triggerEvent(input, 'change');
			focus();
			return;
		}

		if (!selected && before.endsWith(startPattern)) {
			const newBefore = before.slice(0, before.length - startPattern.length);
			input.value = newBefore + after;
			const pos = newBefore.length;
			input.setSelectionRange(pos, pos);
			triggerEvent(input, 'input');
			triggerEvent(input, 'change');
			focus();
			return;
		}

		const wrapped = `${startPattern}${selected}${endPattern}`;

		input.setSelectionRange(start, end);

		if (!document.execCommand?.('insertText', false, wrapped)) {
			input.value = before + wrapped + after;
		}

		const caret = start + startPattern.length;
		input.setSelectionRange(caret, caret + selected.length);

		triggerEvent(input, 'input');
		triggerEvent(input, 'change');
		focus();
	};

	const insertNewLine = (): void => insertText('\n');

	setText(Accounts.storageLocation.getItem(storageID) ?? '', {
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
		composerRef,
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
		quotedMessages,
		formatters,
		isMicrophoneDenied,
		setIsMicrophoneDenied,
	};
};
