import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { getGroupRooms } from './groupRooms';

const room = (rid: string, overrides: Partial<SubscriptionWithRoom> = {}) => ({ rid, ...overrides }) as SubscriptionWithRoom;

const read = (rid: string) => room(rid);
const unread = (rid: string) => room(rid, { unread: 1 });

const rids = (rooms: SubscriptionWithRoom[]) => rooms.map(({ rid }) => rid);

const split = (input: Partial<Parameters<typeof getGroupRooms>[0]> = {}) =>
	getGroupRooms({ rooms: [], collapsed: false, showUnreads: false, keepUnreadsOnTop: false, ...input });

const visible = (input: Partial<Parameters<typeof getGroupRooms>[0]> = {}) => split(input).visible;

describe('getGroupRooms', () => {
	it('shows every room of an open group, in the order it was given', () => {
		const rooms = [read('a'), unread('b'), read('c')];

		expect(rids(visible({ rooms }))).toEqual(['a', 'b', 'c']);
	});

	describe('collapsed', () => {
		it('hides everything', () => {
			expect(visible({ rooms: [read('a'), unread('b')], collapsed: true })).toEqual([]);
		});

		it('still shows where the reader is', () => {
			const rooms = [read('a'), read('b')];

			expect(rids(visible({ rooms, collapsed: true, openedRoom: 'b' }))).toEqual(['b']);
		});

		it('shows the unread ones too when the group is set to', () => {
			const rooms = [read('a'), unread('b'), unread('c')];

			expect(rids(visible({ rooms, collapsed: true, showUnreads: true }))).toEqual(['b', 'c']);
		});

		it('does not show unread ones when the group is not set to', () => {
			const rooms = [read('a'), unread('b')];

			expect(visible({ rooms, collapsed: true, showUnreads: false })).toEqual([]);
		});
	});

	describe('what the group only speaks for', () => {
		it('hides nothing while it is open', () => {
			expect(split({ rooms: [read('a'), unread('b')] }).hidden).toEqual([]);
		});

		it('is everything a collapsed group does not draw', () => {
			const rooms = [read('a'), unread('b'), read('c')];

			expect(rids(split({ rooms, collapsed: true, showUnreads: true }).hidden)).toEqual(['a', 'c']);
		});

		it('never counts a room it is still drawing', () => {
			const rooms = [unread('a'), unread('b')];
			const { visible: drawn, hidden } = split({ rooms, collapsed: true, showUnreads: true, openedRoom: 'a' });

			expect(rids(drawn)).toEqual(['a', 'b']);
			expect(hidden).toEqual([]);
		});
	});

	describe('keeping unreads on top', () => {
		it('brings the unread ones first', () => {
			const rooms = [read('a'), unread('b'), read('c'), unread('d')];

			expect(rids(visible({ rooms, keepUnreadsOnTop: true }))).toEqual(['b', 'd', 'a', 'c']);
		});

		it('leaves the order alone within each side', () => {
			const rooms = [unread('b'), unread('a'), read('d'), read('c')];

			expect(rids(visible({ rooms, keepUnreadsOnTop: true }))).toEqual(['b', 'a', 'd', 'c']);
		});

		it('applies after collapsing, not before', () => {
			const rooms = [read('a'), unread('b'), unread('c')];

			expect(rids(visible({ rooms, collapsed: true, showUnreads: true, keepUnreadsOnTop: true, openedRoom: 'a' }))).toEqual([
				'b',
				'c',
				'a',
			]);
		});
	});
});
