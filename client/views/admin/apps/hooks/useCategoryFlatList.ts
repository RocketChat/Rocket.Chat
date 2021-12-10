import { useMemo } from 'react';

import {
	CategoryDropdownItem,
	CategoryDropDownListProps,
} from '../definitions/CategoryDropdownDefinitions';

export const useCategoryFlatList = (
	data: CategoryDropDownListProps['groups'],
): (CategoryDropdownItem & { checked: true })[] =>
	useMemo(
		() =>
			data
				.flatMap((group) => group.items)
				.filter(({ id, checked }) => id !== 'all' && checked === true) as (CategoryDropdownItem & {
				checked: true;
			})[],
		[data],
	);
