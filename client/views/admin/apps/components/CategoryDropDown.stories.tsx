import { Story } from '@storybook/react';
import React, { useCallback, useState } from 'react';

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
				label: 'All categories',
			},
		],
	},
	{
		label: 'Filter by Catergory',
		items: [
			{ id: '0', label: 'Analytics', checked: false },
			{ id: '1', label: 'Bots', checked: false },
			{ id: '2', label: 'Communication', checked: false },
			{ id: '3', label: 'Content Management', checked: false },
			{ id: '4', label: 'Customer Support', checked: false },
			{ id: '5', label: 'Design', checked: false },
			{ id: '6', label: 'Developer Tools', checked: false },
			{ id: '7', label: 'File Management', checked: false },
			{ id: '8', label: 'Finance', checked: false },
			{ id: '9', label: 'Health & Wellness', checked: false },
			{ id: '10', label: 'Human Resources', checked: false },
			{ id: '11', label: 'Marketing', checked: false },
			{ id: '12', label: 'Media & News', checked: false },
			{ id: '13', label: 'Office Management', checked: false },
			{ id: '14', label: 'Omnichannel', checked: false },
			{ id: '15', label: 'Other', checked: false },
			{ id: '16', label: 'Productivity', checked: false },
			{ id: '17', label: 'Project Management', checked: false },
			{ id: '18', label: 'Sales', checked: false },
			{ id: '19', label: 'Security & Compliance', checked: false },
			{ id: '20', label: 'Social & Fun', checked: false },
			{ id: '21', label: 'Team Culture', checked: false },
			{ id: '22', label: 'Travel', checked: false },
			{ id: '23', label: 'Voice & Video', checked: false },
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

				if (itemAll) {
					itemAll.checked = itemsWithoutAll.every((i) => i.checked);
				}

				return [...prev];
			}),
		[],
	);
	return <CategoryDropDownList groups={data} onSelected={onSelected} />;
};
