import { renderHook } from '@testing-library/react';

import { useKeepAtBottom } from './useKeepAtBottom';

let resizeCallbacks: ResizeObserverCallback[] = [];

class MockResizeObserver {
	constructor(cb: ResizeObserverCallback) {
		resizeCallbacks.push(cb);
	}

	observe = jest.fn();

	unobserve = jest.fn();

	disconnect = jest.fn();
}

// Rows are measured asynchronously after the list remounts (avatars, images, reactions),
// so the observer fires repeatedly while the restored position is being applied.
const settleList = (times: number) => {
	for (let i = 0; i < times; i++) {
		resizeCallbacks.forEach((cb) => cb([], {} as ResizeObserver));
	}
};

const mountList = (isAtBottom: { current: boolean }) => {
	const { result } = renderHook(() => useKeepAtBottom(isAtBottom));

	const node = document.createElement('div');
	node.appendChild(document.createElement('div'));
	result.current.keepAtBottomRef(node);

	const scrollToEnd = jest.fn();
	result.current.setKeepAtBottom(scrollToEnd);

	return scrollToEnd;
};

describe('useKeepAtBottom', () => {
	beforeEach(() => {
		resizeCallbacks = [];
		(global as any).ResizeObserver = MockResizeObserver;
	});

	it('does not pull the list to the latest messages when the room was left mid-history', () => {
		const scrollToEnd = mountList({ current: false });

		settleList(3);

		expect(scrollToEnd).not.toHaveBeenCalled();
	});

	it('keeps the list at the bottom when the room was left at the bottom', () => {
		const scrollToEnd = mountList({ current: true });

		settleList(3);

		expect(scrollToEnd).toHaveBeenCalledTimes(3);
	});
});
