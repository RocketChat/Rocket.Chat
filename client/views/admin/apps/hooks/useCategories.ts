import { useState } from 'react';

import { CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';
import { useCategoryToggle } from './useCategoryToggle';

export const useCategories = (): [
	CategoryDropDownListProps['groups'],
	CategoryDropDownListProps['onSelected'],
] => {
	const [data, setData] = useState<CategoryDropDownListProps['groups']>([
		{
			items: [
				{
					id: 'all',
					label: 'All categories',
				},
			],
		},
		{
			label: 'Filter by Category',
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
	]);

	const onSelected = useCategoryToggle(setData);
	return [data, onSelected];
};
