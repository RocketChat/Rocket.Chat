/* eslint-env mocha */
import { expect } from 'chai';

import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';
import { isOwnUserMessage } from './isOwnUserMessage';

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

describe('isUserMessage', () => {
	it('should return true if the message is from user', () => {
		const message: IMessage = {
			...baseMessage,
		};

		const subscription: ISubscription = {
			u: {
				_id: 'userId',
			},
		} as ISubscription;

		expect(isOwnUserMessage(message, subscription)).to.be.true;
	});

	it('should return false if the message is not from user', () => {
		const message: IMessage = {
			...baseMessage,
		};

		const subscription: ISubscription = {
			u: {
				_id: 'otherUser',
			},
		} as ISubscription;

		expect(isOwnUserMessage(message, subscription)).to.be.false;
	});

	it('should return false if there is no subscription', () => {
		const message: IMessage = {
			...baseMessage,
		};

		expect(isOwnUserMessage(message, undefined)).to.be.false;
	});
});
