import type { IMessage } from '@rocket.chat/core-typings';
import type { Root } from '@rocket.chat/message-parser';

import { isParsedMessage } from './isParsedMessage';

const date = new Date('2021-10-27T00:00:00.000Z');

const baseMessage: IMessage = {
	ts: date,
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message',
	md: [
		{
			type: 'PARAGRAPH',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: 'message',
				},
			],
		},
	],
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};

it('should return true if the message parsed', () => {
	const message: IMessage = {
		...baseMessage,
	};

	expect(isParsedMessage(message.md as Root)).toBe(true);
});

it('should return false if the message is not parsed', () => {
	const message: IMessage = {
		...baseMessage,
	};

	expect(isParsedMessage(message.msg as string)).toBe(false);
});
