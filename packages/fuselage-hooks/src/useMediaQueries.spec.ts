import { renderHook, act } from './testing';
import { useMediaQueries } from './useMediaQueries';
import { withMatchMediaMock } from '../mocks/withMatchMediaMock';

const setViewport = withMatchMediaMock();

it('returns empty array if no query is given', () => {
	const { result } = renderHook(() => useMediaQueries());

	expect(result.current).toEqual([]);
});

it("returns false values if the media queries don't match", () => {
	const { result } = renderHook(() => useMediaQueries('(max-width: 1024px)', '(max-width: 968px)'));

	expect(result.current).toEqual([true, false]);
});

it('returns true if the media query does match', () => {
	setViewport({ width: 968 });

	const { result } = renderHook(() => useMediaQueries('(max-width: 1024px)', '(max-width: 968px)'));

	expect(result.current).toEqual([true, true]);
});

it('mutates its value to true if the media query matches', async () => {
	const { result } = renderHook(() => useMediaQueries('(max-width: 1024px)', '(max-width: 968px)'));

	expect(result.current).toEqual([true, false]);

	await act(async () => {
		setViewport({ width: 968 });
	});

	expect(result.current).toEqual([true, true]);

	await act(async () => {
		setViewport({ width: 1024 });
	});

	expect(result.current).toEqual([true, false]);
});
