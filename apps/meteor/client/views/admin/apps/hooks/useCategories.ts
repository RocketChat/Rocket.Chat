import { useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Apps } from '../../../../../app/apps/client/orchestrator';
import type {
	CategoryDropDownGroups,
	CategoryDropdownItem,
	CategoryDropDownListProps,
	CategoryOnSelected,
	selectedCategoriesList,
} from '../definitions/CategoryDropdownDefinitions';
import { handleAPIError } from '../helpers';
import { useCategoryFlatList } from './useCategoryFlatList';
import { useCategoryToggle } from './useCategoryToggle';

export const useCategories = (): [CategoryDropDownGroups, selectedCategoriesList, selectedCategoriesList, CategoryOnSelected] => {
	const t = useTranslation();
	const [categories, setCategories] = useState<CategoryDropDownListProps['groups']>([]);

	const fetchCategories = useCallback(async (): Promise<void> => {
		try {
			const fetchedCategories = await Apps.getCategories();

			const mappedCategories = fetchedCategories.map((currentCategory) => ({
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
		} catch (e: any) {
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
