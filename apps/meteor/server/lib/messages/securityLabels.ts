import type { IMessage, IRoom, ISecurityReaderAccess, IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

/**
 * A copy of a labeled message that carries its label but none of its content, for channels that leave the
 * deployment (push, email) even when the receiver is cleared.
 */
export const toContentFreeMessage = <T extends Partial<IMessage>>(message: T): T =>
	({
		...message,
		msg: '',
		md: undefined,
		attachments: undefined,
		file: undefined,
		files: undefined,
		urls: undefined,
		blocks: undefined,
		translations: undefined,
		content: undefined,
	}) as T;

/**
 * Settles the confidentiality label a message is stored with, rejecting the message when it may not be sent.
 * Without data-centric security, messages carry no label, and the fields derived from one are never accepted from clients.
 */
export const applyMessageSecurityLabel = makeFunction(
	async (message: IMessage, _room: IRoom, _user: Pick<IUser, '_id'>): Promise<IMessage> => {
		const { securityLabel: _label, securityMarking: _marking, securityAccess: _access, ...rest } = message;
		return rest;
	},
);

/**
 * What a reader holds, for message queries to match only what they may read.
 * Without data-centric security nobody is cleared, so queries match no labeled message.
 */
export const getReaderAccess = makeFunction(async (_uid?: IUser['_id']): Promise<ISecurityReaderAccess> => []);

/**
 * Prepares messages for one reader: labeled messages the reader isn't cleared for are left out entirely, as if they
 * had never been sent. Without data-centric security nobody is cleared, so labeled messages stay out rather than leak.
 */
export const prepareMessagesForReader = makeFunction(
	async <T extends Partial<IMessage>>(messages: T[], _uid?: IUser['_id']): Promise<T[]> =>
		messages.filter((message) => !message.securityLabel),
);

/**
 * Picks, among the given users, those who may not read a message, so nothing about it reaches them.
 */
export const listUsersNotClearedFor = makeFunction(
	async (message: Pick<IMessage, 'securityLabel'>, userIds: IUser['_id'][]): Promise<IUser['_id'][]> =>
		message.securityLabel ? userIds : [],
);
