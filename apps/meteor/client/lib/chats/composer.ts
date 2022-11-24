import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import $ from 'jquery';
import { Meteor } from 'meteor/meteor';

import { withDebouncing } from '../../../lib/utils/highOrderFunctions';
import type { ChatAPI } from './ChatAPI';

export const createComposer = (input: HTMLTextAreaElement, { rid, tmid }: Pick<IMessage, 'rid' | 'tmid'>): ChatAPI['composer'] => {
	const emitter = new Emitter<{ quotedMessagesUpdate: void }>();

	let _quotedMessages: IMessage[] = [];

	const storageID = `${rid}${tmid ? `-${tmid}` : ''}`;

	const persist = withDebouncing({ wait: 1000 })(() => {
		if (input.value) {
			Meteor._localStorage.setItem(storageID, input.value);
			return;
		}

		Meteor._localStorage.removeItem(storageID);
	});

	const notifyQuotedMessagesUpdate = (): void => {
		$(input).trigger('dataChange');
		emitter.emit('quotedMessagesUpdate');
	};

	input.value = Meteor._localStorage.getItem(storageID) ?? '';
	input.addEventListener('input', persist);

	const release = (): void => {
		input.removeEventListener('input', persist);
	};

	const setText = (text: string): void => {
		input.value = text;
		persist();
		$(input).trigger('change').trigger('input');
	};

	const clear = (): void => {
		setText('');
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

		$(input)?.trigger('focus').data('mention-user', false).trigger('dataChange');
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

	return {
		release,
		get text(): string {
			return input.value;
		},
		setText,
		clear,
		replyWith,
		quoteMessage,
		dismissQuotedMessage,
		dismissAllQuotedMessages,
		quotedMessages,
	};
};

export const purgeAllDrafts = (): void => {
	Object.keys(Meteor._localStorage)
		.filter((key) => key.indexOf('messagebox_') === 0)
		.forEach((key) => Meteor._localStorage.removeItem(key));
};
