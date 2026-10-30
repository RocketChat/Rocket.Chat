import { renderHook } from './testing.js';
import { usePrefersReducedData } from './usePrefersReducedData.js';
import { withMatchMediaMock } from '../mocks/withMatchMediaMock.js';

const setViewport = withMatchMediaMock();

it('should return false on the initial call', () => {
	const { result } = renderHook(() => usePrefersReducedData());

	expect(result.current).toBe(false);
});

it('should returns true with matchMedia mocked', () => {
	setViewport({
		'prefers-reduced-data': 'reduce',
	});

	const { result } = renderHook(() => usePrefersReducedData());

	expect(result.current).toBe(true);
});
