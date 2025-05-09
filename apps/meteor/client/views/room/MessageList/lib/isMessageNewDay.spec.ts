import type { IMessage } from '@rocket.chat/core-typings';

import { isMessageNewDay } from './isMessageNewDay';

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

it('should return true if the message is from a different day', () => {
	const message = {
		...baseMessage,
	};
	const message2 = {
		...baseMessage,
		ts: new Date('2021-10-28T00:00:00.000Z'),
	};
	expect(isMessageNewDay(message, message2)).toBe(true);
});

it('should return false if the message is from the same day', () => {
	const message = {
		...baseMessage,
	};
	const message2 = {
		...baseMessage,
	};
	expect(isMessageNewDay(message, message2)).toBe(false);
});

it('should return true if there is no previous message', () => {
	const message = {
		...baseMessage,
	};
	expect(isMessageNewDay(message, undefined)).toBe(true);
});

it('should return true for different days even if the range is on second', () => {
	const previous: IMessage = {
		...baseMessage,
		ts: new Date(2022, 0, 1, 23, 59, 59, 999),
	};
	const current: IMessage = {
		...baseMessage,
		ts: new Date(2022, 0, 2, 0, 0, 0, 0),
	};
	expect(isMessageNewDay(current, previous)).toBe(true);
});
