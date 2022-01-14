import { useEffect, useMemo, useState } from 'react';

import { Apps } from '../../../../../app/apps/client/orchestrator';
import { CategoryDropdownItem, CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';
import { useCategoryFlatList } from './useCategoryFlatList';
import { useCategoryToggle } from './useCategoryToggle';

// const categories = [
// 	{
// 		items: [
// 			{
// 				id: 'all',
// 				label: 'All categories',
// 			},
// 		],
// 	},
// 	{
// 		label: 'Filter by Category',
// 		items: [
// 			{ id: '0', label: 'Analytics', checked: false },
// 			{ id: '1', label: 'Bots', checked: false },
// 			{ id: '2', label: 'Communication', checked: false },
// 			{ id: '3', label: 'Content Management', checked: false },
// 			{ id: '4', label: 'Customer Support', checked: false },
// 			{ id: '5', label: 'Design', checked: false },
// 			{ id: '6', label: 'Developer Tools', checked: false },
// 			{ id: '7', label: 'File Management', checked: false },
// 			{ id: '8', label: 'Finance', checked: false },
// 			{ id: '9', label: 'Health & Wellness', checked: false },
// 			{ id: '10', label: 'Human Resources', checked: false },
// 			{ id: '11', label: 'Marketing', checked: false },
// 			{ id: '12', label: 'Media & News', checked: false },
// 			{ id: '13', label: 'Office Management', checked: false },
// 			{ id: '14', label: 'Omnichannel', checked: false },
// 			{ id: '15', label: 'Other', checked: false },
// 			{ id: '16', label: 'Productivity', checked: false },
// 			{ id: '17', label: 'Project Management', checked: false },
// 			{ id: '18', label: 'Sales', checked: false },
// 			{ id: '19', label: 'Security & Compliance', checked: false },
// 			{ id: '20', label: 'Social & Fun', checked: false },
// 			{ id: '21', label: 'Team Culture', checked: false },
// 			{ id: '22', label: 'Travel', checked: false },
// 			{ id: '23', label: 'Voice & Video', checked: false },
// 		],
// 	},
// ];

type category = {
	id: string;
	title: string;
	description: string;
	createdDate: string;
	modifiedDate: string;
};

export const useCategories = (): [
	CategoryDropDownListProps['groups'],
	(CategoryDropdownItem & { checked: true })[],
	(CategoryDropdownItem & { checked: true })[],
	CategoryDropDownListProps['onSelected'],
] => {
	const [categories, setCategories] = useState<CategoryDropDownListProps['groups']>([]);

	const fetchCategories = async (): Promise<void> => {
		await Apps.getCategories().then((categories: category[]) => {
			const mappedCategories = categories.map((currentCategory: category) => ({
				id: currentCategory.id,
				label: currentCategory.title,
				checked: false,
			}));

			setCategories([
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
					items: mappedCategories,
				},
			]);
		});
	};

	useEffect(() => {
		const fetchCategoriesWrapper = async (): Promise<void> => {
			await fetchCategories();
		};

		fetchCategoriesWrapper();
	}, []);

	const onSelected = useCategoryToggle(setCategories);
	const flatCategories = useCategoryFlatList(categories);
	const originalSize = useCategoryFlatList(categories).length;

	const selectedCategories = useMemo(
		() => flatCategories.filter((category) => Boolean(category.checked)),
		[flatCategories],
	) as (CategoryDropdownItem & { checked: true })[];
	return [categories, selectedCategories, originalSize === selectedCategories.length ? [] : selectedCategories, onSelected];
};
