import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import type { CategoryDropdownItem, CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';

export const useCategoryToggle = (
	setData: Dispatch<SetStateAction<CategoryDropDownListProps['categories']>>,
): CategoryDropDownListProps['onSelected'] => {
	const onSelected = useCallback(
		(item: CategoryDropdownItem) =>
			setData((prev) => {
				const isAllCategoriesToggled = item.id === 'all';
				const allCategoriesOption = prev.flatMap((group) => group.items).find(({ id }) => id === 'all');
				const allCategoriesChecked = !allCategoriesOption?.checked;

				const toggled = prev.map((group) => ({
					...group,
					items: group.items.map((category) => {
						if (isAllCategoriesToggled) {
							return { ...category, checked: allCategoriesChecked };
						}

						return category.id === item.id ? { ...category, checked: !category.checked } : category;
					}),
				}));

				const someCategoryUnchecked = toggled.some((group) => group.items.some(({ id, checked }) => id !== 'all' && checked === false));

				if (!someCategoryUnchecked) {
					return toggled;
				}

				return toggled.map((group) => ({
					...group,
					items: group.items.map((category) => (category.id === 'all' ? { ...category, checked: false } : category)),
				}));
			}),
		[setData],
	);

	return onSelected;
};
