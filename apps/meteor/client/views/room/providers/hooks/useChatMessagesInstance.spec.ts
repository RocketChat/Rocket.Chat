import { renderHook } from '@testing-library/react';

import { useDepsMatch } from './useDepsMatch';
import { useInstance } from './useInstance';

jest.mock('./useDepsMatch', () => ({
	useDepsMatch: jest.fn(),
}));

class MockChatMessages {
	release() {
		return 'released';
	}
}

describe('useInstance', () => {
	let release: jest.Mock;
	let factory: jest.Mock;
	let dependencyArray: unknown[];

	beforeEach(() => {
		release = jest.fn();
		factory = jest.fn().mockReturnValue([new MockChatMessages(), release]);
		dependencyArray = ['dep1'];
	});

	it('should create a new instance if dependencies change', () => {
		(useDepsMatch as jest.Mock).mockReturnValue(false);

		const { result, rerender } = renderHook(() => useInstance(factory, dependencyArray), { legacyRoot: true });

		expect(factory).toHaveBeenCalledTimes(1);
		expect(result.current).toBeInstanceOf(MockChatMessages);
		expect((result.current as MockChatMessages).release()).toBe('released');

		dependencyArray.push('dep2');
		rerender();

		expect(factory).toHaveBeenCalledTimes(2);
	});

	it('should not create a new instance if dependencies do not change', () => {
		(useDepsMatch as jest.Mock).mockReturnValue(true);

		const { result, rerender } = renderHook(() => useInstance(factory, dependencyArray), { legacyRoot: true });

		expect(factory).toHaveBeenCalledTimes(1);
		expect(result.current).toBeInstanceOf(MockChatMessages);
		expect((result.current as MockChatMessages).release()).toBe('released');

		rerender();

		expect(factory).toHaveBeenCalledTimes(1);
	});

	it('should call release function when component is unmounted', () => {
		(useDepsMatch as jest.Mock).mockReturnValue(false);

		const { unmount } = renderHook(() => useInstance(factory, dependencyArray), { legacyRoot: true });

		expect(factory).toHaveBeenCalledTimes(1);

		unmount();

		expect(release).toHaveBeenCalledTimes(1);
	});
});
