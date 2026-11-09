import { renderHook } from '@testing-library/react';

import { useUserScrollIntent } from './useUserScrollIntent';

describe('useUserScrollIntent', () => {
	it.each(['wheel', 'touchmove', 'keydown', 'pointerdown', 'click'])('should flag a user scroll on %s', (eventName) => {
		const { result } = renderHook(() => useUserScrollIntent());
		const node = document.createElement('div');

		result.current.ref(node);
		expect(result.current.hasUserScrolled.current).toBe(false);

		node.dispatchEvent(new Event(eventName));
		expect(result.current.hasUserScrolled.current).toBe(true);
	});

	it.each(['wheel', 'touchmove', 'keydown', 'pointerdown', 'click'])('should notify the user scroll on %s', (eventName) => {
		const onUserScroll = jest.fn();
		const { result } = renderHook(() => useUserScrollIntent(onUserScroll));
		const node = document.createElement('div');

		result.current.ref(node);
		node.dispatchEvent(new Event(eventName));

		expect(onUserScroll).toHaveBeenCalledTimes(1);
	});

	it('should reset the flag when bound to a new node', () => {
		const { result } = renderHook(() => useUserScrollIntent());
		const firstNode = document.createElement('div');

		const cleanup = result.current.ref(firstNode);
		firstNode.dispatchEvent(new Event('wheel'));
		expect(result.current.hasUserScrolled.current).toBe(true);

		if (typeof cleanup === 'function') {
			cleanup();
		}
		result.current.ref(document.createElement('div'));
		expect(result.current.hasUserScrolled.current).toBe(false);
	});

	it('should stop listening once the node is released', () => {
		const { result } = renderHook(() => useUserScrollIntent());
		const node = document.createElement('div');

		const cleanup = result.current.ref(node);
		if (typeof cleanup === 'function') {
			cleanup();
		}
		node.dispatchEvent(new Event('wheel'));

		expect(result.current.hasUserScrolled.current).toBe(false);
	});
});
