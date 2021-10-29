import { Story } from '@storybook/react';
import React, { useCallback, useState, useEffect } from 'react';

import CategoryDropDownAnchor from './CategoryDropDownAnchor';
import CategoryDropDownList, {
	CategoryDropdownItem,
	CategoryDropDownListProps,
} from './CategoryDropDownList';

export default {
	title: 'apps/components/CategoryDropDown',
	component: CategoryDropDownAnchor,
};

const testGroup: CategoryDropDownListProps['groups'] = [
	{
		items: [
			{
				id: 'all',
				label: 'All',
			},
		],
	},
	{
		label: 'teste',
		items: [
			{ id: '1', label: '🥒', checked: false },
			{ id: '2', label: '🍆', checked: true },
		],
	},
];

export const Default: Story = () => <CategoryDropDownAnchor />;
export const List: Story = () => {
	const [data, setData] = useState(testGroup);

	const onSelected = useCallback(
		(item: CategoryDropdownItem) =>
			setData((prev) => {
				const items = prev.flatMap((group) => group.items);

				const itemsWithoutAll = items.filter((item) => item.id !== 'all');

				const itemAll = items.find(({ id }) => id === 'all');

				if (item.id === 'all') {
					itemsWithoutAll.forEach((i) => {
						i.checked = !item.checked;
					});
				}

				const itemPrev = prev.flatMap((group) => group.items).find(({ id }) => id === item.id);
				if (itemPrev) {
					itemPrev.checked = !itemPrev.checked;
				}

				itemAll.checked = itemsWithoutAll.every((i) => i.checked);

				return [...prev];
			}),
		[],
	);
	return <CategoryDropDownList groups={data} onSelected={onSelected} />;
};
