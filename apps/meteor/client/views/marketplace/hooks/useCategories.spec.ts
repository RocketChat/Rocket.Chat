import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useCategories } from './useCategories';

jest.mock('../../../apps/orchestrator', () => ({
	AppClientOrchestratorInstance: {
		getCategories: async () => [
			{ id: 'a', title: 'Analytics', hidden: false },
			{ id: 'b', title: 'Bots', hidden: false },
			{ id: 'h', title: 'Hidden', hidden: true },
		],
	},
}));

const renderCategories = () => renderHook(() => useCategories(), { wrapper: mockAppRoot().build() });

it('should list the visible categories, none selected', async () => {
	const { result } = renderCategories();

	await waitFor(() => expect(result.current[0]).toHaveLength(2));

	const [categories, selected, tags] = result.current;
	expect(categories[1].items.map(({ id }) => id)).toEqual(['a', 'b']);
	expect(selected).toEqual([]);
	expect(tags).toEqual([]);
});

it('should toggle a single category', async () => {
	const { result } = renderCategories();
	await waitFor(() => expect(result.current[0]).toHaveLength(2));

	act(() => result.current[3]({ id: 'a', label: 'Analytics' }));

	expect(result.current[1].map(({ id }) => id)).toEqual(['a']);
	expect(result.current[2].map(({ id }) => id)).toEqual(['a']);
	expect(result.current[0][0].items[0].checked).toBe(false);

	act(() => result.current[3]({ id: 'a', label: 'Analytics', checked: true }));

	expect(result.current[1]).toEqual([]);
});

it('should select and clear every category through "all"', async () => {
	const { result } = renderCategories();
	await waitFor(() => expect(result.current[0]).toHaveLength(2));

	act(() => result.current[3](result.current[0][0].items[0]));

	expect(result.current[1].map(({ id }) => id)).toEqual(['a', 'b']);
	expect(result.current[2]).toEqual([]);
	expect(result.current[0][0].items[0].checked).toBe(true);

	act(() => result.current[3](result.current[0][0].items[0]));

	expect(result.current[1]).toEqual([]);
});
