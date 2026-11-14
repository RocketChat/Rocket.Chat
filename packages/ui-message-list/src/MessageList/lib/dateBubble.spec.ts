import { placeDateBubble } from './dateBubble';

const monday = new Date(2024, 0, 15, 10);
const tuesday = new Date(2024, 0, 16, 10);
const topMessageDate = new Date(2024, 0, 14, 23);

const divider = (top: number, day: Date) => ({ top, height: 32, day });

/** The list 100px below the top of the window, as a room's list sits under its header. */
const frame = { windowTop: -100 };

describe('placeDateBubble', () => {
	it('should show the day of the message at the top when no divider is near the top (R51)', () => {
		expect(placeDateBubble([divider(300, monday)], topMessageDate, frame)).toEqual({
			date: topMessageDate,
			offset: 0,
			covered: undefined,
			isHeld: false,
		});
	});

	it('should stand in for the divider under it, which it hides, and stay while that divider is above the top of the list (R51, R52)', () => {
		expect(placeDateBubble([divider(-10, monday), divider(400, tuesday)], topMessageDate, frame)).toEqual({
			date: monday,
			offset: 0,
			covered: 0,
			isHeld: true,
		});
		expect(placeDateBubble([divider(0, monday)], topMessageDate, frame)).toEqual({ date: monday, offset: 0, covered: 0, isHeld: false });
	});

	it('should stay for a divider scrolled out of view while it is below the top of the window, and hide after a while once above it (R51, R52)', () => {
		expect(placeDateBubble([divider(-60, monday)], topMessageDate, frame)).toEqual({ date: monday, offset: 0, covered: 0, isHeld: true });
		expect(placeDateBubble([divider(-60, monday)], topMessageDate, { windowTop: -50 })).toEqual({
			date: monday,
			offset: 0,
			covered: 0,
			isHeld: false,
		});
	});

	it('should forget a divider far above the top (R51)', () => {
		expect(placeDateBubble([divider(-140, monday)], topMessageDate, frame)).toEqual({
			date: topMessageDate,
			offset: 0,
			covered: undefined,
			isHeld: false,
		});
	});

	it('should be pushed up by the next day as its divider comes under it, and stop standing in for the day above (R51, R52)', () => {
		expect(placeDateBubble([divider(-40, monday), divider(20, tuesday)], topMessageDate, frame)).toEqual({
			date: monday,
			offset: -12,
			covered: undefined,
			isHeld: true,
		});
		expect(placeDateBubble([divider(-40, monday), divider(20, tuesday)], topMessageDate, { windowTop: -30 })).toMatchObject({
			offset: -12,
			isHeld: false,
		});
	});

	it('should show the day of the message at the top while it is pushed with no divider above (R51)', () => {
		expect(placeDateBubble([divider(31, tuesday)], topMessageDate, frame)).toEqual({
			date: topMessageDate,
			offset: -1,
			covered: undefined,
			isHeld: false,
		});
		expect(placeDateBubble([divider(31, tuesday)], undefined, frame).date).toBe(tuesday);
	});

	it('should show nothing without a divider near the top or a message (R51)', () => {
		expect(placeDateBubble([], undefined, frame).date).toBeUndefined();
	});

	it('should measure from below the inset the consumer draws over the list, as from the top of the viewport without one (R85)', () => {
		const banner = { ...frame, inset: 40 };

		expect(placeDateBubble([divider(-20, monday), divider(30, tuesday)], topMessageDate, banner)).toEqual({
			date: tuesday,
			offset: 0,
			covered: 1,
			isHeld: true,
		});
		expect(placeDateBubble([divider(-20, monday), divider(50, tuesday)], topMessageDate, banner)).toEqual({
			date: monday,
			offset: -22,
			covered: undefined,
			isHeld: true,
		});
		expect(placeDateBubble([divider(-20, monday), divider(80, tuesday)], topMessageDate, banner)).toEqual({
			date: monday,
			offset: 0,
			covered: 0,
			isHeld: true,
		});
		// The 100px are counted from the top of the viewport, not from below the inset
		expect(placeDateBubble([divider(-80, monday)], topMessageDate, banner)).toEqual({ date: monday, offset: 0, covered: 0, isHeld: true });
		expect(placeDateBubble([divider(-110, monday)], topMessageDate, banner).covered).toBeUndefined();
	});
});
