import { useMemo } from 'react';

import type { CategoryDropdownItem, CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';

export const useCategoryFlatList = (categories: CategoryDropDownListProps['categories']): CategoryDropdownItem[] =>
	useMemo(() => categories.flatMap((group) => group.items).filter(({ id }) => id !== 'all'), [categories]);
