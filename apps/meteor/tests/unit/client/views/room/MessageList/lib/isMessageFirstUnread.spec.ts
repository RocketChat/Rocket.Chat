/* eslint-env mocha */
import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { isMessageFirstUnread } from '../../../../../../../client/views/room/MessageList/lib/isMessageFirstUnread';

const date = new Date('2021-10-27T00:00:00.000Z');

const baseMessage: IMessage = {
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

describe('isMessageFirstUnread', () => {
	it('should return true if the message is unread', () => {
		const message: IMessage = {
			...baseMessage,
		};

		const subscription: ISubscription = {
			ls: new Date('2021-10-26T00:00:00.000Z'),
		} as ISubscription;

		expect(isMessageFirstUnread(subscription, message)).to.be.true;
	});

	it('should return false if the message is read', () => {
		const message: IMessage = {
			...baseMessage,
		};

		const subscription: ISubscription = {
			ls: new Date('2021-10-26T00:00:00.000Z'),
			unread: 0,
		} as ISubscription;

		expect(isMessageFirstUnread(subscription, message)).to.be.false;
	});

	it('should return false if there is no subscription', () => {
		const message: IMessage = {
			...baseMessage,
		};

		expect(isMessageFirstUnread(undefined, message)).to.be.false;
	});
});
