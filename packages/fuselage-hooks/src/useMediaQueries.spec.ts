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

it('returns the matches of the new queries when the queries change', () => {
	const { result, rerender } = renderHook(({ queries }) => useMediaQueries(...queries), {
		initialProps: { queries: ['(max-width: 968px)'] },
	});

	expect(result.current).toEqual([false]);

	rerender({ queries: ['(max-width: 1024px)'] });

	expect(result.current).toEqual([true]);

	rerender({ queries: ['(max-width: 1024px)', '(max-width: 968px)'] });

	expect(result.current).toEqual([true, false]);
});

it('reads the current matches when a change event was missed', () => {
	const { result, rerender } = renderHook(() => useMediaQueries('(max-width: 968px)'));

	expect(result.current).toEqual([false]);

	// detaches the hook's listeners, as when the query changes before they are attached
	jest.mocked(window.matchMedia).mock.results.forEach(({ value }) => {
		const mediaQueryList = value as MediaQueryList;
		jest.mocked(mediaQueryList.addEventListener).mock.calls.forEach((call: unknown[]) => {
			const [type, listener] = call as [string, EventListener];
			mediaQueryList.removeEventListener(type, listener);
		});
	});
	setViewport({ width: 968 });

	rerender();

	expect(result.current).toEqual([true]);
});
