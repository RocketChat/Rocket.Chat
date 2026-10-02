import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppClientOrchestratorInstance } from '../../../apps/orchestrator';
import { marketplaceQueryKeys } from '../../../lib/queryKeys';
import type {
	CategoryDropDownGroups,
	CategoryDropdownItem,
	CategoryOnSelected,
	selectedCategoriesList,
} from '../definitions/CategoryDropdownDefinitions';
import { handleAPIError } from '../helpers/handleAPIError';

export const useCategories = (): [CategoryDropDownGroups, selectedCategoriesList, selectedCategoriesList, CategoryOnSelected] => {
	const { t } = useTranslation();

	const { data: serverCategories = [] } = useQuery({
		queryKey: [...marketplaceQueryKeys.all, 'categories'],
		queryFn: async () => {
			try {
				const categories = await AppClientOrchestratorInstance.getCategories();
				return categories.filter(({ hidden }) => !hidden).map(({ id, title }) => ({ id, label: title }));
			} catch (error) {
				handleAPIError(error);
				throw error;
			}
		},
		retry: false,
	});

	const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

	const items = useMemo(
		() => serverCategories.map((category) => ({ ...category, checked: selectedIds.has(category.id) })),
		[serverCategories, selectedIds],
	);

	const categories = useMemo(
		(): CategoryDropDownGroups =>
			serverCategories.length === 0
				? []
				: [
						{ items: [{ id: 'all', label: t('All_categories'), checked: items.every(({ checked }) => checked) }] },
						{ label: t('Filter_by_category'), items },
					],
		[items, serverCategories.length, t],
	);

	const onSelected = useStableCallback((item: CategoryDropdownItem) => {
		if (item.id === 'all') {
			setSelectedIds(item.checked ? new Set() : new Set(serverCategories.map(({ id }) => id)));
			return;
		}

		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (!next.delete(item.id)) {
				next.add(item.id);
			}
			return next;
		});
	});

	const selectedCategories = useMemo(() => items.filter(({ checked }) => checked), [items]) as (CategoryDropdownItem & {
		checked: true;
	})[];

	return [categories, selectedCategories, items.length === selectedCategories.length ? [] : selectedCategories, onSelected];
};
