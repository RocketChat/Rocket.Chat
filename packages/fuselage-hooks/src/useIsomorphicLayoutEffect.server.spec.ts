import { renderHook } from './testing.js';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect.js';

it('performs a useEffect', () => {
	const watcher = jest.fn();

	renderHook(() => {
		useIsomorphicLayoutEffect(() => {
			watcher();
		});
	});

	expect(watcher).toHaveBeenCalledTimes(0);
});
