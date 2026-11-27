import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';

import { useRadioToggle } from './useRadioToggle';
import type { RadioDropDownGroup } from '../definitions/RadioDropDownDefinitions';

const createGroup = (): RadioDropDownGroup => ({
	label: 'Filter',
	items: [
		{ id: 'all', label: 'All', checked: true },
		{ id: 'free', label: 'Free', checked: false },
		{ id: 'paid', label: 'Paid', checked: false },
	],
});

const renderRadioToggle = (initial: RadioDropDownGroup) =>
	renderHook(() => {
		const [group, setGroup] = useState(initial);
		return { group, onSelected: useRadioToggle(setGroup) };
	});

describe('useRadioToggle', () => {
	it('checks only the selected item', () => {
		const { result } = renderRadioToggle(createGroup());

		act(() => result.current.onSelected(result.current.group.items[1]));

		expect(result.current.group.items.map(({ checked }) => checked)).toEqual([false, true, false]);
	});

	it('selects by id, so an item from an earlier render still works', () => {
		const { result } = renderRadioToggle(createGroup());
		const staleItem = result.current.group.items[2];

		act(() => result.current.onSelected(result.current.group.items[1]));
		act(() => result.current.onSelected(staleItem));

		expect(result.current.group.items.find(({ checked }) => checked)?.id).toBe('paid');
	});

	// Memoized consumers (React Compiler) only re-render when the items array and items are new references.
	it('replaces the items instead of mutating them', () => {
		const initial = createGroup();
		const snapshot = createGroup();
		const { result } = renderRadioToggle(initial);

		act(() => result.current.onSelected(result.current.group.items[1]));

		expect(initial).toEqual(snapshot);
		expect(result.current.group.items).not.toBe(initial.items);
		expect(result.current.group.items[1]).not.toBe(initial.items[1]);
	});
});
