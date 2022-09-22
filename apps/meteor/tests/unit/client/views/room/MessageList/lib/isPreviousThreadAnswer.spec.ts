/* eslint-env mocha */
import type { IThreadMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { isPreviousThreadAnswer } from '../../../../../../../client/views/room/MessageList/lib/isPreviousThreadAnswer';

const date = new Date('2021-10-27T00:00:00.000Z');
const baseMessage = {
	ts: date,
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message',
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};

describe('isPreviousThreadAnswer', () => {
	it('should return false if no previous message', () => {
		expect(isPreviousThreadAnswer(undefined)).to.be.false;
	});

	it('should return false if previous message is not thread preview', () => {
		expect(isPreviousThreadAnswer(baseMessage)).to.be.false;
	});

	it('should return true if previous message is thread preview', () => {
		const previous: IThreadMessage = {
			...baseMessage,
			tmid: 'threadId',
			tshow: true,
		};
		expect(isPreviousThreadAnswer(previous)).to.be.true;
	});
});
