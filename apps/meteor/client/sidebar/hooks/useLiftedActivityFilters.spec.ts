import { act, renderHook } from '@testing-library/react';

import { useLiftedActivityFilters } from './useLiftedActivityFilters';

describe('useLiftedActivityFilters', () => {
	it('lifts a group at its window and puts it back', () => {
		const { result } = renderHook(() => useLiftedActivityFilters());

		expect(result.current.liftedFilters).toEqual({});

		act(() => result.current.toggleLifted('Channels', 24));
		expect(result.current.liftedFilters).toEqual({ Channels: 24 });

		act(() => result.current.toggleLifted('Channels', 24));
		expect(result.current.liftedFilters).toEqual({});
	});

	it('keeps one lift per group, at the window last lifted', () => {
		const { result } = renderHook(() => useLiftedActivityFilters());

		act(() => result.current.toggleLifted('Channels', 24));
		act(() => result.current.toggleLifted('Direct_Messages', 168));
		act(() => result.current.toggleLifted('Channels', 168));

		expect(result.current.liftedFilters).toEqual({ Channels: 168, Direct_Messages: 168 });
	});

	it('drops the lift of a group, leaving the others', () => {
		const { result } = renderHook(() => useLiftedActivityFilters());

		act(() => result.current.toggleLifted('Channels', 24));
		act(() => result.current.toggleLifted('Direct_Messages', 168));
		act(() => result.current.dropLifted('Channels'));

		expect(result.current.liftedFilters).toEqual({ Direct_Messages: 168 });
	});

	it('leaves the state alone when dropping a group that is not lifted', () => {
		const { result } = renderHook(() => useLiftedActivityFilters());

		act(() => result.current.toggleLifted('Channels', 24));
		const before = result.current.liftedFilters;

		act(() => result.current.dropLifted('Direct_Messages'));

		expect(result.current.liftedFilters).toBe(before);
	});
});
