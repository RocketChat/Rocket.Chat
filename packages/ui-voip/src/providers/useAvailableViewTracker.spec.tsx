import { act, renderHook } from '@testing-library/react';
import { useEffect } from 'react';

import useAvailableViewTracker from './useAvailableViewTracker';
import type { AvailableViews } from '../context/MediaCallInstanceContext';

const flush = () =>
	act(async () => {
		await Promise.resolve();
	});

const renderTracker = (history?: AvailableViews[][]) =>
	renderHook(() => {
		const tracker = useAvailableViewTracker();
		useEffect(() => {
			history?.push(tracker.currentViews);
		}, [tracker.currentViews]);
		return tracker;
	});

describe('useAvailableViewTracker', () => {
	it('reflects a registered view after the microtask flush', async () => {
		const { result } = renderTracker();

		expect(result.current.currentViews).toEqual([]);

		result.current.registerView('widget');
		expect(result.current.currentViews).toEqual([]);

		await flush();

		expect(result.current.currentViews).toEqual(['widget']);
	});

	it('coalesces multiple synchronous mutations into a single notification', async () => {
		const history: AvailableViews[][] = [];
		const { result } = renderTracker(history);

		act(() => {
			result.current.registerView('widget');
			result.current.registerView('popout');
		});
		await flush();

		expect(result.current.currentViews).toEqual(['widget', 'popout']);
		expect(history.filter((views) => views.length > 0)).toEqual([['widget', 'popout']]);
	});

	it('does not emit a transient "unregistered" state when a view is unregistered and re-registered in the same tick', async () => {
		const history: AvailableViews[][] = [];
		const { result } = renderTracker(history);

		await act(async () => {
			result.current.registerView('widget');
			await Promise.resolve();
		});
		expect(result.current.currentViews).toEqual(['widget']);

		await act(async () => {
			result.current.unregisterView('widget');
			result.current.registerView('widget');
			await Promise.resolve();
		});

		expect(result.current.currentViews).toEqual(['widget']);
		const firstWidget = history.findIndex((views) => views.includes('widget'));
		expect(history.slice(firstWidget).every((views) => views.includes('widget'))).toBe(true);
	});

	it('hides the widget view while the room view is registered', async () => {
		const { result } = renderTracker();

		await act(async () => {
			result.current.registerView('widget');
			result.current.registerView('room');
			await Promise.resolve();
		});

		expect(result.current.currentViews).toEqual(['room']);
	});
});
