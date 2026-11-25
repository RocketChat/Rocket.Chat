import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useStickyUnreadRoom } from './useStickyUnreadRoom';

const room = (rid: string, unread: number) => ({ rid, unread, alert: unread > 0 }) as unknown as SubscriptionWithRoom;

const render = (openedRoom: string | undefined, rooms: SubscriptionWithRoom[]) =>
	renderHook(({ openedRoom, rooms }) => useStickyUnreadRoom(openedRoom, rooms), { initialProps: { openedRoom, rooms } });

it('returns nothing while no room is open', () => {
	const { result } = render(undefined, [room('a', 2)]);

	expect(result.current).toBeUndefined();
});

it('keeps a room that was unread when opened, after it gets read', () => {
	const { result, rerender } = render('a', [room('a', 2)]);
	expect(result.current).toBe('a');

	rerender({ openedRoom: 'a', rooms: [room('a', 0)] });

	expect(result.current).toBe('a');
});

it('releases the room once another room is opened', () => {
	const { result, rerender } = render('a', [room('a', 2), room('b', 0)]);
	rerender({ openedRoom: 'a', rooms: [room('a', 0), room('b', 0)] });

	rerender({ openedRoom: 'b', rooms: [room('a', 0), room('b', 0)] });

	expect(result.current).toBeUndefined();
});

it('releases the room once no room is open', () => {
	const { result, rerender } = render('a', [room('a', 2)]);

	rerender({ openedRoom: undefined, rooms: [room('a', 0)] });

	expect(result.current).toBeUndefined();
});

it('does not keep a room that was already read when opened', () => {
	const { result, rerender } = render('a', [room('a', 0)]);

	rerender({ openedRoom: 'a', rooms: [room('a', 3)] });

	expect(result.current).toBeUndefined();
});

it('does not keep a room whose unread status is hidden', () => {
	const hidden = { ...room('a', 2), hideUnreadStatus: true } as SubscriptionWithRoom;

	const { result } = render('a', [hidden]);

	expect(result.current).toBeUndefined();
});

it('decides once the opened room shows up in the room list', () => {
	const { result, rerender } = render('a', []);
	expect(result.current).toBeUndefined();

	rerender({ openedRoom: 'a', rooms: [room('a', 2)] });
	expect(result.current).toBe('a');

	rerender({ openedRoom: 'a', rooms: [room('a', 0)] });
	expect(result.current).toBe('a');
});

it('decides again when a room is opened a second time', () => {
	const { result, rerender } = render('a', [room('a', 2), room('b', 0)]);
	rerender({ openedRoom: 'b', rooms: [room('a', 0), room('b', 0)] });

	rerender({ openedRoom: 'a', rooms: [room('a', 0), room('b', 0)] });

	expect(result.current).toBeUndefined();
});
