import type { IMessage } from '@rocket.chat/core-typings';

import { isMessageSequential } from './isMessageSequential';
import { MessageTypes } from '../../../../../app/ui-utils/lib/MessageTypes';

const TIME_RANGE_IN_SECONDS = 300;

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

it('should return false if no previous message', () => {
	const current: IMessage = {
		...baseMessage,
	};
	expect(isMessageSequential(current, undefined, TIME_RANGE_IN_SECONDS)).toBe(false);
});

it("should return false if both messages doesn't belong to the same user", () => {
	const previous: IMessage = {
		...baseMessage,
	};
	const current: IMessage = {
		...baseMessage,
		u: {
			_id: 'userId2',
			name: 'userName2',
			username: 'userName2',
		},
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});

it('should return false if both messages belongs to the same user but have more than five minutes of difference', () => {
	const previous: IMessage = {
		...baseMessage,
	};

	const current: IMessage = {
		...previous,
		ts: new Date('2021-10-27T00:05:00.001Z'),
	};

	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});
it('should return true if both messages belongs to the same user and have less than five minutes of difference', () => {
	const previous: IMessage = {
		...baseMessage,
	};
	const current: IMessage = {
		...previous,
		ts: new Date('2021-10-27T00:04:59.999Z'),
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(true);
});
it('should return false if message are not groupable', () => {
	const previous: IMessage = {
		...baseMessage,
		groupable: false,
	};
	const current: IMessage = {
		...previous,
		groupable: false,
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});
it('should return false if both messages are not from the same thread', () => {
	const previous: IMessage = {
		...baseMessage,
		tmid: 'threadId',
	};
	const current: IMessage = {
		...previous,
		tmid: 'threadId2',
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});

it('should return true if both messages are from the same thread same user and bellow the time range', () => {
	const previous: IMessage = {
		...baseMessage,
		tmid: 'threadId',
	};
	const current: IMessage = {
		...previous,
		tmid: 'threadId',
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(true);
});

it('should return false if previous message is thread message but the current is a regular one', () => {
	const previous: IMessage = {
		tmid: 'threadId',
		...baseMessage,
	};
	const current: IMessage = {
		...baseMessage,
	};

	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});

it('should return true if message is a reply from a previous message', () => {
	const previous: IMessage = {
		...baseMessage,
		_id: 'threadId',
	};
	const current: IMessage = {
		...previous,
		tmid: 'threadId',
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(true);
});
it("should return false if both messages don't have the same alias", () => {
	const previous: IMessage = {
		...baseMessage,
		alias: 'alias',
	};
	const current: IMessage = {
		...previous,
		alias: 'alias2',
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});

it('should return false if message is from system', () => {
	MessageTypes.registerType({
		id: 'au',
		system: true,
		message: 'User_added_by',
	});
	const previous: IMessage = {
		...baseMessage,
	};
	const current: IMessage = {
		...previous,
		ts: new Date('2021-10-27T00:04:59.999Z'),
		t: 'au',
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});

it('should return false even if messages should be sequential, but they are from a different day', () => {
	const previous: IMessage = {
		...baseMessage,
		ts: new Date(2022, 0, 1, 23, 59, 59, 999),
	};
	const current: IMessage = {
		...baseMessage,
		ts: new Date(2022, 0, 2, 0, 0, 0, 0),
	};
	expect(isMessageSequential(current, previous, TIME_RANGE_IN_SECONDS)).toBe(false);
});
