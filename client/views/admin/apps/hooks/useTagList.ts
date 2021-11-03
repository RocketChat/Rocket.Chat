import { useCallback, useEffect, useState } from 'react';

import {
	CategoryDropdownItem,
	CategoryDropDownListProps,
} from '../definitions/CategoryDropdownDefinitions';
import { TagListProps } from '../definitions/TagListDefinitions';

export const useTagList = (
	data: CategoryDropDownListProps['groups'],
): [TagListProps['selectedCategories'], TagListProps['onClick']] => {
	const [selectedCategories, setSelectedCategories] = useState(() =>
		data
			.flatMap((group) => group.items)
			.filter(({ id, checked }) => id !== 'all' && checked === true),
	);

	useEffect(() => {
		console.log('TESTE');
		setSelectedCategories(
			data
				.flatMap((group) => group.items)
				.filter(({ id, checked }) => id !== 'all' && checked === true),
		);
	}, [data, selectedCategories]);

	const onClick = useCallback(
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

	return [selectedCategories, onClick];
};
