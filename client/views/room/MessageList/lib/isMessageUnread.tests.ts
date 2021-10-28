/* eslint-env mocha */
import { expect } from 'chai';

import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';
import { isMessageUnread } from './isMessageUnread';

const date = new Date('2021-10-27T00:00:00.000Z');

const baseMessage = {
	ts: date,
	u: {
		_id: 'userId',
		name: 'userName',
	},
	msg: 'message',
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};

describe('isMessageUnread', () => {
	it('should return true if the message is unread', () => {
		const message: IMessage = {
			...baseMessage,
		};

		const subscription: ISubscription = {
			ls: new Date('2021-10-26T00:00:00.000Z'),
		} as ISubscription;

		expect(isMessageUnread(subscription, message)).to.be.true;
	});

	it('should return false if there is no subscription', () => {
		const message: IMessage = {
			...baseMessage,
		};

		expect(isMessageUnread(undefined, message)).to.be.false;
	});
});
