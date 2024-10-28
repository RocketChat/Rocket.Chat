import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useController, useForm, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FilterByText from '../../../components/FilterByText';
import CategoryDropDown from '../components/CategoryFilter/CategoryDropDown';
import TagList from '../components/CategoryFilter/TagList';
import RadioDropDown from '../components/RadioDropDown/RadioDropDown';
import type { CategoryDropDownGroups, CategoryDropdownItem, selectedCategoriesList } from '../definitions/CategoryDropdownDefinitions';
import type { RadioDropDownGroup, RadioDropDownItem } from '../definitions/RadioDropDownDefinitions';
import { useAppsOrchestrator } from '../hooks/useAppsOrchestrator';
import type { PurchaseType, SortingMethod, Status } from '../hooks/useFilteredAppsQuery';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';

export type AppFilters = {
	text: string;
	purchaseType: PurchaseType;
	status: Status;
	categories: string[];
	sortingMethod: SortingMethod;
};

export const useSearchFiltersForm = () => {
	const context = useMarketplaceContext();

	return useForm<AppFilters>({
		defaultValues: {
			text: '',
			purchaseType: 'all',
			status: 'all',
			categories: [],
			sortingMethod: context === 'requested' ? 'urf' : 'mru',
		},
	});
};

export const useSearchFiltersFormContext = () => useFormContext<AppFilters>();

const SearchFiltersForm = () => {
	const context = useMarketplaceContext();
	const { control } = useFormContext<AppFilters>();
	const { field: textField } = useController({ control, name: 'text' });
	const { field: purchaseTypeField } = useController({ control, name: 'purchaseType' });
	const { field: statusField } = useController({ control, name: 'status' });
	const { field: categoriesField } = useController({ control, name: 'categories' });
	const { field: sortingMethodField } = useController({ control, name: 'sortingMethod' });

	const { t } = useTranslation();

	const textPlaceholders = {
		explore: t('Search_Apps'),
		enterprise: t('Search_Premium_Apps'),
		premium: t('Search_Premium_Apps'),
		installed: t('Search_Installed_Apps'),
		requested: t('Search_Requested_Apps'),
		private: t('Search_Private_apps'),
	};

	const breakpoints = useBreakpoints();
	const fixFiltersSize = breakpoints.includes('lg') ? { maxWidth: 'x200', minWidth: 'x200' } : {};

	const purchaseTypeDropDownGroup = useMemo(
		(): RadioDropDownGroup => ({
			label: t('Filter_By_Price'),
			items: [
				{ id: 'all', label: t('All_Prices'), checked: purchaseTypeField.value === 'all' },
				{ id: 'free', label: t('Free_Apps'), checked: purchaseTypeField.value === 'free' },
				{ id: 'paid', label: t('Paid_Apps'), checked: purchaseTypeField.value === 'paid' },
				{ id: 'premium', label: t('Premium'), checked: purchaseTypeField.value === 'premium' },
			],
		}),
		[purchaseTypeField.value, t],
	);

	const statusDropDownGroup = useMemo(
		(): RadioDropDownGroup => ({
			label: t('Filter_By_Status'),
			items: [
				{ id: 'all', label: t('All_status'), checked: statusField.value === 'all' },
				{ id: 'enabled', label: t('Enabled'), checked: statusField.value === 'enabled' },
				{ id: 'disabled', label: t('Disabled'), checked: statusField.value === 'disabled' },
			],
		}),
		[statusField.value, t],
	);

	const appsOrchestrator = useAppsOrchestrator();

	const categoryQueryResult = useQuery({
		queryKey: ['marketplace', 'categories'] as const,
		queryFn: async () => {
			const categories = await appsOrchestrator.getCategories();
			return Array.from(new Set(categories.map((category) => category.title)));
		},
		staleTime: Infinity,
	});

	const categoryDropDownGroups = useMemo((): CategoryDropDownGroups => {
		if (!categoryQueryResult.isSuccess) {
			return [];
		}

		return [
			{
				items: [
					{
						id: 'all',
						label: t('All_categories'),
						checked: categoriesField.value.length === categoryQueryResult.data.length,
					},
				],
			},
			{
				label: t('Filter_by_category'),
				items: categoryQueryResult.data.map((category) => ({
					id: category,
					label: category,
					checked: categoriesField.value.includes(category),
				})),
			},
		];
	}, [categoriesField.value, categoryQueryResult.data, categoryQueryResult.isSuccess, t]);

	const selectedCategories = useMemo((): selectedCategoriesList => {
		if (categoryDropDownGroups.length === 0) {
			return [];
		}

		return categoryDropDownGroups[1].items.filter((item): item is CategoryDropdownItem & { checked: true } => item.checked ?? false);
	}, [categoryDropDownGroups]);

	const sortingMethodDropDownGroup = useMemo(
		(): RadioDropDownGroup => ({
			label: t('Sort_By'),
			items: [
				...(context === 'requested'
					? [
							{ id: 'urf', label: t('Unread_Requested_First'), checked: sortingMethodField.value === 'urf' },
							{ id: 'url', label: t('Unread_Requested_Last'), checked: sortingMethodField.value === 'url' },
						]
					: []),
				{ id: 'az', label: 'A-Z', checked: sortingMethodField.value === 'az' },
				{ id: 'za', label: 'Z-A', checked: sortingMethodField.value === 'za' },
				{ id: 'mru', label: t('Most_recent_updated'), checked: sortingMethodField.value === 'mru' },
				{ id: 'lru', label: t('Least_recent_updated'), checked: sortingMethodField.value === 'lru' },
			],
		}),
		[context, sortingMethodField.value, t],
	);

	const categoryTagList = useMemo(() => {
		if ((categoriesField.value.length === 0 || categoriesField.value.length === categoryQueryResult.data?.length) ?? 0) {
			return [];
		}

		return selectedCategories;
	}, [categoriesField.value.length, categoryQueryResult.data?.length, selectedCategories]);

	const handlePurchaseTypeChange = useEffectEvent((item: RadioDropDownItem) => {
		purchaseTypeField.onChange(item.id as PurchaseType);
	});

	const handleStatusChange = useEffectEvent((item: RadioDropDownItem) => {
		statusField.onChange(item.id as Status);
	});

	const handleCategoriesChange = useEffectEvent((item: CategoryDropdownItem) => {
		if (item.id === 'all') {
			if (item.checked) {
				categoriesField.onChange([]);
				return;
			}

			categoriesField.onChange(categoryQueryResult.data ?? []);
			return;
		}

		if (item.checked) {
			categoriesField.onChange(categoriesField.value.filter((category) => category !== item.id));

			return;
		}
		categoriesField.onChange([...categoriesField.value, item.id]);
	});

	const handleSortingMethodChange = useEffectEvent((item: RadioDropDownItem) => {
		sortingMethodField.onChange(item.id as SortingMethod);
	});

	return (
		<Box pi={24}>
			<FilterByText ref={textField.ref} value={textField.value} onChange={textField.onChange} placeholder={textPlaceholders[context]}>
				{context !== 'private' && (
					<RadioDropDown
						label={t('Filter_By_Price')}
						group={purchaseTypeDropDownGroup}
						onSelected={handlePurchaseTypeChange}
						flexGrow={1}
						{...fixFiltersSize}
					/>
				)}
				<RadioDropDown
					label={t('Filter_By_Status')}
					group={statusDropDownGroup}
					onSelected={handleStatusChange}
					flexGrow={1}
					{...fixFiltersSize}
				/>
				{context !== 'private' && (
					<CategoryDropDown
						categories={categoryDropDownGroups}
						selectedCategories={selectedCategories}
						onSelected={handleCategoriesChange}
						flexGrow={1}
					/>
				)}
				<RadioDropDown
					label={t('Sort_By')}
					group={sortingMethodDropDownGroup}
					onSelected={handleSortingMethodChange}
					flexGrow={1}
					{...fixFiltersSize}
				/>
			</FilterByText>
			<TagList categories={categoryTagList} onClick={handleCategoriesChange} />
		</Box>
	);
};

export default SearchFiltersForm;
