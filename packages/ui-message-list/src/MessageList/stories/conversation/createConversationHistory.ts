import type { IMessage } from '@rocket.chat/core-typings';

import { createFakeHistory, fakeMessageId, VIEWER } from '../useFakeMessageSource';

export const IGNORED_AUTHOR = { _id: 'ignored', username: 'mallory', name: 'Mallory' };

const decorate = (message: IMessage, index: number, size: number): IMessage => {
	switch (index % 17) {
		case 2:
			return { ...message, t: 'uj', msg: message.u.username ?? '' };
		case 4:
			return { ...message, reactions: { ':thumbsup:': { usernames: ['alice', 'bob'] }, ':tada:': { usernames: [VIEWER.username] } } };
		case 6:
			return index > 6 ? { ...message, tmid: fakeMessageId(index - 6), msg: `A reply in the thread of message ${index - 6}` } : message;
		case 8:
			return {
				...message,
				editedAt: new Date(message.ts.getTime() + 60_000),
				editedBy: { _id: message.u._id, username: message.u.username ?? '' },
				pinned: true,
			} as IMessage;
		case 10:
			return {
				...message,
				msg: '',
				file: { _id: `file-${index}`, name: `notes-${index}.txt`, type: 'text/plain', size: 2048, format: 'TXT' },
				files: [{ _id: `file-${index}`, name: `notes-${index}.txt`, type: 'text/plain', size: 2048, format: 'TXT' }],
				attachments: [
					{
						type: 'file',
						title: `notes-${index}.txt`,
						title_link: `/file-upload/file-${index}/notes-${index}.txt`,
						size: 2048,
						format: 'TXT',
					},
				],
			};
		case 12:
			return { ...message, u: IGNORED_AUTHOR, msg: 'A message from an ignored author' };
		case 14:
			return index < size - 1 ? { ...message, tcount: 2, tlm: message.ts, replies: ['alice', 'bob'] } : message;
		default:
			return message;
	}
};

/** A room conversation with system messages, thread replies, reactions, files, edits and an ignored author. */
export const createConversationHistory = (size: number) =>
	createFakeHistory({ size, hasMixedHeights: true }).map((message, index) => decorate(message, index, size));
