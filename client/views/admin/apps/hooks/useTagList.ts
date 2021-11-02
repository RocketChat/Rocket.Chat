import { useCallback, useEffect, useState } from 'react';

import {
	CategoryDropdownItem,
	CategoryDropDownListProps,
} from '../definitions/CategoryDropdownDefinitions';
import { TagListProps } from '../definitions/TagListDefinitions';

export const useTagList = (
	data: CategoryDropDownListProps['groups'],
): [TagListProps['selectedCategories'], TagListProps['onRemoved']] => {
	const [selectedCategories, setSelectedCategories] = useState(
		data
			.flatMap((group) => group.items)
			.filter(({ id, checked }) => id !== 'all' && checked === true),
	);

	useEffect(() => {
		setSelectedCategories(
			data
				.flatMap((group) => group.items)
				.filter(({ id, checked }) => id !== 'all' && checked === true),
		);
	}, [data, selectedCategories]);

	const onRemoved = useCallback(
		(category: CategoryDropdownItem) =>
			setSelectedCategories((prev) => {
				const changedItem = prev.find(({ id }) => id === category.id);

				if (changedItem) {
					changedItem.checked = !changedItem.checked;
				}

				return [...prev];
			}),
		[],
	);

	return [selectedCategories, onRemoved];
};
