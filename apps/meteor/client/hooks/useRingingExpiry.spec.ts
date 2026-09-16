import { VIDEO_CONF_RINGING_WINDOW_MS } from '@rocket.chat/core-typings';
import { act, renderHook } from '@testing-library/react';

import { useRingingExpiry } from './useRingingExpiry';

/**
 * What the hook does is re-render, and nothing else — so what is counted is renders.
 *
 * The rings are handed in as a fresh array each time, because that is how every caller builds them: inline, from
 * a list that is rebuilt whenever anything else about it changes.
 */
const renderExpiry = (ringingAt: (Date | undefined)[]) => {
	let renders = 0;

	const view = renderHook(
		({ ringingAt }: { ringingAt: (Date | undefined)[] }) => {
			renders += 1;
			useRingingExpiry([...ringingAt]);
		},
		{ initialProps: { ringingAt } },
	);

	return { ...view, renderCount: () => renders };
};

const agoBy = (ms: number) => new Date(Date.now() - ms);

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

it('says nothing while the ring is still a ring', () => {
	const { renderCount } = renderExpiry([agoBy(0)]);
	const before = renderCount();

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 1_000));

	expect(renderCount()).toBe(before);
});

it('wakes when the ring lapses', () => {
	const { renderCount } = renderExpiry([agoBy(0)]);
	const before = renderCount();

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS + 200));

	expect(renderCount()).toBeGreaterThan(before);
});

it('has nothing to wake for when nobody is ringing', () => {
	const { renderCount } = renderExpiry([undefined, undefined]);
	const before = renderCount();

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS * 3));

	expect(renderCount()).toBe(before);
});

// The one that mattered: a member who declined keeps their `ringingAt`, and callers hand the whole list over. An
// earlier, already-finished ring taken as the next thing to wake for parked the timer on a moment that had
// passed — the rings never changed, so the effect never ran again and the live ring lapsed unannounced.
it('still wakes for a later ring when an earlier one has already lapsed', () => {
	const { renderCount } = renderExpiry([agoBy(VIDEO_CONF_RINGING_WINDOW_MS + 5_000), agoBy(2_000)]);
	const before = renderCount();

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 2_000 + 200));

	expect(renderCount()).toBeGreaterThan(before);
});

// Two rings, one after the other: waking for the first has to schedule the second, since the list it is reading
// has not changed and nothing else is going to ask.
it('wakes for each ring in turn', () => {
	const { renderCount } = renderExpiry([agoBy(10_000), agoBy(2_000)]);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 10_000 + 200));
	const afterFirst = renderCount();

	act(() => jest.advanceTimersByTime(8_000 + 200));

	expect(renderCount()).toBeGreaterThan(afterFirst);
});

// A caller rebuilding its list on every render must not restart the wait, or the wake-up never arrives.
it('does not restart the wait when the same rings arrive in a new array', () => {
	const { rerender, renderCount } = renderExpiry([agoBy(0)]);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 1_000));
	rerender({ ringingAt: [agoBy(VIDEO_CONF_RINGING_WINDOW_MS - 1_000)] });
	const before = renderCount();

	act(() => jest.advanceTimersByTime(1_200));

	expect(renderCount()).toBeGreaterThan(before);
});
