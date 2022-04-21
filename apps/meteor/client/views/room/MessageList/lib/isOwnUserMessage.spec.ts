/* eslint-env mocha */
import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { MessageTypes } from '../../../../../app/ui-utils/lib/MessageTypes';
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

// Register a system message
MessageTypes.registerType({
	id: 'au',
	system: true,
	message: 'User_added_by',
});

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
