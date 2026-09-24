import type { IMessage } from '@rocket.chat/core-typings';

import { hasUserReacted, isMessageFollowedBy, isMessageStarredBy } from './messageViewerFacts';

const message = {
	_id: 'mid',
	rid: 'rid',
	msg: '',
	ts: new Date(),
	u: { _id: 'author', username: 'author' },
	_updatedAt: new Date(),
} as IMessage;

describe('isMessageStarredBy', () => {
	it('is true only for a viewer who starred it', () => {
		const starred = { ...message, starred: [{ _id: 'uid' }] } as IMessage;
		expect(isMessageStarredBy(starred, 'uid')).toBe(true);
		expect(isMessageStarredBy(starred, 'other')).toBe(false);
		expect(isMessageStarredBy(starred, undefined)).toBe(false);
		expect(isMessageStarredBy(message, 'uid')).toBe(false);
	});
});

describe('isMessageFollowedBy', () => {
	it('is true for a reply the viewer follows', () => {
		expect(isMessageFollowedBy({ ...message, replies: ['uid'] } as IMessage, 'uid')).toBe(true);
		expect(isMessageFollowedBy({ ...message, replies: ['other'] } as IMessage, 'uid')).toBe(false);
		expect(isMessageFollowedBy({ ...message, replies: ['uid'] } as IMessage, undefined)).toBe(false);
	});

	it('is false for the main message of a thread', () => {
		expect(isMessageFollowedBy({ ...message, replies: ['uid'], tcount: 2, tlm: new Date() } as IMessage, 'uid')).toBe(false);
	});
});

describe('hasUserReacted', () => {
	const reacted = { ...message, reactions: { ':smile:': { usernames: ['me'] } } } as IMessage;

	it('is true only for a viewer among the reaction usernames', () => {
		expect(hasUserReacted(reacted, 'me', ':smile:')).toBe(true);
		expect(hasUserReacted(reacted, 'you', ':smile:')).toBe(false);
		expect(hasUserReacted(reacted, 'me', ':wave:')).toBe(false);
		expect(hasUserReacted(reacted, undefined, ':smile:')).toBe(false);
	});
});
