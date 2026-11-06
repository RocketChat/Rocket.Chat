import breakpointsTokens from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';

import { renderHook, act } from './testing';
import { useBreakpoints } from './useBreakpoints';
import { withMatchMediaMock } from '../mocks/withMatchMediaMock';

const setViewport = withMatchMediaMock();

const breakpoints = Object.entries(breakpointsTokens)
	.map(([name, { minViewportWidth }]) => ({
		name,
		minViewportWidth,
	}))
	.sort((a, b) => (a.minViewportWidth ?? 0) - (b.minViewportWidth ?? 0));

it('returns at least the smallest breakpoint name', () => {
	const { result } = renderHook(() => useBreakpoints());

	expect(result.current[0]).toBe(breakpoints[0].name);
});

it('returns matching breakpoint names', async () => {
	const initialBreakpoints = breakpoints.slice(0, -1);
	const finalBreakpoints = breakpoints.slice(0, -2);

	setViewport({
		width: initialBreakpoints[initialBreakpoints.length - 1].minViewportWidth ?? undefined,
	});

	const { result } = renderHook(() => useBreakpoints());

	expect(result.current).toEqual(initialBreakpoints.map((breakpoint) => breakpoint.name));

	await act(async () => {
		setViewport({
			width: finalBreakpoints[finalBreakpoints.length - 1].minViewportWidth ?? undefined,
		});
	});

	expect(result.current).toStrictEqual(finalBreakpoints.map((breakpoint) => breakpoint.name));
});
