import { renderHook } from './testing';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { withMatchMediaMock } from '../mocks/withMatchMediaMock';

const setViewport = withMatchMediaMock();

let container: HTMLDivElement | undefined;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});

afterEach(() => {
	container?.remove();
	container = undefined;
});

it('returns false on the initial call', () => {
	const { result } = renderHook(() => usePrefersReducedMotion());

	expect(result.current).toBe(false);
});

it('should returns true with matchMedia mocked', () => {
	setViewport({
		'prefers-reduced-motion': 'reduce',
	});

	const { result } = renderHook(() => usePrefersReducedMotion());

	expect(result.current).toBe(true);
});
