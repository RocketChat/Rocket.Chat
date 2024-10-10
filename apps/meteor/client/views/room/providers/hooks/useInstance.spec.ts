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
	let factory: jest.Mock;

	beforeEach(() => {
		factory = jest.fn().mockReturnValue([{ instance: new MockChatMessages() }, jest.fn()]);
	});

	it('should create a new instance when dependencies change', () => {
		(useDepsMatch as jest.Mock).mockReturnValue(false);

		const { result, rerender } = renderHook(({ deps }) => useInstance(factory, deps), {
			initialProps: { deps: ['initial-dep'] },
			legacyRoot: true,
		});

		expect(factory).toHaveBeenCalledTimes(1);
		expect(result.current).toEqual({ instance: new MockChatMessages() });

		rerender({ deps: ['new-dep'] });

		expect(factory).toHaveBeenCalledTimes(2);
		expect(result.current).toEqual({ instance: new MockChatMessages() });
	});

	it('should not create a new instance when dependencies do not change', () => {
		(useDepsMatch as jest.Mock).mockReturnValue(true);

		const { result, rerender } = renderHook(({ deps }) => useInstance(factory, deps), {
			initialProps: { deps: ['initial-dep'] },
			legacyRoot: true,
		});

		expect(factory).toHaveBeenCalledTimes(1);
		expect(result.current).toEqual({ instance: new MockChatMessages() });

		rerender({ deps: ['initial-dep'] });

		expect(factory).toHaveBeenCalledTimes(1);
		expect(result.current).toEqual({ instance: new MockChatMessages() });
	});

	it('should call release function when instance is replaced', () => {
		const release = jest.fn();
		factory.mockReturnValueOnce([{ instance: new MockChatMessages() }, release]);
		(useDepsMatch as jest.Mock).mockReturnValue(false);

		const { rerender } = renderHook(({ deps }) => useInstance(factory, deps), {
			initialProps: { deps: ['initial-dep'] },
			legacyRoot: true,
		});

		rerender({ deps: ['new-dep'] });

		expect(release).toHaveBeenCalledTimes(1);
	});

	it('should call release function when component unmounts', () => {
		const release = jest.fn();
		factory.mockReturnValueOnce([{ instance: new MockChatMessages() }, release]);
		(useDepsMatch as jest.Mock).mockReturnValue(true);

		const { unmount } = renderHook(() => useInstance(factory, ['initial-dep']), { legacyRoot: true });

		unmount();

		expect(release).toHaveBeenCalledTimes(1);
	});
});
