import { VIDEO_CONF_RINGING_WINDOW_MS } from '@rocket.chat/core-typings';
import { act, renderHook } from '@testing-library/react';

import type { RingingCandidate } from './useRinging';
import { useIsRinging, useRinging } from './useRinging';

/** Named, so that what comes back can be identified rather than only counted. */
type Candidate = RingingCandidate & { name?: string };

/**
 * The candidates are handed in as a fresh array each time, because that is how every caller builds them: inline,
 * from a list that is rebuilt whenever anything else about it changes.
 */
const renderRinging = (candidates: Candidate[]) =>
	renderHook(({ candidates }: { candidates: Candidate[] }) => useRinging([...candidates]), { initialProps: { candidates } });

const agoBy = (ms: number) => new Date(Date.now() - ms);

const rung = (name: string, ms: number): Candidate => ({ name, ringingAt: agoBy(ms) });

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

it('answers with the ones that are ringing', () => {
	const { result } = renderRinging([rung('live', 0), { name: 'never rung' }, rung('lapsed', VIDEO_CONF_RINGING_WINDOW_MS + 1_000)]);

	expect(result.current).toHaveLength(1);
	expect(result.current[0]).toHaveProperty('name', 'live');
});

it('keeps saying so while the ring is still a ring', () => {
	const { result } = renderRinging([rung('live', 0)]);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 1_000));

	expect(result.current).toHaveLength(1);
});

// The whole point of the hook: nothing announces a ring lapsing, so without this the caller would go on showing
// a phone ringing until something unrelated moved.
it('drops a ring when it lapses, without being asked again', () => {
	const { result } = renderRinging([rung('live', 0)]);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS + 200));

	expect(result.current).toHaveLength(0);
});

// Two rings, one after the other: the wake-up for the first has to schedule the second, since the list it is
// reading has not changed and nothing else is going to ask.
it('drops each ring in turn', () => {
	const { result } = renderRinging([rung('first', 10_000), rung('second', 2_000)]);

	expect(result.current).toHaveLength(2);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 10_000 + 200));
	expect(result.current.map(({ name }) => name)).toEqual(['second']);

	act(() => jest.advanceTimersByTime(8_000 + 200));
	expect(result.current).toHaveLength(0);
});

// A member who declined keeps their `ringingAt`, and callers hand the whole list over. Taking an already-finished
// ring as the next thing to wake for parked the timer on a moment that had passed, and the live ring behind it
// lapsed unannounced.
it('still drops a later ring when an earlier one had already lapsed', () => {
	const { result } = renderRinging([rung('lapsed', VIDEO_CONF_RINGING_WINDOW_MS + 5_000), rung('live', 2_000)]);

	expect(result.current.map(({ name }) => name)).toEqual(['live']);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 2_000 + 200));

	expect(result.current).toHaveLength(0);
});

// A caller rebuilding its list on every render must not restart the wait, or the answer never changes.
it('does not restart the wait when the same rings arrive in a new array', () => {
	const { result, rerender } = renderRinging([rung('live', 0)]);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS - 1_000));
	rerender({ candidates: [{ name: 'live', ringingAt: agoBy(VIDEO_CONF_RINGING_WINDOW_MS - 1_000) }] });
	expect(result.current).toHaveLength(1);

	act(() => jest.advanceTimersByTime(1_200));

	expect(result.current).toHaveLength(0);
});

// Answering by declining stops the ringing even inside the window — which only the records that carry a
// `declinedAt` can say, and conference members do.
it('does not call a declined member ringing', () => {
	const { result } = renderRinging([{ ringingAt: agoBy(1_000), declined: true, declinedAt: agoBy(500) }]);

	expect(result.current).toHaveLength(0);
});

it('has nothing to say when nobody is ringing', () => {
	const { result } = renderRinging([]);

	act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS * 3));

	expect(result.current).toHaveLength(0);
});

describe('useIsRinging', () => {
	it('answers for the one it was given, and stops when the ring does', () => {
		// Built once, as a member read off a conference is: a fixture rebuilt on every render would be a ring
		// re-stamped on every render, and this would never stop saying yes.
		const member = { ringingAt: agoBy(0) };
		const { result } = renderHook(() => useIsRinging(member));

		expect(result.current).toBe(true);

		act(() => jest.advanceTimersByTime(VIDEO_CONF_RINGING_WINDOW_MS + 200));

		expect(result.current).toBe(false);
	});

	it('answers no for nobody', () => {
		const { result } = renderHook(() => useIsRinging(undefined));

		expect(result.current).toBe(false);
	});
});
