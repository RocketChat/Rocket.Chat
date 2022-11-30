import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import $ from 'jquery';

import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import './messageBoxActions';
import './messageBoxReplyPreview.ts';
import './userActionIndicator.ts';
import './messageBox.html';

export const createComposerAPI = (input: HTMLTextAreaElement, storageID: string): ComposerAPI => {
	const emitter = new Emitter<{ quotedMessagesUpdate: void }>();

	let _quotedMessages: IMessage[] = [];

	const persist = withDebouncing({ wait: 1000 })(() => {
		if (input.value) {
			Meteor._localStorage.setItem(storageID, input.value);
			return;
		}

		Meteor._localStorage.removeItem(storageID);
	});

	const notifyQuotedMessagesUpdate = (): void => {
		emitter.emit('quotedMessagesUpdate');
	};

	input.value = Meteor._localStorage.getItem(storageID) ?? '';
	input.addEventListener('input', persist);

	const release = (): void => {
		input.removeEventListener('input', persist);
	};

	const setText = (
		text: string,
		{
			selection,
		}: {
			selection?:
				| { readonly start?: number; readonly end?: number }
				| ((previous: { readonly start: number; readonly end: number }) => { readonly start?: number; readonly end?: number });
		} = {},
	): void => {
		focus();

		const { selectionStart, selectionEnd } = input;
		const textAreaTxt = input.value;

		if (typeof selection === 'function') {
			selection = selection({ start: selectionStart, end: selectionEnd });
		}

		if (selection) {
			if (!document.execCommand || !document.execCommand('insertText', false, text)) {
				input.value = textAreaTxt.substring(0, selectionStart) + text + textAreaTxt.substring(selectionStart);
				focus();
			}
			input.setSelectionRange(selection.start ?? 0, selection.end ?? text.length);
		}

		if (!selection) {
			input.value = text;
		}

		focus();

		persist();
		$(input).trigger('change').trigger('input');
		const event = new Event('input', { bubbles: true });
		// TODO: Remove this hack for react to trigger onChange
		const tracker = (input as any)._valueTracker;
		if (tracker) {
			tracker.setValue('');
		}
		input.dispatchEvent(event);
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

	const setEditingMode = (editing: boolean): void => {
		if (editing) {
			input.parentElement?.classList.add('editing');
		} else {
			input.parentElement?.classList.remove('editing');
		}
	};

	return {
		release,
		get text(): string {
			return input.value;
		},
		get selection(): { start: number; end: number } {
			return {
				start: input.selectionStart,
				end: input.selectionEnd,
			};
		},
		insertText,
		setText,
		clear,
		focus,
		replyWith,
		quoteMessage,
		dismissQuotedMessage,
		dismissAllQuotedMessages,
		quotedMessages,
		setEditingMode,
	};
};
