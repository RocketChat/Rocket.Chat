import { act, render, screen } from '@testing-library/react';
import type { UIEvent } from 'react';

import { useRoomHoverCard } from './RoomHoverCardContext';
import RoomHoverCardProvider from './RoomHoverCardProvider';

jest.mock('./RoomHoverCardWithData', () => ({
	__esModule: true,
	default: ({ rid }: { rid: string }) => <div data-testid='room-hover-card'>{rid}</div>,
}));

const RoomTrigger = ({ rid }: { rid: string }) => {
	const { openRoomHoverCard } = useRoomHoverCard();
	return (
		<a href={`#${rid}`} onMouseEnter={(e: UIEvent) => openRoomHoverCard(e, rid)}>
			{rid}
		</a>
	);
};

const fire = (element: Element, type: string, relatedTarget: Element, bubbles: boolean) =>
	element.dispatchEvent(new MouseEvent(type, { bubbles, cancelable: true, relatedTarget }));

// The order a browser reports a single pointer move in, which is what puts React's enter on the next room ahead of the
// native leave of the previous one.
const movePointer = (from: Element, to: Element) =>
	act(() => {
		fire(from, 'mouseout', to, true);
		fire(from, 'mouseleave', to, false);
		fire(to, 'mouseover', from, true);
		fire(to, 'mouseenter', from, false);
	});

const advance = (ms: number) =>
	act(async () => {
		await jest.advanceTimersByTimeAsync(ms);
	});

const shownRoom = () => screen.queryByTestId('room-hover-card')?.textContent ?? null;

const renderList = () => {
	render(
		<RoomHoverCardProvider>
			<div data-testid='outside' />
			<RoomTrigger rid='a' />
			<RoomTrigger rid='b' />
			<RoomTrigger rid='c' />
		</RoomHoverCardProvider>,
	);

	return {
		outside: screen.getByTestId('outside'),
		a: screen.getByText('a'),
		b: screen.getByText('b'),
		c: screen.getByText('c'),
	};
};

beforeAll(() => {
	window.matchMedia = jest.fn().mockReturnValue({ matches: true });
});

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(async () => {
	// Lets the shared hover warm-up cool down, so one test's open card doesn't make the next one open instantly.
	await advance(2000);
	jest.useRealTimers();
});

it('waits for the pointer to rest on a room before opening its card', async () => {
	const { outside, a, b, c } = renderList();

	movePointer(outside, a);
	await advance(200);
	movePointer(a, b);
	await advance(200);
	movePointer(b, c);
	await advance(200);

	expect(shownRoom()).toBeNull();

	await advance(400);

	expect(shownRoom()).toBe('c');

	movePointer(c, outside);
});

it('hands the card over to the next room instead of closing it', async () => {
	const { outside, a, b } = renderList();

	movePointer(outside, a);
	await advance(600);
	expect(shownRoom()).toBe('a');

	movePointer(a, b);
	await advance(1000);

	expect(shownRoom()).toBe('b');

	movePointer(b, outside);
});

it('keeps the card while the pointer crosses over to it, and hands it over when the pointer comes back on another room', async () => {
	const { outside, a, b } = renderList();

	movePointer(outside, a);
	await advance(600);

	// The pointer is tracked on the box the provider wraps the card in, not on the card itself.
	// eslint-disable-next-line testing-library/no-node-access
	const card = screen.getByTestId('room-hover-card').parentElement as Element;

	movePointer(a, card);
	await advance(1000);
	expect(shownRoom()).toBe('a');

	movePointer(card, b);
	await advance(1000);
	expect(shownRoom()).toBe('b');

	movePointer(b, outside);
});

it('closes once the pointer leaves the list', async () => {
	const { outside, a } = renderList();

	movePointer(outside, a);
	await advance(600);
	expect(shownRoom()).toBe('a');

	movePointer(a, outside);
	await advance(1000);

	expect(shownRoom()).toBeNull();
});
