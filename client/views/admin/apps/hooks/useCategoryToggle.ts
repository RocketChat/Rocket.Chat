import { Dispatch, SetStateAction, useCallback } from 'react';

import {
	CategoryDropdownItem,
	CategoryDropDownListProps,
} from '../definitions/CategoryDropdownDefinitions';

export const useCategoryToggle = (
	setData: Dispatch<SetStateAction<CategoryDropDownListProps['groups']>>,
): CategoryDropDownListProps['onSelected'] => {
	const onSelected = useCallback(
		(item: CategoryDropdownItem) =>
			setData((prev) => {
				const items = prev.flatMap((group) => group.items);

				const itemsWithoutAll = items.filter(({ id }) => id !== 'all');
				const itemAll = items.find(({ id }) => id === 'all');
				const itemPrev = items.find(({ id }) => id === item.id);

				if (item.id === 'all' && item.checked === false) {
					itemsWithoutAll.forEach((i) => {
						i.checked = true;
					});
				}

				if (itemPrev) {
					itemPrev.checked = !itemPrev.checked;
				}

				if (
					itemAll &&
					itemsWithoutAll.some((currentCategory) => currentCategory.checked === false)
				) {
					itemAll.checked = false;
				}

				return [...prev];
			}),
		[setData],
	);

	return onSelected;
};
