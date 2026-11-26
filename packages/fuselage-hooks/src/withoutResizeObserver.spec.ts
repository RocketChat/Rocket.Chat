import { renderHook } from './testing.js';
import { useBorderBoxSize } from './useBorderBoxSize.js';
import { useContentBoxSize } from './useContentBoxSize.js';
import { usePosition } from './usePosition/index.js';
import { useResizeObserver } from './useResizeObserver.js';

describe('where ResizeObserver does not exist', () => {
	const original = globalThis.ResizeObserver;

	beforeEach(() => {
		// @ts-expect-error simulating a runtime without the global
		delete globalThis.ResizeObserver;
	});

	afterEach(() => {
		globalThis.ResizeObserver = original;
	});

	it('useResizeObserver returns its initial sizes', () => {
		const { result } = renderHook(() => useResizeObserver());

		expect(result.current.ref).toEqual({ current: null });
		expect(result.current.contentBoxSize).toEqual({ inlineSize: undefined, blockSize: undefined });
	});

	it('useContentBoxSize and useBorderBoxSize return the initial size', () => {
		const ref = { current: document.createElement('div') };

		const { result: contentResult } = renderHook(() => useContentBoxSize(ref));
		const { result: borderResult } = renderHook(() => useBorderBoxSize(ref));

		expect(contentResult.current).toEqual({ inlineSize: 0, blockSize: 0 });
		expect(borderResult.current).toEqual({ inlineSize: 0, blockSize: 0 });
	});

	it('usePosition renders without throwing', () => {
		const anchor = { current: document.createElement('div') };
		const target = { current: document.createElement('div') };

		expect(() => renderHook(() => usePosition(anchor, target))).not.toThrow();
	});
});
