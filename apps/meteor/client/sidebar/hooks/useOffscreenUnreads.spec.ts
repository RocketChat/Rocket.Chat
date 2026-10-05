import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { findOffscreenUnreads, getUnreadRows } from './useOffscreenUnreads';

const room = (props: Partial<SubscriptionWithRoom> = {}) => ({ alert: false, userMentions: 0, ...props }) as SubscriptionWithRoom;

const group = (key: string, rooms: SubscriptionWithRoom[]) => ({ key, rooms });

describe('getUnreadRows', () => {
	it('indexes unread rooms counting each group header as a row', () => {
		const groups = [
			group('Favorites', [room({ alert: true }), room()]),
			group('Channels', [room(), room({ unread: 3 }), room({ tunread: ['tmid'] })]),
		];

		expect(getUnreadRows(groups).unreads).toEqual([1, 5, 6]);
	});

	it('ignores rooms with the unread status hidden', () => {
		const groups = [group('Channels', [room({ alert: true, hideUnreadStatus: true }), room({ unread: 1 })])];

		expect(getUnreadRows(groups).unreads).toEqual([2]);
	});

	it('counts the header row of an empty group', () => {
		const groups = [group('Favorites', []), group('Channels', [room({ alert: true })])];

		expect(getUnreadRows(groups).unreads).toEqual([2]);
	});

	it('returns no indices when nothing is unread', () => {
		const groups = [group('Channels', [room(), room()])];

		expect(getUnreadRows(groups)).toEqual({ unreads: [], mentions: [] });
	});

	it('indexes direct and thread mentions of the user', () => {
		const groups = [
			group('Channels', [
				room({ unread: 2, userMentions: 1 }),
				room({ unread: 1, tunreadUser: ['tmid'] }),
				room({ unread: 1, groupMentions: 1 }),
			]),
		];

		expect(getUnreadRows(groups).mentions).toEqual([1, 2]);
	});

	it('ignores mentions in rooms with the mention status hidden', () => {
		const groups = [group('Channels', [room({ unread: 1, userMentions: 1, hideMentionStatus: true })])];

		expect(getUnreadRows(groups).mentions).toEqual([]);
	});
});

describe('findOffscreenUnreads', () => {
	const range = { startIndex: 4, endIndex: 6 };

	it('finds the nearest unread in each direction', () => {
		expect(findOffscreenUnreads({ unreads: [0, 2, 8, 12], mentions: [] }, range)).toEqual({
			previous: { index: 2, mention: false },
			next: { index: 8, mention: false },
		});
	});

	it('prefers a mention over a nearer unread', () => {
		expect(findOffscreenUnreads({ unreads: [0, 2, 8, 12], mentions: [0, 12] }, range)).toEqual({
			previous: { index: 0, mention: true },
			next: { index: 12, mention: true },
		});
	});

	it('picks the mention per direction', () => {
		expect(findOffscreenUnreads({ unreads: [2, 8], mentions: [8] }, range)).toEqual({
			previous: { index: 2, mention: false },
			next: { index: 8, mention: true },
		});
	});

	it('ignores unreads and mentions inside the visible range', () => {
		expect(findOffscreenUnreads({ unreads: [5], mentions: [5] }, range)).toEqual({ previous: undefined, next: undefined });
	});

	it('treats the range bounds as visible', () => {
		expect(findOffscreenUnreads({ unreads: [4, 6], mentions: [] }, range)).toEqual({ previous: undefined, next: undefined });
	});

	it('reports only the direction that has an offscreen unread', () => {
		expect(findOffscreenUnreads({ unreads: [0, 1], mentions: [] }, range)).toEqual({
			previous: { index: 1, mention: false },
			next: undefined,
		});
		expect(findOffscreenUnreads({ unreads: [9, 10], mentions: [] }, range)).toEqual({
			previous: undefined,
			next: { index: 9, mention: false },
		});
	});
});
