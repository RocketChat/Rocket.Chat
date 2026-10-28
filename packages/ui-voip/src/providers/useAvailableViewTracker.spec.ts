import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';

import useAvailableViewTracker from './useAvailableViewTracker';

describe('useAvailableViewTracker', () => {
	it('should track registered views under StrictMode, which calls state updaters twice', () => {
		const { result } = renderHook(() => useAvailableViewTracker(), { wrapper: StrictMode });

		act(() => result.current.registerView('popout'));
		expect(result.current.currentViews.has('popout')).toBe(true);

		act(() => result.current.unregisterView('popout'));
		expect(result.current.currentViews.has('popout')).toBe(false);
	});

	it('should hide the widget while the room view is registered', () => {
		const { result } = renderHook(() => useAvailableViewTracker(), { wrapper: StrictMode });

		act(() => result.current.registerView('widget'));
		expect(result.current.currentViews.has('widget')).toBe(true);

		act(() => result.current.registerView('room'));
		expect(result.current.currentViews.has('widget')).toBe(false);

		act(() => result.current.unregisterView('room'));
		expect(result.current.currentViews.has('widget')).toBe(true);
	});

	it('should return a new set only when the registered views change', () => {
		const { result } = renderHook(() => useAvailableViewTracker(), { wrapper: StrictMode });

		act(() => result.current.registerView('popout'));
		const views = result.current.currentViews;

		act(() => result.current.registerView('popout'));
		expect(result.current.currentViews).toBe(views);

		act(() => result.current.registerView('room'));
		expect(result.current.currentViews).not.toBe(views);
	});
});
