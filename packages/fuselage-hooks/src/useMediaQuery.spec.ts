import { renderHook, act } from './testing';
import { useMediaQuery } from './useMediaQuery';
import { withMatchMediaMock } from '../mocks/withMatchMediaMock';

const setViewport = withMatchMediaMock();

it('does not register a undefined media query', () => {
	renderHook(() => useMediaQuery());

	expect(window.matchMedia).not.toHaveBeenCalled();
});

it('does register a defined media query', () => {
	renderHook(() => useMediaQuery('(max-width: 1024px)'));

	expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1024px)');
});

it('returns false if no query is given', () => {
	const { result } = renderHook(() => useMediaQuery());

	expect(result.current).toBe(false);
});

it('returns false if the media query does not match', () => {
	const { result } = renderHook(() => useMediaQuery('(max-width: 968px)'));

	expect(result.current).toBe(false);
});

it('returns true if the media query does match', async () => {
	setViewport({ width: 968 });

	const { result } = renderHook(() => useMediaQuery('(max-width: 968px)'));

	expect(result.current).toBe(true);
});

it('mutates its value to true if the media query matches', async () => {
	const { result } = renderHook(() => useMediaQuery('(max-width: 968px)'));

	expect(result.current).toBe(false);

	await act(async () => {
		setViewport({ width: 968 });
	});

	expect(result.current).toBe(true);

	await act(async () => {
		setViewport({ width: 1024 });
	});

	expect(result.current).toBe(false);
});
