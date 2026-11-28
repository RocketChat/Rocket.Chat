import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';

import { useCategoryToggle } from './useCategoryToggle';
import type { CategoryDropDownGroups } from '../definitions/CategoryDropdownDefinitions';

const createCategories = (): CategoryDropDownGroups => [
	{ items: [{ id: 'all', label: 'All categories' }] },
	{
		label: 'Filter by category',
		items: [
			{ id: 'chat', label: 'Chat', checked: false },
			{ id: 'ai', label: 'AI', checked: false },
		],
	},
];

const renderCategoryToggle = (initial: CategoryDropDownGroups) =>
	renderHook(() => {
		const [categories, setCategories] = useState(initial);
		return { categories, onSelected: useCategoryToggle(setCategories) };
	});

const checkedById = (categories: CategoryDropDownGroups) =>
	Object.fromEntries(categories.flatMap(({ items }) => items).map(({ id, checked }) => [id, Boolean(checked)]));

describe('useCategoryToggle', () => {
	it('toggles a single category', () => {
		const { result } = renderCategoryToggle(createCategories());

		act(() => result.current.onSelected(result.current.categories[1].items[0]));
		expect(checkedById(result.current.categories)).toEqual({ all: false, chat: true, ai: false });

		act(() => result.current.onSelected(result.current.categories[1].items[0]));
		expect(checkedById(result.current.categories)).toEqual({ all: false, chat: false, ai: false });
	});

	it('checks and unchecks every category with "All categories"', () => {
		const { result } = renderCategoryToggle(createCategories());

		act(() => result.current.onSelected(result.current.categories[0].items[0]));
		expect(checkedById(result.current.categories)).toEqual({ all: true, chat: true, ai: true });

		act(() => result.current.onSelected(result.current.categories[0].items[0]));
		expect(checkedById(result.current.categories)).toEqual({ all: false, chat: false, ai: false });
	});

	it('unchecks "All categories" when a category is unchecked', () => {
		const { result } = renderCategoryToggle(createCategories());

		act(() => result.current.onSelected(result.current.categories[0].items[0]));
		act(() => result.current.onSelected(result.current.categories[1].items[1]));

		expect(checkedById(result.current.categories)).toEqual({ all: false, chat: true, ai: false });
	});

	// Memoized consumers (React Compiler) only re-render when the groups and items are new references.
	it('replaces the toggled items instead of mutating them', () => {
		const initial = createCategories();
		const snapshot = createCategories();
		const { result } = renderCategoryToggle(initial);

		act(() => result.current.onSelected(result.current.categories[1].items[0]));

		expect(initial).toEqual(snapshot);
		expect(result.current.categories[1].items).not.toBe(initial[1].items);
		expect(result.current.categories[1].items[0]).not.toBe(initial[1].items[0]);
	});
});
