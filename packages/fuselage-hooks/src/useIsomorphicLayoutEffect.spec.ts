import { renderHook } from './testing.js';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect.js';

it('performs a useLayoutEffect', () => {
	const cleanup = jest.fn();
	const effect = jest.fn(() => cleanup);

	const { unmount } = renderHook(() => {
		useIsomorphicLayoutEffect(effect);
	});

	expect(effect).toHaveBeenCalled();

	unmount();

	expect(cleanup).toHaveBeenCalled();
});
