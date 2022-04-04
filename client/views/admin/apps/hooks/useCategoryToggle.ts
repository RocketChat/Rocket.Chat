import { Dispatch, SetStateAction, useCallback } from 'react';

import { CategoryDropdownItem, CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';

export const useCategoryToggle = (
	setData: Dispatch<SetStateAction<CategoryDropDownListProps['groups']>>,
): CategoryDropDownListProps['onSelected'] => {
	const onSelected = useCallback(
		(item: CategoryDropdownItem) =>
			setData((prev) => {
				const categories = prev.flatMap((group) => group.items);

				const categoriesWithoutAll = categories.filter(({ id }) => id !== 'all');
				const allCategoriesOption = categories.find(({ id }) => id === 'all');
				const toggledCategory = categories.find(({ id }) => id === item.id);

				const isAllCategoriesToggled = item.id === 'all';
				if (isAllCategoriesToggled) {
					categoriesWithoutAll.forEach((currentItem) => {
						currentItem.checked = !item.checked;
					});
				}

				if (toggledCategory) {
					toggledCategory.checked = !toggledCategory.checked;
				}

				if (allCategoriesOption && categoriesWithoutAll.some((currentCategory) => currentCategory.checked === false)) {
					allCategoriesOption.checked = false;
				}

				return [...prev];
			}),
		[setData],
	);

	return onSelected;
};
