import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { hasRoomChanged } from './sidebarRowChanges';

const at = (iso: string) => new Date(iso);

const room = (overrides: Partial<SubscriptionWithRoom> = {}) =>
	({ _id: 'rid', t: 'c', _updatedAt: at('2025-01-01T00:00:00.000Z'), ...overrides }) as SubscriptionWithRoom;

describe('hasRoomChanged', () => {
	it('says nothing changed for the very same object', () => {
		const same = room();

		expect(hasRoomChanged(same, same)).toBe(false);
	});

	it('says nothing changed for an equal copy, so a new array of the same rooms redraws nothing', () => {
		expect(hasRoomChanged(room(), room())).toBe(false);
	});

	it('notices a different room', () => {
		expect(hasRoomChanged(room(), room({ _id: 'other' }))).toBe(true);
	});

	it('notices the room being touched at all', () => {
		expect(hasRoomChanged(room(), room({ _updatedAt: at('2025-01-02T00:00:00.000Z') }))).toBe(true);
	});

	it.each([
		['an alert appearing', { alert: true }],
		['a draft being typed', { draft: 'hello' }],
		['a thread draft being typed', { threadDrafts: { tmid: 'hi' } }],
		['the room becoming a team', { teamMain: true }],
	])('notices %s', (_what, overrides) => {
		expect(hasRoomChanged(room(), room(overrides as Partial<SubscriptionWithRoom>))).toBe(true);
	});

	it('notices a new last message, by text or by time', () => {
		const before = room({ lastMessage: { msg: 'hi', _updatedAt: at('2025-01-01T00:00:00.000Z') } } as Partial<SubscriptionWithRoom>);

		expect(hasRoomChanged(before, room({ lastMessage: { msg: 'bye', _updatedAt: at('2025-01-01T00:00:00.000Z') } } as any))).toBe(true);
		expect(hasRoomChanged(before, room({ lastMessage: { msg: 'hi', _updatedAt: at('2025-01-03T00:00:00.000Z') } } as any))).toBe(true);
	});

	describe('what it does not compare directly', () => {
		// These are the counters a row draws; the server moves _updatedAt with them, which is the
		// assumption the whole comparison rests on. Pinned here so that assumption is visible.
		it.each([
			['unread count', { unread: 3 }],
			['user mentions', { userMentions: 1 }],
			['unread threads', { tunread: ['tmid'] }],
		])('misses %s on its own, and relies on _updatedAt moving with it', (_what, overrides) => {
			expect(hasRoomChanged(room(), room(overrides as Partial<SubscriptionWithRoom>))).toBe(false);
			expect(hasRoomChanged(room(), room({ ...overrides, _updatedAt: at('2025-01-02T00:00:00.000Z') } as any))).toBe(true);
		});
	});
});
