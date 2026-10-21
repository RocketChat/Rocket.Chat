import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

/**
 * The copy of a labeled message sent to someone who may not read it: no content, and no label either.
 */
export const toWithheldMessage = <T extends Partial<IMessage>>(message: T): T => {
	const { securityLabel: _label, securityMarking: _marking, ...rest } = message;
	return {
		...rest,
		msg: '',
		md: undefined,
		attachments: undefined,
		file: undefined,
		files: undefined,
		urls: undefined,
		blocks: undefined,
		translations: undefined,
		content: undefined,
		mentions: undefined,
		securityWithheld: true,
	} as unknown as T;
};

/**
 * Settles the confidentiality label a message is stored with, rejecting the message when it may not be sent.
 * Without data-centric security, messages carry no label, and the reader-side fields are never accepted from clients.
 */
export const applyMessageSecurityLabel = makeFunction(
	async (message: IMessage, _room: IRoom, _user: Pick<IUser, '_id'>): Promise<IMessage> => {
		const { securityLabel: _label, securityMarking: _marking, securityWithheld: _withheld, ...rest } = message;
		return rest;
	},
);

/**
 * Prepares messages for one reader: labeled messages the reader isn't cleared for are withheld.
 * Without data-centric security nobody is cleared, so labeled messages stay withheld rather than leak.
 */
export const redactMessagesForUser = makeFunction(async <T extends Partial<IMessage>>(messages: T[], _uid?: IUser['_id']): Promise<T[]> =>
	messages.map((message) => (message.securityLabel ? toWithheldMessage(message) : message)),
);
