import type { Root } from '@rocket.chat/message-parser';
/* eslint-env mocha */
import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { isParsedMessage } from '../../../../../../../client/views/room/MessageList/lib/isParsedMessage';

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

describe('isParsedMessage', () => {
	it('should return true if the message parsed', () => {
		const message: IMessage = {
			...baseMessage,
		};

		expect(isParsedMessage(message.md as Root)).to.be.true;
	});

	it('should return false if the message is not parsed', () => {
		const message: IMessage = {
			...baseMessage,
		};

		expect(isParsedMessage(message.msg as string)).to.be.false;
	});
});
