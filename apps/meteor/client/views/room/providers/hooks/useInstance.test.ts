import { beforeEach, describe, it } from 'node:test';

import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import { useInstance } from './useInstance';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

class MockChatMessages {
	release() {
		return 'released';
	}
}

describe('useInstance', () => {
	let factory: Mock<FunctionLike>;
	let release: Mock<FunctionLike>;

	beforeEach(() => {
		mocker.clearAllMocks();

		release = fn<FunctionLike>();
		factory = fn<FunctionLike>().mockReturnValue([{ instance: new MockChatMessages() }, release]);
	});

	it('should create a new instance when dependencies change', () => {
		const { result, rerender } = renderHook(({ deps }) => useInstance(factory, deps), {
			initialProps: { deps: ['initial-dep'] },
		});

		expect(result.current).toEqual({ instance: new MockChatMessages() });
		expect(factory).toHaveBeenCalledTimes(1);
		expect(release).toHaveBeenCalledTimes(0);

		rerender({ deps: ['new-dep'] });

		expect(result.current).toEqual({ instance: new MockChatMessages() });
		expect(factory).toHaveBeenCalledTimes(2);
		expect(release).toHaveBeenCalledTimes(1);
	});

	it('should not create a new instance when dependencies do not change', () => {
		const { result, rerender } = renderHook(({ deps }) => useInstance(factory, deps), {
			initialProps: { deps: ['initial-dep'] },
		});

		expect(result.current).toEqual({ instance: new MockChatMessages() });
		expect(factory).toHaveBeenCalledTimes(1);
		expect(release).toHaveBeenCalledTimes(0);

		rerender({ deps: ['initial-dep'] });

		expect(result.current).toEqual({ instance: new MockChatMessages() });
		expect(factory).toHaveBeenCalledTimes(1);
		expect(release).toHaveBeenCalledTimes(0);
	});

	it('should call release function when component unmounts', () => {
		const { unmount } = renderHook(() => useInstance(factory, ['initial-dep']));

		unmount();

		expect(release).toHaveBeenCalledTimes(1);
	});
});
