import { useCallback, useEffect, useMemo, useState } from 'react';

import { Apps } from '../../../../../app/apps/client/orchestrator';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { CategoryDropdownItem, CategoryDropDownListProps } from '../definitions/CategoryDropdownDefinitions';
import { handleAPIError } from '../helpers';
import { useCategoryFlatList } from './useCategoryFlatList';
import { useCategoryToggle } from './useCategoryToggle';

type Category = {
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
	const t = useTranslation();
	const [categories, setCategories] = useState<CategoryDropDownListProps['groups']>([]);

	const fetchCategories = useCallback(async (): Promise<void> => {
		try {
			const fetchedCategories = await Apps.getCategories();

			const mappedCategories = fetchedCategories.map((currentCategory: Category) => ({
				id: currentCategory.id,
				label: currentCategory.title,
				checked: false,
			}));

			setCategories([
				{
					items: [
						{
							id: 'all',
							label: t('All_categories'),
						},
					],
				},
				{
					label: t('Filter_by_category'),
					items: mappedCategories,
				},
			]);
		} catch (e) {
			handleAPIError(e);
		}
	}, [t]);

	useEffect(() => {
		const fetchCategoriesWrapper = async (): Promise<void> => {
			await fetchCategories();
		};

		fetchCategoriesWrapper();
	}, [fetchCategories]);

	const onSelected = useCategoryToggle(setCategories);
	const flatCategories = useCategoryFlatList(categories);
	const originalSize = useCategoryFlatList(categories).length;

	const selectedCategories = useMemo(
		() => flatCategories.filter((category) => Boolean(category.checked)),
		[flatCategories],
	) as (CategoryDropdownItem & { checked: true })[];
	return [categories, selectedCategories, originalSize === selectedCategories.length ? [] : selectedCategories, onSelected];
};
