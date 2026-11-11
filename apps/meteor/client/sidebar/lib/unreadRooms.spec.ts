import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { buildUnreadInfo, emptyUnreadInfo, isUnreadRoom } from './unreadRooms';

const room = (overrides: Partial<SubscriptionWithRoom> = {}) => ({ rid: 'rid', ...overrides }) as SubscriptionWithRoom;

describe('isUnreadRoom', () => {
	it.each([
		['an alert', { alert: true }],
		['unread messages', { unread: 2 }],
		['unread threads', { tunread: ['tmid'] }],
	])('asks for attention on %s', (_reason, overrides) => {
		expect(isUnreadRoom(room(overrides))).toBe(true);
	});

	it('asks for nothing when there is nothing', () => {
		expect(isUnreadRoom(room())).toBe(false);
	});

	it('stays quiet when the reader switched the room off, whatever it has', () => {
		expect(isUnreadRoom(room({ hideUnreadStatus: true, alert: true, unread: 5, tunread: ['tmid'] }))).toBe(false);
	});
});

describe('buildUnreadInfo', () => {
	it('counts nothing for no rooms', () => {
		expect(buildUnreadInfo([])).toEqual(emptyUnreadInfo());
	});

	it('adds up what the rooms are owed', () => {
		const info = buildUnreadInfo([
			room({ unread: 2, userMentions: 1, groupMentions: 1, tunread: ['a'], tunreadUser: ['u1'] }),
			room({ unread: 3, userMentions: 2, tunread: ['b', 'c'] }),
		]);

		expect(info).toEqual({ unread: 5, userMentions: 3, groupMentions: 1, tunread: ['a', 'b', 'c'], tunreadUser: ['u1'] });
	});

	it('counts a room that only wants attention as one', () => {
		expect(buildUnreadInfo([room({ alert: true })]).unread).toBe(1);
	});

	it('does not add that one when the room already counts something', () => {
		expect(buildUnreadInfo([room({ alert: true, unread: 4 })]).unread).toBe(4);
		expect(buildUnreadInfo([room({ alert: true, tunread: ['a'] })]).unread).toBe(0);
	});

	it('leaves out a room the reader switched off entirely', () => {
		expect(buildUnreadInfo([room({ hideUnreadStatus: true, unread: 9, userMentions: 9, alert: true })])).toEqual(emptyUnreadInfo());
	});
});
