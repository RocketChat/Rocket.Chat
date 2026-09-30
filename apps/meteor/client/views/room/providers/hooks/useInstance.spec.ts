import { renderHook } from '@testing-library/react';
import { useLayoutEffect } from 'react';

import { useInstance } from './useInstance';

class MockChatMessages {
	release() {
		return 'released';
	}
}

describe('useInstance', () => {
	let factory: jest.Mock;
	let release: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();

		release = jest.fn();
		factory = jest.fn(() => [{ instance: new MockChatMessages() }, release]);
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

	it('should release the previous instance only after the new one is committed', () => {
		const log: string[] = [];
		const factory = jest.fn((dep: string) => [dep, () => log.push(`release ${dep}`)] as [string, () => void]);

		const { rerender } = renderHook(
			({ dep }) => {
				const instance = useInstance(() => factory(dep), [dep]);
				log.push(`render ${instance}`);
				useLayoutEffect(() => {
					log.push(`commit ${instance}`);
				}, [instance]);
			},
			{ initialProps: { dep: 'a' } },
		);

		log.length = 0;
		rerender({ dep: 'b' });

		expect(log).toEqual(['render b', 'commit b', 'release a']);
	});
});
