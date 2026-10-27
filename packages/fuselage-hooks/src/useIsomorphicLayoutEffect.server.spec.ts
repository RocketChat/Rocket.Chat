import { renderHook } from './testing';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

it('performs a useEffect', () => {
	const watcher = jest.fn();

	renderHook(() => {
		useIsomorphicLayoutEffect(() => {
			watcher();
		});
	});

	expect(watcher).toHaveBeenCalledTimes(0);
});
