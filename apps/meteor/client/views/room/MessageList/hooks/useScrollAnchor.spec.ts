import { act, renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import type { VirtualizerHandle } from 'virtua';

import { useScrollAnchor } from './useScrollAnchor';

describe('useScrollAnchor', () => {
	describe('hook integration', () => {
		type MockHandle = {
			scrollOffset: number;
			scrollSize: number;
			viewportSize: number;
			findItemIndex: jest.Mock;
			getItemOffset: jest.Mock;
			scrollTo: jest.Mock;
			scrollToIndex: jest.Mock;
		};

		const makeHandle = (over: Partial<MockHandle> = {}): MockHandle => ({
			scrollOffset: 700,
			scrollSize: 1000,
			viewportSize: 300,
			findItemIndex: jest.fn(() => 7),
			getItemOffset: jest.fn(() => 700),
			scrollTo: jest.fn(),
			scrollToIndex: jest.fn(),
			...over,
		});

		const refTo = (h: MockHandle): MutableRefObject<VirtualizerHandle | null> => ({ current: h as unknown as VirtualizerHandle });

		// Step the rAF loop one tick at a time; the next rAF the tick re-schedules
		// stays queued for the following call.
		const tick = () => act(() => jest.advanceTimersToNextTimer(1));

		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('captures at-bottom on a settled frame and pins to bottom on a scrollSize change', () => {
			const handle = makeHandle({ scrollOffset: 700, scrollSize: 1000, viewportSize: 300 });
			renderHook(() => useScrollAnchor({ virtualizerRef: refTo(handle), suppress: false }));

			tick();
			tick();
			handle.scrollSize = 1500;
			tick();

			expect(handle.scrollToIndex).toHaveBeenCalledWith(7, { align: 'end' });
		});

		it('pins to bottom on a viewport-height change even when scrollSize is unchanged', () => {
			// A pure height resize changes viewportSize but not scrollSize; the restore must
			// still fire, or the newest message drifts below the fold.
			const handle = makeHandle({ scrollOffset: 700, scrollSize: 1000, viewportSize: 300 });
			renderHook(() => useScrollAnchor({ virtualizerRef: refTo(handle), suppress: false }));

			tick();
			tick();
			handle.viewportSize = 200;
			tick();

			expect(handle.scrollToIndex).toHaveBeenCalledWith(7, { align: 'end' });
		});

		it('pins to bottom on a change when pinToBottom is set, even if not at bottom', () => {
			// e.g. just sent a message (shouldJumpToBottom): a late-loading video grows while
			// the user is being scrolled to the bottom; we must follow it down, not top-anchor.
			const handle = makeHandle({ scrollOffset: 200, scrollSize: 1000, viewportSize: 300 });
			renderHook(() => useScrollAnchor({ virtualizerRef: refTo(handle), suppress: false, pinToBottom: true }));

			tick();
			tick();
			handle.scrollSize = 1500;
			tick();

			expect(handle.scrollToIndex).toHaveBeenCalledWith(7, { align: 'end' });
		});

		it('captures not-at-bottom on a settled frame and restores the top anchor on a change', () => {
			const handle = makeHandle({ scrollOffset: 723.5, scrollSize: 5000, viewportSize: 300, getItemOffset: jest.fn(() => 700) });
			const { result } = renderHook(() => useScrollAnchor({ virtualizerRef: refTo(handle), suppress: false }));

			act(() => {
				result.current.updateTopAnchor();
			});

			tick();
			tick();
			handle.scrollSize = 5100;
			tick();

			expect(handle.scrollToIndex).toHaveBeenCalledWith(7, { align: 'start', offset: 23.5 });
		});

		it('freezes at-bottom through a change instead of recomputing from mid-change geometry', () => {
			// A resize re-wraps content and grows scrollSize before scrollTop
			// follows, so live geometry reads "not at bottom" exactly when it changes. The
			// captured (settled) at-bottom must be held through the change so we still pin.
			const handle = makeHandle({ scrollOffset: 200, scrollSize: 1000, viewportSize: 300 });
			renderHook(() => useScrollAnchor({ virtualizerRef: refTo(handle), suppress: false }));

			tick();
			tick();
			handle.scrollOffset = 700;
			tick();

			handle.scrollSize = 1500;
			tick();

			expect(handle.scrollToIndex).toHaveBeenCalledWith(7, { align: 'end' });
		});

		it('skips the decision while suppress is true and resumes when it flips false', () => {
			const handle = makeHandle({ scrollOffset: 700, scrollSize: 1000, viewportSize: 300 });
			const virtualizerRef = refTo(handle);
			const { rerender } = renderHook(({ suppress }) => useScrollAnchor({ virtualizerRef, suppress }), {
				initialProps: { suppress: true },
			});

			tick();
			tick();
			handle.scrollSize = 1500;
			tick();

			expect(handle.scrollToIndex).not.toHaveBeenCalled();

			rerender({ suppress: false });
			handle.scrollSize = 1800;
			tick();

			expect(handle.scrollToIndex).toHaveBeenCalledWith(7, { align: 'end' });
		});

		it('cancels the rAF loop on unmount', () => {
			const handle = makeHandle();
			const { unmount } = renderHook(() => useScrollAnchor({ virtualizerRef: refTo(handle), suppress: false }));

			tick();
			unmount();

			handle.scrollSize = 9999;
			act(() => {
				jest.runOnlyPendingTimers();
			});

			expect(handle.scrollTo).not.toHaveBeenCalled();
			expect(handle.scrollToIndex).not.toHaveBeenCalled();
		});
	});
});
