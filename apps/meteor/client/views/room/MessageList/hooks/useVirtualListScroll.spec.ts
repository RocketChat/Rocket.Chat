import { renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import type { VirtualizerHandle } from 'virtua';

import { isScrolledToBottom, useVirtualListScroll } from './useVirtualListScroll';

const metrics = { scrollSize: 1000, viewportSize: 300 };

describe('isScrolledToBottom', () => {
	it('is true at the very end of the list', () => {
		expect(isScrolledToBottom(700, metrics, 20)).toBe(true);
	});

	it('is true within the threshold of the end', () => {
		expect(isScrolledToBottom(680, metrics, 20)).toBe(true);
	});

	it('is false beyond the threshold', () => {
		expect(isScrolledToBottom(679, metrics, 20)).toBe(false);
	});
});

describe('useVirtualListScroll', () => {
	const renderController = (isAtBottom: MutableRefObject<boolean | null>, hasMoreNext = false) =>
		renderHook(({ hasMoreNext }) => useVirtualListScroll({ isAtBottom, hasMoreNext, bottomThreshold: 60 }), {
			initialProps: { hasMoreNext },
		});

	const attachHandle = (virtualizerRef: MutableRefObject<VirtualizerHandle | null>) => {
		virtualizerRef.current = metrics as VirtualizerHandle;
	};

	it('marks the list at the bottom when scrolled near the end', () => {
		const isAtBottom = { current: false };
		const { result } = renderController(isAtBottom);
		attachHandle(result.current.virtualizerRef);

		expect(result.current.trackScroll(650)).toBe(true);
		expect(isAtBottom.current).toBe(true);
	});

	it('marks the list away from the bottom when scrolled up', () => {
		const isAtBottom = { current: true };
		const { result } = renderController(isAtBottom);
		attachHandle(result.current.virtualizerRef);

		expect(result.current.trackScroll(100)).toBe(false);
		expect(isAtBottom.current).toBe(false);
	});

	it('never counts as at the bottom while newer messages are unloaded', () => {
		const isAtBottom = { current: true };
		const { result } = renderController(isAtBottom, true);
		attachHandle(result.current.virtualizerRef);

		expect(isAtBottom.current).toBe(false);
		expect(result.current.trackScroll(700)).toBe(false);
		expect(isAtBottom.current).toBe(false);
	});

	it('clears the at-bottom flag on every commit while newer messages are unloaded', () => {
		const isAtBottom = { current: false };
		const { rerender } = renderController(isAtBottom);

		isAtBottom.current = true;
		rerender({ hasMoreNext: false });
		expect(isAtBottom.current).toBe(true);

		rerender({ hasMoreNext: true });
		expect(isAtBottom.current).toBe(false);
	});
});
